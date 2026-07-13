
// 公開ユーザーネームのSupabase同期。失敗してもローカル設定は生きたままにし、
// 次回起動時などに再同期する（profilePendingSyncフラグ）。

import { normalizePublicName } from '../utils/username';
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
        Promise.resolve(
          supabase.from('profiles').upsert(
            {
              user_id: userId,
              public_name: publicName,
              public_name_normalized: normalizePublicName(publicName).toLowerCase(),
              name_updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' },
          ),
        ),
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
