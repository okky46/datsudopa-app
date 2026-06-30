
import { DEFAULT_RAID_DURATION_SECONDS, RAID_START_WINDOW_SECONDS } from '../constants/raid';
import { DailyResult } from '../types/result';
import { CurrentRaidState, RaidStatusView } from '../types/raid';
import { UserSettings } from '../types/settings';
import { VideoAsset } from '../types/video';
import { formatRemainingTo, formatSeconds, parseTimeToToday, toDateKey } from '../utils/date';
import { resultStatusLabel } from '../utils/resultLabels';
import { LongVideoService } from './LongVideoService';
import { RaidScheduleService } from './RaidScheduleService';
import { ResultService } from './ResultService';
import { StorageService } from './StorageService';

export class RaidService {
  static getTodayRaidResult(results: DailyResult[], date = new Date()): DailyResult | undefined {
    const dateKey = toDateKey(date);
    return results.find((result) => result.date === dateKey && result.mode === 'raid');
  }

  static getTodayRaidTime(settings: UserSettings, date = new Date()): string {
    return RaidScheduleService.resolveRaidTimeForDate(settings, date).raidTime;
  }

  static getRaidStatus(settings: UserSettings, results: DailyResult[], now = new Date()): RaidStatusView {
    const raidTime = RaidService.getTodayRaidTime(settings, now);
    const scheduledDate = parseTimeToToday(raidTime, now);
    const result = RaidService.getTodayRaidResult(results, now);

    if (result?.status === 'completed') {
      return {
        status: 'completed',
        label: '3分完走',
        canStart: false,
        remainingText: 'ショートの逆、完了',
        scheduledDate,
        raidTime,
        windowSecondsLeft: 0,
      };
    }
    if (result?.status === 'escaped') {
      return {
        status: 'failed',
        label: resultStatusLabel(result),
        canStart: false,
        remainingText: '今日は' + resultStatusLabel(result),
        scheduledDate,
        raidTime,
        windowSecondsLeft: 0,
      };
    }
    if (result?.status === 'missed') {
      return {
        status: 'missed',
        label: '未参加',
        canStart: false,
        remainingText: '3分以内に集合できませんでした',
        scheduledDate,
        raidTime,
        windowSecondsLeft: 0,
      };
    }

    const diffSeconds = Math.floor((now.getTime() - scheduledDate.getTime()) / 1000);
    if (diffSeconds >= 0 && diffSeconds <= RAID_START_WINDOW_SECONDS) {
      const windowSecondsLeft = Math.max(0, RAID_START_WINDOW_SECONDS - diffSeconds);
      return {
        status: 'available',
        label: '集合中',
        canStart: true,
        remainingText: '参加猶予 ' + formatSeconds(windowSecondsLeft),
        scheduledDate,
        raidTime,
        windowSecondsLeft,
      };
    }
    if (diffSeconds > RAID_START_WINDOW_SECONDS) {
      return {
        status: 'missed',
        label: '未参加',
        canStart: false,
        remainingText: '3分を過ぎた。今日は未参加',
        scheduledDate,
        raidTime,
        windowSecondsLeft: 0,
      };
    }
    return {
      status: 'not_started',
      label: 'まもなく集合',
      canStart: false,
      remainingText: formatRemainingTo(scheduledDate, now),
      scheduledDate,
      raidTime,
      windowSecondsLeft: 0,
    };
  }

  static async ensureMissedResultRecorded(settings: UserSettings, results: DailyResult[], now = new Date()): Promise<DailyResult[]> {
    const status = RaidService.getRaidStatus(settings, results, now);
    if (status.status !== 'missed' || RaidService.getTodayRaidResult(results, now)) {
      return results;
    }

    const raidTime = RaidService.getTodayRaidTime(settings, now);
    const missed = ResultService.createResult({
      status: 'missed',
      mode: 'raid',
      targetSeconds: settings.raidDurationSeconds || DEFAULT_RAID_DURATION_SECONDS,
      watchedSeconds: 0,
      failureReason: 'late',
      scheduledRaidTime: raidTime,
      date: toDateKey(now),
    });
    await StorageService.saveDailyResult(missed);
    return [missed, ...results.filter((item) => !(item.date === missed.date && item.mode === 'raid'))];
  }

  static createRaidState(settings: UserSettings, video?: VideoAsset): CurrentRaidState {
    const selectedVideo = video || LongVideoService.getRecommendedVideo();
    const raidTime = RaidService.getTodayRaidTime(settings);
    return {
      date: toDateKey(),
      scheduledRaidTime: raidTime,
      notificationSentAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      status: 'available',
      targetSeconds: settings.raidDurationSeconds || DEFAULT_RAID_DURATION_SECONDS,
      videoId: selectedVideo.id,
    };
  }

  static createMissedResult(settings: UserSettings, date = new Date()): DailyResult {
    const raidTime = RaidService.getTodayRaidTime(settings, date);
    return ResultService.createResult({
      status: 'missed',
      mode: 'raid',
      targetSeconds: settings.raidDurationSeconds || DEFAULT_RAID_DURATION_SECONDS,
      watchedSeconds: 0,
      failureReason: 'late',
      scheduledRaidTime: raidTime,
      date: toDateKey(date),
    });
  }
}
