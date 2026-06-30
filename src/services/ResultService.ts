
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
          ? `脱ドパロング自主練：完走（${formatSeconds(result.watchedSeconds)}）`
          : `脱ドパロング自主練：${formatSeconds(result.watchedSeconds)}で中断`;

      return [
        `${displayName}のショート逆トレ`,
        formatDateForShare(result.date),
        '',
        sessionLine,
        `スキップ不可の虚無：${formatSeconds(result.targetSeconds)}`,
        `脱ドパ達成率：${metrics.detoxRate}%`,
        `${displayName}のドパガキ度：${result.dopamineScore}%`,
        `称号：${result.title}`,
        '',
        result.comment,
        '#脱ドパロング',
      ].join('\n');
    }

    const raidLine =
      result.status === 'completed'
        ? '本日の脱ドパレイド：3分完走'
        : result.status === 'missed'
          ? '本日の脱ドパレイド：未参加'
          : '本日の脱ドパレイド：' + formatSeconds(result.watchedSeconds) + 'で中断';

    return [
      displayName + 'の今日のレイド記録',
      formatDateForShare(result.date),
      '',
      raidLine,
      result.scheduledRaidTime ? '集合時刻：' + result.scheduledRaidTime : '毎日一回、虚無に集合',
      '今日のドパガキ度：' + result.dopamineScore + '%',
      '称号：' + result.title,
      '',
      result.comment,
      'ショートの真逆を、みんなでやる。',
      '#脱ドパレイド',
    ].join('\n');
  }
}
