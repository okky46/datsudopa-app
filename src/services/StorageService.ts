
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WatchSession } from '../types/session';
import { UserSettings } from '../types/settings';
import { VideoManifest } from '../types/video';

const keys = {
  onboardingCompleted: 'onboardingCompleted',
  userSettings: 'userSettings',
  sessions: 'watchSessions',
  totalDetoxSeconds: 'totalDetoxSeconds',
  dopagakiLevel: 'dopagakiLevel',
  dopagakiLongReduction: 'dopagakiLongReduction',
  dopagakiMissedProcessed: 'dopagakiMissedProcessed',
  firstUseDateKey: 'firstUseDateKey',
  notificationPermission: 'notificationPermission',
  raidSyncQueue: 'raidSyncQueue',
  profilePendingSync: 'profilePendingSync',
  analyticsQueue: 'analyticsQueue',
  manifestCache: 'videoManifestCache',
  videoCacheIndex: 'videoCacheIndex',
};

const MAX_SESSIONS = 200;
const MAX_ANALYTICS_QUEUE = 300;

const defaultSettings: UserSettings = {
  onboardingCompleted: false,
  publicName: '',
  notificationEnabled: true,
  shortsUsageId: '',
};

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

// 参加記録の同期キュー。user_id / public_name_snapshot / started_at / finished_at は
// サーバー側RPCが決定するため、キューには保持しない（改造クライアントの注入経路を残さない）。
export type RaidSyncItem = {
  type: 'start' | 'finish';
  sessionId: string;
  raidId: string;
  status: 'started' | 'completed' | 'exited';
  watchedSeconds: number;
  queuedAt: string;
};

export type AnalyticsQueueItem = {
  event: string;
  properties?: Record<string, string | number | boolean>;
  occurredAt: string;
};

export type VideoCacheEntry = {
  videoId: string;
  fileUri: string;
  sizeBytes: number;
  downloadedAt: string;
};

export class StorageService {
  static getDefaultSettings(): UserSettings {
    return defaultSettings;
  }

  static async getSettings(): Promise<UserSettings> {
    const stored = await readJson<Partial<UserSettings> & { nickname?: string }>(keys.userSettings, defaultSettings);
    // 旧仕様（nickname）からの引き継ぎ
    const publicName = stored.publicName ?? stored.nickname ?? defaultSettings.publicName;
    return {
      onboardingCompleted: stored.onboardingCompleted ?? defaultSettings.onboardingCompleted,
      publicName,
      notificationEnabled: stored.notificationEnabled ?? defaultSettings.notificationEnabled,
      shortsUsageId: stored.shortsUsageId ?? defaultSettings.shortsUsageId,
    };
  }

  static async saveSettings(settings: UserSettings): Promise<void> {
    await writeJson(keys.userSettings, settings);
    await AsyncStorage.setItem(keys.onboardingCompleted, String(settings.onboardingCompleted));
  }

  // --- 視聴セッション ---

  static async getSessions(): Promise<WatchSession[]> {
    return readJson<WatchSession[]>(keys.sessions, []);
  }

  static async saveSessions(sessions: WatchSession[]): Promise<void> {
    await writeJson(keys.sessions, sessions.slice(0, MAX_SESSIONS));
  }

  // --- 累計脱ドパ時間 ---

  static async getTotalDetoxSeconds(): Promise<number> {
    return readJson<number>(keys.totalDetoxSeconds, 0);
  }

  static async saveTotalDetoxSeconds(seconds: number): Promise<void> {
    await writeJson(keys.totalDetoxSeconds, Math.max(0, Math.round(seconds)));
  }

  // --- ドパガキ度 ---

  static async getDopagakiLevel(): Promise<number | null> {
    return readJson<number | null>(keys.dopagakiLevel, null);
  }

  static async saveDopagakiLevel(level: number): Promise<void> {
    await writeJson(keys.dopagakiLevel, level);
  }

  /** 日付キー → その日ロング視聴で適用済みの減少量（0〜cap） */
  static async getDopagakiLongReduction(): Promise<Record<string, number>> {
    return readJson<Record<string, number>>(keys.dopagakiLongReduction, {});
  }

  static async saveDopagakiLongReduction(map: Record<string, number>): Promise<void> {
    // 直近分だけ保持
    const entries = Object.entries(map).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 14);
    await writeJson(keys.dopagakiLongReduction, Object.fromEntries(entries));
  }

  /** 未参加ペナルティを処理済みの日付キー */
  static async getDopagakiMissedProcessed(): Promise<string[]> {
    return readJson<string[]>(keys.dopagakiMissedProcessed, []);
  }

  static async saveDopagakiMissedProcessed(dateKeys: string[]): Promise<void> {
    await writeJson(keys.dopagakiMissedProcessed, dateKeys.slice(-30));
  }

  static async getFirstUseDateKey(): Promise<string | null> {
    return readJson<string | null>(keys.firstUseDateKey, null);
  }

  static async saveFirstUseDateKey(dateKey: string): Promise<void> {
    await writeJson(keys.firstUseDateKey, dateKey);
  }

  // --- 通知 ---

  static async saveNotificationPermission(granted: boolean): Promise<void> {
    await AsyncStorage.setItem(keys.notificationPermission, String(granted));
  }

  // --- Supabase同期キュー ---

  static async getRaidSyncQueue(): Promise<RaidSyncItem[]> {
    return readJson<RaidSyncItem[]>(keys.raidSyncQueue, []);
  }

  static async saveRaidSyncQueue(queue: RaidSyncItem[]): Promise<void> {
    await writeJson(keys.raidSyncQueue, queue.slice(-60));
  }

  static async getProfilePendingSync(): Promise<boolean> {
    return readJson<boolean>(keys.profilePendingSync, false);
  }

  static async saveProfilePendingSync(pending: boolean): Promise<void> {
    await writeJson(keys.profilePendingSync, pending);
  }

  // --- 分析キュー ---

  static async getAnalyticsQueue(): Promise<AnalyticsQueueItem[]> {
    return readJson<AnalyticsQueueItem[]>(keys.analyticsQueue, []);
  }

  static async saveAnalyticsQueue(queue: AnalyticsQueueItem[]): Promise<void> {
    await writeJson(keys.analyticsQueue, queue.slice(-MAX_ANALYTICS_QUEUE));
  }

  // --- 動画manifest・キャッシュ ---

  static async getCachedManifest(): Promise<VideoManifest | null> {
    return readJson<VideoManifest | null>(keys.manifestCache, null);
  }

  static async saveCachedManifest(manifest: VideoManifest): Promise<void> {
    await writeJson(keys.manifestCache, manifest);
  }

  static async getVideoCacheIndex(): Promise<VideoCacheEntry[]> {
    return readJson<VideoCacheEntry[]>(keys.videoCacheIndex, []);
  }

  static async saveVideoCacheIndex(entries: VideoCacheEntry[]): Promise<void> {
    await writeJson(keys.videoCacheIndex, entries);
  }

  static async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(keys));
  }
}
