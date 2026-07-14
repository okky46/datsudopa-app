// 公開ユーザーネームのSupabase同期。失敗してもローカル設定は生きたままにし、
// 次回起動時などに再同期する（profilePendingSyncフラグ）。
// 直接テーブルupsertはRLSで封じられており、公開名専用RPC set_public_name を使う。
// サーバー側で NFKC正規化・長さ/URL検査・name_status保護を行う。

import { validatePublicName } from '../utils/username';
import { StorageService } from './StorageService';
import { SupabaseService, withTimeout } from './SupabaseService';

const SYNC_TIMEOUT_MS = 8000;

type ProfileSyncResult = 'synced' | 'retry' | 'rejected';

type ActiveProfileSync = {
  promise: Promise<ProfileSyncResult>;
};

let activeSync: ActiveProfileSync | null = null;
let pendingPublicName: string | null = null;
let lastSyncedPublicName: string | null = null;

function isDeterministicProfileError(error: { message?: string } | null): boolean {
  const message = (error?.message ?? '').toLowerCase();
  return message.includes('invalid_public_name') || message.includes('profile_blocked');
}

async function currentLocalPublicName(): Promise<string | null> {
  const settings = await StorageService.getSettings();
  return settings.publicName || null;
}

export class ProfileService {
  /** ローカル保存済みの公開ネームをSupabaseへ反映する。失敗時はpendingフラグを立てる */
  static async syncPublicName(publicName: string): Promise<ProfileSyncResult> {
    if (!validatePublicName(publicName).ok) {
      if (!activeSync) {
        pendingPublicName = null;
        await StorageService.saveProfilePendingSync(false);
      }
      return 'rejected';
    }

    pendingPublicName = publicName;
    await StorageService.saveProfilePendingSync(true);
    return ProfileService.ensureSyncChain();
  }

  private static ensureSyncChain(): Promise<ProfileSyncResult> {
    if (activeSync) {
      return activeSync.promise;
    }

    const promise = ProfileService.drainLatestPublicNameSyncs().finally(() => {
      if (activeSync?.promise === promise) {
        activeSync = null;
      }
    });
    activeSync = { promise };
    return promise;
  }

  private static async drainLatestPublicNameSyncs(): Promise<ProfileSyncResult> {
    while (true) {
      const localName = await currentLocalPublicName();
      const targetName = pendingPublicName ?? localName;

      if (!targetName) {
        pendingPublicName = null;
        await StorageService.saveProfilePendingSync(false);
        return 'rejected';
      }

      if (!validatePublicName(targetName).ok) {
        pendingPublicName = null;
        await StorageService.saveProfilePendingSync(false);
        return 'rejected';
      }

      if (lastSyncedPublicName === targetName) {
        const latestLocalName = await currentLocalPublicName();
        if (!latestLocalName || latestLocalName === targetName) {
          pendingPublicName = null;
          await StorageService.saveProfilePendingSync(false);
          return 'synced';
        }
        pendingPublicName = latestLocalName;
        await StorageService.saveProfilePendingSync(true);
        continue;
      }

      await StorageService.saveProfilePendingSync(true);
      const result = await ProfileService.performSingleSync(targetName);

      if (result === 'retry') {
        pendingPublicName = targetName;
        await StorageService.saveProfilePendingSync(true);
        return 'retry';
      }

      const latestLocalName = await currentLocalPublicName();
      const latestRequestedName = pendingPublicName;
      const nextName = latestRequestedName && latestRequestedName !== targetName
        ? latestRequestedName
        : latestLocalName && latestLocalName !== targetName
          ? latestLocalName
          : null;

      if (result === 'synced') {
        lastSyncedPublicName = targetName;
      }

      if (nextName) {
        pendingPublicName = nextName;
        await StorageService.saveProfilePendingSync(true);
        continue;
      }

      pendingPublicName = null;
      await StorageService.saveProfilePendingSync(false);
      return result;
    }
  }

  private static async performSingleSync(publicName: string): Promise<ProfileSyncResult> {
    if (!SupabaseService.isConfigured()) {
      return 'retry';
    }
    try {
      const userId = await SupabaseService.ensureSignedIn();
      const supabase = SupabaseService.getClient();
      if (!userId || !supabase) {
        return 'retry';
      }
      const { error } = await withTimeout(
        Promise.resolve(supabase.rpc('set_public_name', { p_public_name: publicName })),
        SYNC_TIMEOUT_MS,
      );
      if (!error) {
        return 'synced';
      }
      if (isDeterministicProfileError(error)) {
        return 'rejected';
      }
      return 'retry';
    } catch {
      return 'retry';
    }
  }

  /** 前回同期に失敗していた場合の再送。進行中の同期がある場合はチェーン全体を確認する。 */
  static async flushPendingSync(): Promise<ProfileSyncResult> {
    while (true) {
      if (activeSync) {
        const result = await activeSync.promise;
        if (result !== 'synced') {
          return result;
        }
        continue;
      }

      const pending = await StorageService.getProfilePendingSync();
      const settings = await StorageService.getSettings();
      const currentName = settings.publicName || null;
      const needsLatestSync = Boolean(currentName && lastSyncedPublicName !== currentName);

      if (!pending && !pendingPublicName && !needsLatestSync) {
        return 'synced';
      }
      if (!currentName) {
        pendingPublicName = null;
        await StorageService.saveProfilePendingSync(false);
        return 'rejected';
      }
      pendingPublicName = pendingPublicName ?? currentName;
      const result = await ProfileService.ensureSyncChain();
      if (result !== 'synced') {
        return result;
      }
    }
  }
}
