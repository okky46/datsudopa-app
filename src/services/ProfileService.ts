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
let syncGeneration = 0;

function isDeterministicProfileError(error: { message?: string } | null): boolean {
  const message = (error?.message ?? '').toLowerCase();
  return message.includes('invalid_public_name') || message.includes('profile_blocked');
}

async function currentLocalPublicName(): Promise<string | null> {
  const settings = await StorageService.getSettings();
  return settings.publicName || null;
}

function isCurrentGeneration(generation: number): boolean {
  return generation === syncGeneration;
}

async function savePendingIfCurrent(generation: number, pending: boolean): Promise<boolean> {
  if (!isCurrentGeneration(generation)) {
    return false;
  }
  await StorageService.saveProfilePendingSync(pending);
  return true;
}

export class ProfileService {
  /** データ削除・サインアウト・テスト初期化時にモジュール内同期状態を破棄する。 */
  static resetSyncState(): void {
    syncGeneration += 1;
    activeSync = null;
    pendingPublicName = null;
  }

  /** ローカル保存済みの公開ネームをSupabaseへ反映する。失敗時はpendingフラグを立てる */
  static async syncPublicName(publicName: string): Promise<ProfileSyncResult> {
    const generation = syncGeneration;
    if (!validatePublicName(publicName).ok) {
      if (!activeSync) {
        pendingPublicName = null;
        await savePendingIfCurrent(generation, false);
      }
      return 'rejected';
    }

    pendingPublicName = publicName;
    await savePendingIfCurrent(generation, true);
    return ProfileService.ensureSyncChain(generation);
  }

  private static ensureSyncChain(generation: number = syncGeneration): Promise<ProfileSyncResult> {
    if (activeSync) {
      return activeSync.promise;
    }

    const promise = ProfileService.drainLatestPublicNameSyncs(generation).finally(() => {
      if (activeSync?.promise === promise) {
        activeSync = null;
      }
    });
    activeSync = { promise };
    return promise;
  }

  private static async drainLatestPublicNameSyncs(generation: number): Promise<ProfileSyncResult> {
    while (isCurrentGeneration(generation)) {
      const localName = await currentLocalPublicName();
      if (!isCurrentGeneration(generation)) {
        return 'retry';
      }
      const targetName = pendingPublicName ?? localName;

      if (!targetName) {
        pendingPublicName = null;
        await savePendingIfCurrent(generation, false);
        return 'rejected';
      }

      if (!validatePublicName(targetName).ok) {
        pendingPublicName = null;
        await savePendingIfCurrent(generation, false);
        return 'rejected';
      }

      await savePendingIfCurrent(generation, true);
      const result = await ProfileService.performSingleSync(targetName);
      if (!isCurrentGeneration(generation)) {
        return 'retry';
      }

      if (result === 'retry') {
        pendingPublicName = targetName;
        await savePendingIfCurrent(generation, true);
        return 'retry';
      }

      const latestLocalName = await currentLocalPublicName();
      if (!isCurrentGeneration(generation)) {
        return 'retry';
      }
      const latestRequestedName = pendingPublicName;
      const nextName = latestRequestedName && latestRequestedName !== targetName
        ? latestRequestedName
        : latestLocalName && latestLocalName !== targetName
          ? latestLocalName
          : null;

      if (nextName) {
        pendingPublicName = nextName;
        await savePendingIfCurrent(generation, true);
        continue;
      }

      pendingPublicName = null;
      await savePendingIfCurrent(generation, false);
      return result;
    }
    return 'retry';
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

      const generation = syncGeneration;
      const pending = await StorageService.getProfilePendingSync();
      const currentName = await currentLocalPublicName();
      if (!isCurrentGeneration(generation)) {
        continue;
      }

      if (!pending && !pendingPublicName) {
        return 'synced';
      }
      if (!currentName) {
        pendingPublicName = null;
        await savePendingIfCurrent(generation, false);
        return 'rejected';
      }
      pendingPublicName = pendingPublicName ?? currentName;
      const result = await ProfileService.ensureSyncChain(generation);
      if (result !== 'synced') {
        return result;
      }
    }
  }
}
