
import { DEFAULT_RAID_DURATION_SECONDS, RAID_START_WINDOW_SECONDS } from '../constants/raid';
import { DailyResult } from '../types/result';
import { CurrentRaidState, RaidStatusView } from '../types/raid';
import { UserSettings } from '../types/settings';
import { VideoAsset } from '../types/video';
import { formatRemainingTo, parseTimeToToday, toDateKey } from '../utils/date';
import { LongVideoService } from './LongVideoService';
import { ResultService } from './ResultService';

export class RaidService {
  static getTodayRaidResult(results: DailyResult[], date = new Date()): DailyResult | undefined {
    const dateKey = toDateKey(date);
    return results.find((result) => result.date === dateKey && result.mode === 'raid');
  }

  static getRaidStatus(settings: UserSettings, results: DailyResult[], now = new Date()): RaidStatusView {
    const scheduledDate = parseTimeToToday(settings.raidTime, now);
    const result = RaidService.getTodayRaidResult(results, now);

    if (result?.status === 'completed') {
      return { status: 'completed', label: '完走', canStart: false, remainingText: '今日の儀式は完了', scheduledDate };
    }
    if (result?.status === 'escaped') {
      return { status: 'failed', label: '失敗', canStart: false, remainingText: '逃亡ログあり', scheduledDate };
    }
    if (result?.status === 'missed') {
      return { status: 'missed', label: '未参加', canStart: false, remainingText: '開始可能時間を過ぎました', scheduledDate };
    }

    const diffSeconds = Math.floor((now.getTime() - scheduledDate.getTime()) / 1000);
    if (diffSeconds >= 0 && diffSeconds <= RAID_START_WINDOW_SECONDS) {
      return { status: 'available', label: '開始可能', canStart: true, remainingText: '残り' + Math.max(0, RAID_START_WINDOW_SECONDS - diffSeconds) + '秒', scheduledDate };
    }
    if (diffSeconds > RAID_START_WINDOW_SECONDS) {
      return { status: 'missed', label: '未参加', canStart: false, remainingText: '通知後3分を過ぎました', scheduledDate };
    }
    return { status: 'not_started', label: '未開始', canStart: false, remainingText: formatRemainingTo(scheduledDate, now), scheduledDate };
  }

  static createRaidState(settings: UserSettings, video?: VideoAsset): CurrentRaidState {
    const selectedVideo = video || LongVideoService.getRecommendedVideo();
    return {
      date: toDateKey(),
      scheduledRaidTime: settings.raidTime,
      notificationSentAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      status: 'available',
      targetSeconds: settings.raidDurationSeconds || DEFAULT_RAID_DURATION_SECONDS,
      videoId: selectedVideo.id,
    };
  }

  static createMissedResult(settings: UserSettings): DailyResult {
    return ResultService.createResult({
      status: 'missed',
      mode: 'raid',
      targetSeconds: settings.raidDurationSeconds || DEFAULT_RAID_DURATION_SECONDS,
      watchedSeconds: 0,
      failureReason: 'late',
      scheduledRaidTime: settings.raidTime,
    });
  }
}
