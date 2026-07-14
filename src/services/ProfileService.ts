
// 公開ユーザーネームのSupabase同期。失敗してもローカル設定は生きたままにし、
// 次回起動時などに再同期する（profilePendingSyncフラグ）。
// 直接テーブルupsertはRLSで封じられており、公開名専用RPC set_public_name を使う。
// サーバー側で NFKC正規化・長さ/URL検査・name_status保護を行う。

import { StorageService } from './StorageService';
import { SupabaseService, withTimeout } from './SupabaseService';

const SYNC_TIMEOUT_MS = 8000;

export class ProfileService {
  /** ローカル保存済みの公開ネームをSupabaseへ反映する。失敗時はpendingフラグを立てる */
  static async syncPublicName(publicName: string): Promise<void> {
    if (!SupabaseService.isConfigured()) {
      return;
    }
    try {
      const userId = await SupabaseService.ensureSignedIn();
      const supabase = SupabaseService.getClient();
      if (!userId || !supabase) {
        await StorageService.saveProfilePendingSync(true);
        return;
      }
      const { error } = await withTimeout(
        Promise.resolve(supabase.rpc('set_public_name', { p_public_name: publicName })),
        SYNC_TIMEOUT_MS,
      );
      await StorageService.saveProfilePendingSync(Boolean(error));
    } catch {
      await StorageService.saveProfilePendingSync(true);
    }
  }

  /** 前回同期に失敗していた場合の再送 */
  static async flushPendingSync(): Promise<void> {
    const pending = await StorageService.getProfilePendingSync();
    if (!pending) {
      return;
    }
    const settings = await StorageService.getSettings();
    if (settings.publicName) {
      await ProfileService.syncPublicName(settings.publicName);
    }
  }
}
