// 公式レイド参加記録のSupabase同期。
// 通信の完了を視聴開始・リザルト表示・ローカル記録の条件には決してしない。

import * as Crypto from 'expo-crypto';
import { WatchSession } from '../types/session';
import { Mutex } from '../utils/mutex';
import { ProfileService } from './ProfileService';
import { RaidSyncItem, StorageService } from './StorageService';
import { SupabaseService, withTimeout } from './SupabaseService';

const SYNC_TIMEOUT_MS = 8000;
const MAX_PROFILE_REPAIR_ATTEMPTS = 2;

const queueMutex = new Mutex();
let flushPromise: Promise<void> | null = null;


async function loadQueueWithIds(): Promise<RaidSyncItem[]> {
  const queue = await StorageService.getRaidSyncQueue();
  let changed = false;
  const withIds = queue.map((item, index) => {
    if (item.syncItemId) {
      return item;
    }
    changed = true;
    return {
      ...item,
      syncItemId: Crypto.randomUUID() || `${item.sessionId}-${item.type}-${item.queuedAt ?? index}-${Date.now()}-${index}`,
    };
  });
  if (changed) {
    await StorageService.saveRaidSyncQueue(withIds);
  }
  return withIds;
}

async function markSessionUnsynced(sessionId: string): Promise<void> {
  const sessions = await StorageService.getSessions();
  let changed = false;
  const next = sessions.map((session) => {
    if (session.sessionId !== sessionId || session.serverSyncStatus === 'unsynced') {
      return session;
    }
    changed = true;
    return { ...session, serverSyncStatus: 'unsynced' as const };
  });
  if (changed) {
    await StorageService.saveSessions(next);
  }
}

export class RaidSyncService {
  static async enqueueStart(session: WatchSession): Promise<void> {
    if (session.kind !== 'raid' || !session.raidId) {
      return;
    }
    const raidId = session.raidId;
    await queueMutex.runExclusive(async () => {
      const queue = await loadQueueWithIds();
      queue.push({
        syncItemId: Crypto.randomUUID() || `${session.sessionId}-start-${Date.now()}`,
        type: 'start',
        sessionId: session.sessionId,
        raidId,
        status: 'started',
        watchedSeconds: 0,
        startedAt: session.startedAt,
        queuedAt: new Date().toISOString(),
      });
      await StorageService.saveRaidSyncQueue(queue);
    });
    void RaidSyncService.flush();
  }

  static async enqueueFinish(session: WatchSession): Promise<void> {
    if (session.kind !== 'raid' || !session.raidId) {
      return;
    }
    const raidId = session.raidId;
    await queueMutex.runExclusive(async () => {
      const queue = await loadQueueWithIds();
      if (queue.some((item) => item.type === 'finish' && item.sessionId === session.sessionId)) {
        return;
      }
      queue.push({
        syncItemId: Crypto.randomUUID() || `${session.sessionId}-finish-${Date.now()}`,
        type: 'finish',
        sessionId: session.sessionId,
        raidId,
        status: session.status === 'completed' ? 'completed' : 'exited',
        watchedSeconds: session.watchedSeconds,
        queuedAt: new Date().toISOString(),
      });
      await StorageService.saveRaidSyncQueue(queue);
    });
    void RaidSyncService.flush();
  }

  static async flush(): Promise<void> {
    if (flushPromise) {
      return flushPromise;
    }
    flushPromise = RaidSyncService.flushInternal().finally(() => {
      flushPromise = null;
    });
    return flushPromise;
  }

  private static async flushInternal(): Promise<void> {
    if (!SupabaseService.isConfigured()) {
      return;
    }
    const profileSyncResult = await ProfileService.flushPendingSync();
    if (profileSyncResult === 'retry') {
      return;
    }
    if (profileSyncResult === 'rejected') {
      await RaidSyncService.discardAllQueuedStartsAsUnsynced();
      return;
    }
    const userId = await SupabaseService.ensureSignedIn();
    const supabase = SupabaseService.getClient();
    if (!userId || !supabase) {
      return;
    }

    const sentIds = new Set<string>();
    const failedStartSessionIds = new Set<string>();
    const repairedProfileSessionIds = new Set<string>();

    while (true) {
      const item = await queueMutex.runExclusive(async () => {
        const queue = await loadQueueWithIds();
        return RaidSyncService.nextSendableItem(queue, sentIds, failedStartSessionIds);
      });
      if (!item) {
        break;
      }

      const result = await RaidSyncService.sendItem(item);
      if (result === 'retry') {
        break;
      }
      if (result === 'profile_not_ready') {
        const repaired = await RaidSyncService.repairProfileNotReady(item, repairedProfileSessionIds);
        if (repaired === 'retry_after_repair') {
          continue;
        }
        if (repaired === 'discard_with_finish') {
          failedStartSessionIds.add(item.sessionId);
          sentIds.add(item.syncItemId!);
          await markSessionUnsynced(item.sessionId);
          await queueMutex.runExclusive(async () => {
            const current = await loadQueueWithIds();
            const next = current.filter((queued) => queued.sessionId !== item.sessionId);
            await StorageService.saveRaidSyncQueue(next);
          });
          continue;
        }
        break;
      }
      if (result === 'discard_with_finish') {
        failedStartSessionIds.add(item.sessionId);
      }
      sentIds.add(item.syncItemId!);
      if (result === 'discard_with_finish') {
        await markSessionUnsynced(item.sessionId);
      }

      await queueMutex.runExclusive(async () => {
        const current = await loadQueueWithIds();
        const next = current.filter((queued) => {
          if (queued.syncItemId === item.syncItemId) {
            return false;
          }
          return !(result === 'discard_with_finish' && queued.sessionId === item.sessionId && queued.type === 'finish');
        });
        await StorageService.saveRaidSyncQueue(next);
      });
    }
  }

