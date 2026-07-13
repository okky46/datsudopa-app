
// 公式レイド参加記録のSupabase同期。
// レイド1回あたりの通信は最大2回（開始時の保存・終了時の更新）。
// 通信失敗時は端末内キューに残し、次回起動やリザルト表示時に再送する。
// 通信の完了を視聴開始・リザルト表示・ローカル記録の条件には決してしない。

import { WatchSession } from '../types/session';
import { RaidSyncItem, StorageService } from './StorageService';
import { SupabaseService, withTimeout } from './SupabaseService';

const SYNC_TIMEOUT_MS = 8000;

/** 一意制約違反（同じレイドに別セッションが登録済み）は再送しても直らないので破棄する */
const UNIQUE_VIOLATION = '23505';

let flushing = false;

export class RaidSyncService {
  static async enqueueStart(session: WatchSession, publicName: string): Promise<void> {
    if (session.kind !== 'raid' || !session.raidId) {
      return;
    }
    const queue = await StorageService.getRaidSyncQueue();
    queue.push({
      type: 'start',
      sessionId: session.sessionId,
      raidId: session.raidId,
      status: 'started',
      startedAt: session.startedAt,
      watchedSeconds: 0,
      publicNameSnapshot: publicName,
      queuedAt: new Date().toISOString(),
    });
    await StorageService.saveRaidSyncQueue(queue);
    void RaidSyncService.flush();
  }

  static async enqueueFinish(session: WatchSession, publicName: string): Promise<void> {
    if (session.kind !== 'raid' || !session.raidId) {
      return;
    }
    const queue = await StorageService.getRaidSyncQueue();
    queue.push({
      type: 'finish',
      sessionId: session.sessionId,
      raidId: session.raidId,
      status: session.status === 'completed' ? 'completed' : 'exited',
      startedAt: session.startedAt,
      finishedAt: session.endedAt ?? new Date().toISOString(),
      watchedSeconds: session.watchedSeconds,
      publicNameSnapshot: publicName,
      queuedAt: new Date().toISOString(),
    });
    await StorageService.saveRaidSyncQueue(queue);
    void RaidSyncService.flush();
  }

  /** キューを順に送信。失敗したらそこで止めて残す（順序を保つ） */
  static async flush(): Promise<void> {
    if (flushing || !SupabaseService.isConfigured()) {
      return;
    }
    flushing = true;
    try {
      let queue = await StorageService.getRaidSyncQueue();
      if (queue.length === 0) {
        return;
      }
      const userId = await SupabaseService.ensureSignedIn();
      const supabase = SupabaseService.getClient();
      if (!userId || !supabase) {
        return;
      }

      while (queue.length > 0) {
        const item = queue[0];
        const sent = await RaidSyncService.sendItem(item, userId);
        if (!sent) {
          break;
        }
        queue = queue.slice(1);
        await StorageService.saveRaidSyncQueue(queue);
      }
    } finally {
      flushing = false;
    }
  }

  private static async sendItem(item: RaidSyncItem, userId: string): Promise<boolean> {
    const supabase = SupabaseService.getClient();
    if (!supabase) {
      return false;
    }
    try {
      const { error } = await withTimeout(
        Promise.resolve(
          supabase.from('raid_participations').upsert(
            {
              session_id: item.sessionId,
              raid_id: item.raidId,
              user_id: userId,
              public_name_snapshot: item.publicNameSnapshot,
              status: item.status,
              started_at: item.startedAt,
              finished_at: item.finishedAt ?? null,
              watched_seconds: item.watchedSeconds,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'session_id' },
          ),
        ),
        SYNC_TIMEOUT_MS,
      );
      if (!error) {
        return true;
      }
      // 再送しても直らないエラー（同一レイドの重複参加など）はキューから落とす
      return error.code === UNIQUE_VIOLATION;
    } catch {
      return false;
    }
  }
}
