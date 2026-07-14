
// 「端末内データを削除」の実処理。
// 匿名ユーザーのサーバー側レコード削除には service role / Edge Function が必要で、
// アプリにサービスロールキーを埋め込まない方針のため、今回は端末内データの削除に限定する。
// （Supabase上の匿名データは対象外であることを画面コピー・プライバシーポリシーに明記している）
//
// 実削除範囲:
//   - スケジュール済みローカル通知の全キャンセル（削除後に通知が届き続けない）
//   - Supabase匿名セッションのサインアウト（古いセッションが意図せず再利用されない）
//   - 端末内AsyncStorageの全削除
//   - 動画キャッシュの削除

import { NotificationService } from './NotificationService';
import { ProfileService } from './ProfileService';
import { StorageService } from './StorageService';
import { SupabaseService } from './SupabaseService';
import { VideoDeliveryService } from './VideoDeliveryService';

export class DataResetService {
  static async clearLocalData(): Promise<void> {
    ProfileService.resetSyncState();
    await NotificationService.cancelAll();
    await SupabaseService.signOut();
    await VideoDeliveryService.clearCache();
    await StorageService.clearAll();
    ProfileService.resetSyncState();
  }
}
