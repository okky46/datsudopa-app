
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailyResult } from '../types/result';
import { CurrentRaidState } from '../types/raid';
import { PremiumStatus, UserSettings } from '../types/settings';
import { VideoWatchRecord } from '../types/video';

const keys = {
  onboardingCompleted: 'onboardingCompleted',
  userSettings: 'userSettings',
  dailyResults: 'dailyResults',
  currentRaidState: 'currentRaidState',
  notificationPermission: 'notificationPermission',
  premiumStatus: 'premiumStatus',
  videoWatchHistory: 'videoWatchHistory',
};

const defaultSettings: UserSettings = {
  onboardingCompleted: false,
  nickname: '名無しのドパガキ',
  socialTimeSlot: 'before_bed',
  raidTime: '23:00',
  notificationEnabled: true,
  notificationTone: 'normal',
  raidDurationSeconds: 180,
};

const defaultPremiumStatus: PremiumStatus = {
  isPremium: false,
  planName: 'プレミアム・広告増量プラン placeholder',
  jokeAdsMultiplier: 1,
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

export class StorageService {
  static getDefaultSettings(): UserSettings {
    return defaultSettings;
  }

  static async getSettings(): Promise<UserSettings> {
    const settings = await readJson<Partial<UserSettings>>(keys.userSettings, defaultSettings);
    return { ...defaultSettings, ...settings };
  }

  static async saveSettings(settings: UserSettings): Promise<void> {
    await writeJson(keys.userSettings, settings);
    await AsyncStorage.setItem(keys.onboardingCompleted, String(settings.onboardingCompleted));
  }

  static async getDailyResults(): Promise<DailyResult[]> {
    return readJson<DailyResult[]>(keys.dailyResults, []);
  }

  static async saveDailyResult(result: DailyResult): Promise<void> {
    const results = await StorageService.getDailyResults();
    const next = [
      result,
      ...results.filter((item) => !(item.date === result.date && item.mode === result.mode)),
    ].sort((a, b) => b.date.localeCompare(a.date));
    await writeJson(keys.dailyResults, next.slice(0, 60));
  }

  static async markResultShared(date: string, mode: DailyResult['mode']): Promise<void> {
    const results = await StorageService.getDailyResults();
    await writeJson(
      keys.dailyResults,
      results.map((result) => (result.date === date && result.mode === mode ? { ...result, shared: true } : result)),
    );
  }

  static async getCurrentRaidState(): Promise<CurrentRaidState | null> {
    return readJson<CurrentRaidState | null>(keys.currentRaidState, null);
  }

  static async saveCurrentRaidState(state: CurrentRaidState | null): Promise<void> {
    if (!state) {
      await AsyncStorage.removeItem(keys.currentRaidState);
      return;
    }
    await writeJson(keys.currentRaidState, state);
  }

  static async saveNotificationPermission(granted: boolean): Promise<void> {
    await AsyncStorage.setItem(keys.notificationPermission, String(granted));
  }

  static async getPremiumStatus(): Promise<PremiumStatus> {
    return readJson<PremiumStatus>(keys.premiumStatus, defaultPremiumStatus);
  }

  static async savePremiumStatus(status: PremiumStatus): Promise<void> {
    await writeJson(keys.premiumStatus, status);
  }

  static async getVideoWatchHistory(): Promise<VideoWatchRecord[]> {
    return readJson<VideoWatchRecord[]>(keys.videoWatchHistory, []);
  }

  static async appendVideoWatchHistory(record: VideoWatchRecord): Promise<void> {
    const history = await StorageService.getVideoWatchHistory();
    await writeJson(keys.videoWatchHistory, [record, ...history].slice(0, 100));
  }

  static async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(keys));
  }
}
