
// 公式レイド参加記録のSupabase同期。
// レイド1回あたりの通信は最大2回（開始時の保存・終了時の更新）。
// 直接テーブルupsertはRLSで封じられており、専用RPC start/finish_raid_participation を使う。
// サーバー側で user_id / public_name_snapshot / started_at / finished_at / 公式時間判定を決定するため、
// 改造クライアントからの不正値注入・端末時計の偽装ができない。
// 通信失敗（ネットワーク/タイムアウト）時は端末内キューに残し、次回起動やリザルト表示時に再送する。
// 通信の完了を視聴開始・リザルト表示・ローカル記録の条件には決してしない。

import { WatchSession } from '../types/session';
import { RaidSyncItem, StorageService } from './StorageService';
import { SupabaseService, withTimeout } from './SupabaseService';

const SYNC_TIMEOUT_MS = 8000;

let flushing = false;

export class RaidSyncService {
  static async enqueueStart(session: WatchSession): Promise<void> {
    if (session.kind !== 'raid' || !session.raidId) {
      return;
    }
    const queue = await StorageService.getRaidSyncQueue();
    queue.push({
      type: 'start',
      sessionId: session.sessionId,
      raidId: session.raidId,
      status: 'started',
      watchedSeconds: 0,
      queuedAt: new Date().toISOString(),
    });
    await StorageService.saveRaidSyncQueue(queue);
    void RaidSyncService.flush();
  }

  static async enqueueFinish(session: WatchSession): Promise<void> {
    if (session.kind !== 'raid' || !session.raidId) {
      return;
    }
    const queue = await StorageService.getRaidSyncQueue();
    queue.push({
      type: 'finish',
      sessionId: session.sessionId,
      raidId: session.raidId,
      status: session.status === 'completed' ? 'completed' : 'exited',
      watchedSeconds: session.watchedSeconds,
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
        const remove = await RaidSyncService.sendItem(item);
        if (!remove) {
          break; // ネットワーク/タイムアウト。順序を保つためここで止めて次回再送
        }
        queue = queue.slice(1);
        await StorageService.saveRaidSyncQueue(queue);
      }
    } finally {
      flushing = false;
    }
  }

  /**
   * 1件送信する。戻り値はキューから除去してよいか。
   * - 成功: 除去
   * - サーバーが確定的エラーを返した（公式時間外・重複・不正status等の再送不能エラー）: 除去
   * - ネットワーク/タイムアウトで応答なし: 残す（次回再送）
   */
  private static async sendItem(item: RaidSyncItem): Promise<boolean> {
    const supabase = SupabaseService.getClient();
    if (!supabase) {
      return false;
    }
    try {
      const call =
        item.type === 'start'
          ? supabase.rpc('start_raid_participation', {
              p_session_id: item.sessionId,
              p_raid_id: item.raidId,
            })
          : supabase.rpc('finish_raid_participation', {
              p_session_id: item.sessionId,
              p_status: item.status === 'completed' ? 'completed' : 'exited',
              p_watched_seconds: item.watchedSeconds,
            });
      // error===null は成功。errorオブジェクトはサーバーが応答した確定的エラー
      // （公式時間外・重複・不正status等で再送不能）。どちらもキューから除去する。
      await withTimeout(Promise.resolve(call), SYNC_TIMEOUT_MS);
      return true;
    } catch {
      // ネットワーク/タイムアウト（応答なし）。キューに残して再送する
      return false;
    }
  }
}
