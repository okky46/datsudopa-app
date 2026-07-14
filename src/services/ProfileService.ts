// 公開ユーザーネームのSupabase同期。失敗してもローカル設定は生きたままにし、
// 次回起動時などに再同期する（profilePendingSyncフラグ）。
// 直接テーブルupsertはRLSで封じられており、公開名専用RPC set_public_name を使う。
// サーバー側で NFKC正規化・長さ/URL検査・name_status保護を行う。

import { validatePublicName } from '../utils/username';
import { StorageService } from './StorageService';
import { SupabaseService, withTimeout } from './SupabaseService';

const SYNC_TIMEOUT_MS = 8000;

type ProfileSyncResult = 'synced' | 'retry' | 'rejected';

type InFlightProfileSync = {
  publicName: string;
  promise: Promise<ProfileSyncResult>;
};

let inFlightSync: InFlightProfileSync | null = null;

function isDeterministicProfileError(error: { message?: string } | null): boolean {
  const message = (error?.message ?? '').toLowerCase();
  return message.includes('invalid_public_name') || message.includes('profile_blocked');
}

export class ProfileService {
  /** ローカル保存済みの公開ネームをSupabaseへ反映する。失敗時はpendingフラグを立てる */
  static async syncPublicName(publicName: string): Promise<ProfileSyncResult> {
    if (!validatePublicName(publicName).ok) {
      await StorageService.saveProfilePendingSync(false);
      return 'rejected';
    }

    while (inFlightSync) {
      if (inFlightSync.publicName === publicName) {
        return inFlightSync.promise;
      }
      await inFlightSync.promise;
    }

    const promise = ProfileService.performSyncPublicName(publicName).finally(() => {
      if (inFlightSync?.promise === promise) {
        inFlightSync = null;
      }
    });
    inFlightSync = { publicName, promise };
    return promise;
  }

  private static async performSyncPublicName(publicName: string): Promise<ProfileSyncResult> {
    await StorageService.saveProfilePendingSync(true);
    if (!SupabaseService.isConfigured()) {
      return 'retry';
    }
    try {
      const userId = await SupabaseService.ensureSignedIn();
      const supabase = SupabaseService.getClient();
      if (!userId || !supabase) {
        await StorageService.saveProfilePendingSync(true);
        return 'retry';
      }
      const { error } = await withTimeout(
        Promise.resolve(supabase.rpc('set_public_name', { p_public_name: publicName })),
        SYNC_TIMEOUT_MS,
      );
      if (!error) {
        await StorageService.saveProfilePendingSync(false);
        return 'synced';
      }
      if (isDeterministicProfileError(error)) {
        await StorageService.saveProfilePendingSync(false);
        return 'rejected';
      }
      await StorageService.saveProfilePendingSync(true);
      return 'retry';
    } catch {
      await StorageService.saveProfilePendingSync(true);
      return 'retry';
    }
  }

  /** 前回同期に失敗していた場合の再送。進行中の同期がある場合はpendingフラグより優先して待つ。 */
  static async flushPendingSync(): Promise<ProfileSyncResult> {
    if (inFlightSync) {
      return inFlightSync.promise;
    }
    const pending = await StorageService.getProfilePendingSync();
    if (!pending) {
      return 'synced';
    }
    const settings = await StorageService.getSettings();
    if (settings.publicName) {
      return ProfileService.syncPublicName(settings.publicName);
    }
    await StorageService.saveProfilePendingSync(false);
    return 'rejected';
  }
}
