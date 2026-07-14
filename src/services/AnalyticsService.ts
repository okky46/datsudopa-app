
// 分析イベントは即時送信せず、端末内キューへ貯めてまとめて送る。
// 送信先はSupabaseの analytics_events テーブル。未設定なら送信せずキューだけ回す。
//
// 信頼性の要点:
//   - 各イベントに event_id(UUID) を付与。DB側は event_id 一意 + upsert(重複無視)で二重保存しない
//   - track と「送信済みの除去」は mutex で直列化し、read-modify-write の競合による欠落を防ぐ
//   - 送信はネットワークI/O中に mutex を保持しない。送信成功後に該当 event_id だけを除去するため、
//     flush 中に track で追加されたイベントは失われない
//   - キューは上限を超えると古いものから破棄する（StorageService.saveAnalyticsQueue）
//   - すべてベストエフォート。失敗してもアプリの中心動作をブロックしない

import * as Crypto from 'expo-crypto';
import { AnalyticsQueueItem, StorageService } from './StorageService';
import { SupabaseService, withTimeout } from './SupabaseService';
import { Mutex } from '../utils/mutex';

const SEND_TIMEOUT_MS = 8000;
const BATCH_SIZE = 50;
/** これ未満の件数では自動フラッシュしない（通信を増やしすぎない） */
const MIN_FLUSH_COUNT = 10;

// track と removeSent（送信済み除去）を直列化するキュー操作の排他
const queueMutex = new Mutex();
let flushing = false;

export type AnalyticsEvent =
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'notification_permission_requested'
  | 'notification_permission_granted'
  | 'notification_permission_denied'
  | 'first_long_started'
  | 'first_long_30s_reached'
  | 'first_long_completed'
  | 'raid_notification_opened'
  | 'raid_started'
  | 'raid_start_rejected'
  | 'raid_30s_reached'
  | 'raid_60s_reached'
  | 'raid_completed'
  | 'raid_exited'
  | 'catchup_long_started'
  | 'long_started'
  | 'long_completed'
  | 'share_sheet_opened'
  | 'video_fallback_used'
  | 'ad_impression';


async function loadQueueWithEventIds(): Promise<AnalyticsQueueItem[]> {
  const queue = await StorageService.getAnalyticsQueue();
  let changed = false;
  const withIds = queue.map((item, index) => {
    if (item.eventId) {
      return item;
    }
    changed = true;
    return {
      ...item,
      eventId: Crypto.randomUUID() || `${item.event}-${item.occurredAt}-${Date.now()}-${index}`,
    };
  });
  if (changed) {
    await StorageService.saveAnalyticsQueue(withIds);
  }
  return withIds;
}

export class AnalyticsService {
  static async track(event: AnalyticsEvent, properties?: Record<string, string | number | boolean>): Promise<void> {
    try {
      const item: AnalyticsQueueItem = {
        eventId: Crypto.randomUUID(),
        event,
        properties,
        occurredAt: new Date().toISOString(),
      };
      await queueMutex.runExclusive(async () => {
        const queue = await loadQueueWithEventIds();
        queue.push(item);
        await StorageService.saveAnalyticsQueue(queue);
      });
    } catch {
      // 分析はベストエフォート。失敗してもアプリの動作に影響させない
    }
  }

  /** 送信成功した event_id をキューから除去する（track と競合しないよう mutex 内で filter） */
  private static async removeSent(sentIds: Set<string>): Promise<void> {
    await queueMutex.runExclusive(async () => {
      const queue = await loadQueueWithEventIds();
      await StorageService.saveAnalyticsQueue(queue.filter((item) => !item.eventId || !sentIds.has(item.eventId)));
    });
  }

  /**
   * キューをまとめて送信。force=false のときは一定件数たまるまで送らない。
   * 起動時・リザルト表示後などの節目でのみ呼ぶ。多重flushは1つに抑える。
   */
  static async flush(force = false): Promise<void> {
    if (flushing || !SupabaseService.isConfigured()) {
      return;
    }
    flushing = true;
    try {
      const snapshot = await queueMutex.runExclusive(loadQueueWithEventIds);
      if (snapshot.length === 0 || (!force && snapshot.length < MIN_FLUSH_COUNT)) {
        return;
      }
      const userId = await SupabaseService.ensureSignedIn();
      const supabase = SupabaseService.getClient();
      if (!userId || !supabase) {
        return;
      }

      for (let offset = 0; offset < snapshot.length; offset += BATCH_SIZE) {
        const batch = snapshot.slice(offset, offset + BATCH_SIZE);
        const rows = batch.map((item) => ({
          event_id: item.eventId!,
          user_id: userId,
          event: item.event,
          properties: item.properties ?? {},
          occurred_at: item.occurredAt,
        }));
        try {
          // event_id 一意で重複無視。タイムアウト後の再送でも二重保存されない。
          // supabase-js は throw せず { error } で応答するため、error を検査する。
          // RLS拒否・0003未適用・5xx 等でエラーなら除去せず次回再送（イベントの欠落を防ぐ）。
          const { error } = await withTimeout(
            Promise.resolve(supabase.from('analytics_events').upsert(rows, { onConflict: 'event_id', ignoreDuplicates: true })),
            SEND_TIMEOUT_MS,
          );
          if (error) {
            break;
          }
        } catch {
          // ネットワーク/タイムアウト。以降のバッチは次回に回す（送信済み分だけ除去）
          break;
        }
        // 送信できたバッチの event_id だけを除去（flush中に追加されたイベントは残す）
        await AnalyticsService.removeSent(new Set(batch.map((item) => item.eventId!).filter(Boolean)));
      }
    } catch {
      // 送信失敗分はキューに残り、次回のflushで再送される
    } finally {
      flushing = false;
    }
  }
}
