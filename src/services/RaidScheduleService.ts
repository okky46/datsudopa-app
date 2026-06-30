import { RAID_TIME_SLOT_CANDIDATES } from '../constants/raid';
import { SocialTimeSlot, UserSettings } from '../types/settings';
import { toDateKey } from '../utils/date';

export type RaidTimeSource = 'local' | 'server';

export type ResolvedRaidTime = {
  raidTime: string;
  dateKey: string;
  source: RaidTimeSource;
};

function hashDateSlot(dateKey: string, slot: SocialTimeSlot): number {
  const seed = dateKey + ':' + slot;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/**
 * 今日のレイド通知時刻を決定する。
 * 将来的に Supabase から serverRaidTime を渡せば上書きできる。
 */
export class RaidScheduleService {
  static resolveRaidTimeForDate(
    settings: UserSettings,
    date: Date = new Date(),
    serverRaidTime?: string | null,
  ): ResolvedRaidTime {
    const dateKey = toDateKey(date);

    if (serverRaidTime) {
      return { raidTime: serverRaidTime, dateKey, source: 'server' };
    }

    const candidates = RAID_TIME_SLOT_CANDIDATES[settings.socialTimeSlot];

    const index = hashDateSlot(dateKey, settings.socialTimeSlot) % candidates.length;
    return {
      raidTime: candidates[index] ?? settings.raidTime,
      dateKey,
      source: 'local',
    };
  }
}
