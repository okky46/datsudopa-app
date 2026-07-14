
// 分析イベントは即時送信せず、端末内キューへ貯めてまとめて送る。
// 送信先はSupabaseの analytics_events テーブル。未設定なら送信せずキューだけ回す。

import { AnalyticsQueueItem, StorageService } from './StorageService';
import { SupabaseService, withTimeout } from './SupabaseService';

const SEND_TIMEOUT_MS = 8000;
const BATCH_SIZE = 50;
/** これ未満の件数では自動フラッシュしない（通信を増やしすぎない） */
const MIN_FLUSH_COUNT = 10;

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

export class AnalyticsService {
  static async track(event: AnalyticsEvent, properties?: Record<string, string | number | boolean>): Promise<void> {
    try {
      const queue = await StorageService.getAnalyticsQueue();
      queue.push({ event, properties, occurredAt: new Date().toISOString() });
      await StorageService.saveAnalyticsQueue(queue);
    } catch {
      // 分析はベストエフォート。失敗してもアプリの動作に影響させない
    }
  }

  /**
   * キューをまとめて送信。force=false のときは一定件数たまるまで送らない。
   * 起動時・リザルト表示後などの節目でのみ呼ぶ。
   */
  static async flush(force = false): Promise<void> {
    if (!SupabaseService.isConfigured()) {
      return;
    }
    try {
      const queue = await StorageService.getAnalyticsQueue();
      if (queue.length === 0 || (!force && queue.length < MIN_FLUSH_COUNT)) {
        return;
      }
      const userId = await SupabaseService.ensureSignedIn();
      const supabase = SupabaseService.getClient();
      if (!userId || !supabase) {
        return;
      }

      let remaining: AnalyticsQueueItem[] = queue;
      while (remaining.length > 0) {
        const batch = remaining.slice(0, BATCH_SIZE);
        const rows = batch.map((item) => ({
          user_id: userId,
          event: item.event,
          properties: item.properties ?? {},
          occurred_at: item.occurredAt,
        }));
        const { error } = await withTimeout(
          Promise.resolve(supabase.from('analytics_events').insert(rows)),
          SEND_TIMEOUT_MS,
        );
        if (error) {
          break;
        }
        remaining = remaining.slice(batch.length);
        await StorageService.saveAnalyticsQueue(remaining);
      }
    } catch {
      // 送信失敗分はキューに残り、次回のflushで再送される
    }
  }
}
