
import { DailyResult, DailyResultMode, DailyResultStatus, FailureReason } from '../types/result';
import { calculateDopamineScore, calculateSessionMetrics, commentForResult, titleForResult } from '../utils/score';
import { formatDateForShare, formatSeconds, toDateKey } from '../utils/date';

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

  static createShareText(result: DailyResult, nickname = '名無しのドパガキ'): string {
    const displayName = nickname.trim() || '名無しのドパガキ';
    const metrics = calculateSessionMetrics(result);

    if (result.mode === 'normal') {
      const sessionLine =
        result.status === 'completed'
          ? `脱ドパロング：完走（${formatSeconds(result.watchedSeconds)}）`
          : `脱ドパロング：${formatSeconds(result.watchedSeconds)} / 目標${formatSeconds(result.targetSeconds)}`;

      return [
        `${displayName}の脱ドパレポート`,
        formatDateForShare(result.date),
        '',
        sessionLine,
        `脱ドパ達成率：${metrics.detoxRate}%`,
        `心の静けさスコア：${metrics.calmScore}`,
        `${displayName}のドパガキ度：${result.dopamineScore}%`,
        `称号：${result.title}`,
        '',
        result.comment,
        '#脱ドパロング',
      ].join('\n');
    }

    const raidLine =
      result.status === 'completed'
        ? '脱ドパレイド：完走'
        : result.status === 'missed'
          ? '脱ドパレイド：未参加'
          : '脱ドパレイド：' + result.watchedSeconds + '秒で逃亡';

    return [
      `${displayName}の脱ドパレポート`,
      formatDateForShare(result.date),
      '',
      raidLine,
      `${displayName}のドパガキ度：${result.dopamineScore}%`,
      '称号：' + result.title,
      '',
      result.comment,
      '#脱ドパレイド',
    ].join('\n');
  }
}