  private static async repairProfileNotReady(
    item: RaidSyncItem,
    repairedProfileSessionIds: Set<string>,
  ): Promise<'retry_after_repair' | 'retry_later' | 'discard_with_finish'> {
    const attempts = item.profileRepairAttempts ?? 0;
    if (attempts >= MAX_PROFILE_REPAIR_ATTEMPTS) {
      return 'discard_with_finish';
    }

    await queueMutex.runExclusive(async () => {
      const current = await loadQueueWithIds();
      const next = current.map((queued) => queued.syncItemId === item.syncItemId
        ? { ...queued, profileRepairAttempts: attempts + 1 }
        : queued);
      await StorageService.saveRaidSyncQueue(next);
    });

    if (repairedProfileSessionIds.has(item.sessionId)) {
      return 'retry_later';
    }
    repairedProfileSessionIds.add(item.sessionId);

    const profileSyncResult = await ProfileService.forceSyncCurrentPublicName();
    if (profileSyncResult === 'synced') {
      return 'retry_after_repair';
    }
    if (profileSyncResult === 'rejected') {
      return 'discard_with_finish';
    }
    return 'retry_later';
  }

  private static async discardAllQueuedStartsAsUnsynced(): Promise<void> {
    const discardedSessionIds = new Set<string>();
    await queueMutex.runExclusive(async () => {
      const current = await loadQueueWithIds();
      for (const item of current) {
        if (item.type === 'start') {
          discardedSessionIds.add(item.sessionId);
        }
      }
      const next = current.filter((item) => {
        if (item.type === 'start') {
          return false;
        }
        return !(discardedSessionIds.has(item.sessionId) && item.type === 'finish');
      });
      await StorageService.saveRaidSyncQueue(next);
    });
    await Promise.all(Array.from(discardedSessionIds).map((sessionId) => markSessionUnsynced(sessionId)));
  }

  private static nextSendableItem(
    queue: RaidSyncItem[],
    sentIds: Set<string>,
    failedStartSessionIds: Set<string>,
  ): RaidSyncItem | null {
    for (const item of queue) {
      if (item.syncItemId && sentIds.has(item.syncItemId)) {
        continue;
      }
      if (item.type === 'finish') {
        if (failedStartSessionIds.has(item.sessionId)) {
          return item;
        }
        const pendingStart = queue.find(
          (candidate) => candidate.type === 'start'
            && candidate.sessionId === item.sessionId
            && !(candidate.syncItemId && sentIds.has(candidate.syncItemId)),
        );
        if (pendingStart) {
          continue;
        }
      }
      return item;
    }
    return null;
  }

  private static async sendItem(item: RaidSyncItem): Promise<'remove' | 'retry' | 'discard_with_finish' | 'profile_not_ready'> {
    const supabase = SupabaseService.getClient();
    if (!supabase) {
      return 'retry';
    }
    try {
      const call =
        item.type === 'start'
          ? supabase.rpc('start_raid_participation', {
              p_session_id: item.sessionId,
              p_raid_id: item.raidId,
              p_started_at: item.startedAt,
            })
          : supabase.rpc('finish_raid_participation', {
              p_session_id: item.sessionId,
              p_status: item.status === 'completed' ? 'completed' : 'exited',
              p_watched_seconds: item.watchedSeconds,
            });
      const { error } = await withTimeout(Promise.resolve(call), SYNC_TIMEOUT_MS);
      if (!error) {
        return 'remove';
      }
      if (item.type === 'start' && isProfileNotReadyError(error)) {
        return 'profile_not_ready';
      }
      if (isStartDiscardError(error)) {
        return 'discard_with_finish';
      }
      return isNonRetryableError(error) ? 'remove' : 'retry';
    } catch {
      return 'retry';
    }
  }
}

function errorMessage(error: { message?: string } | null): string {
  return (error?.message ?? '').toLowerCase();
}

function isProfileNotReadyError(error: { message?: string } | null): boolean {
  return errorMessage(error).includes('profile_not_ready');
}

function isStartDiscardError(error: { code?: string; message?: string } | null): boolean {
  const message = errorMessage(error);
  return message.includes('raid_window_closed')
    || message.includes('invalid_started_at')
    || message.includes('duplicate_participation')
    || message.includes('profile_blocked')
    || message.includes('invalid_raid_id');
}

function isNonRetryableError(error: { code?: string; message?: string } | null): boolean {
  const code = error?.code;
  const message = errorMessage(error);
  return code === '23505'
    || message.includes('invalid status')
    || isStartDiscardError(error);
}
