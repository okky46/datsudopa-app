
import { DailyResult, DailyResultMode, DailyResultStatus, FailureReason } from '../types/result';
import { calculateDopamineScore, commentForResult, titleForResult } from '../utils/score';
import { formatDateForShare, toDateKey } from '../utils/date';

type CreateResultInput = {
  status: DailyResultStatus;
  mode: DailyResultMode;
  targetSeconds: number;
  watchedSeconds: number;
  videoId?: string;
  failureReason?: FailureReason;
  raidStartedAt?: string;
  raidEndedAt?: string;
  scheduledRaidTime?: string;
  date?: string;
};

export class ResultService {
  static createResult(input: CreateResultInput): DailyResult {
    const score = calculateDopamineScore({
      status: input.status,
      failureReason: input.failureReason,
      watchedSeconds: input.watchedSeconds,
      targetSeconds: input.targetSeconds,
    });
    const base = {
      date: input.date || toDateKey(),
      status: input.status,
      mode: input.mode,
      raidStartedAt: input.raidStartedAt,
      raidEndedAt: input.raidEndedAt || new Date().toISOString(),
      scheduledRaidTime: input.scheduledRaidTime,
      targetSeconds: input.targetSeconds,
      watchedSeconds: input.watchedSeconds,
      videoId: input.videoId,
      failureReason: input.failureReason || 'none',
      dopamineScore: score,
      title: '',
      comment: '',
      shared: false,
    };

    const result: DailyResult = {
      ...base,
      title: titleForResult(base),
      comment: commentForResult({ ...base, dopamineScore: score }),
    };
    return result;
  }

  static createShareText(result: DailyResult): string {
    const raidLine =
      result.status === 'completed'
        ? '脱ドパレイド：完走'
        : result.status === 'missed'
          ? '脱ドパレイド：未参加'
          : '脱ドパレイド：' + result.watchedSeconds + '秒で逃亡';

    return [
      formatDateForShare(result.date),
      '本日のドパガキ報告書',
      '',
      raidLine,
      'ドパガキ度：' + result.dopamineScore + '%',
      '称号：' + result.title,
      '',
      result.comment,
      '#脱ドパロングレイド',
    ].join('\n');
  }
}
