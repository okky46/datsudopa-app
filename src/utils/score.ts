import { DailyResult, DailyResultStatus, FailureReason } from '../types/result';
import { comments, titles } from '../constants/copy';
import { resultHeadline } from './resultLabels';

type ScoreInput = {
  status: DailyResultStatus;
  failureReason?: FailureReason;
  watchedSeconds: number;
  targetSeconds: number;
  streak?: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

const SCORE_COLOR_LOW = { r: 61, g: 168, b: 106 }; // #3DA86A
const SCORE_COLOR_HIGH = { r: 196, g: 69, b: 58 }; // #C4453A

export function dopamineScoreColor(score: number): string {
  const t = clamp(score, 0, 100) / 100;
  const r = SCORE_COLOR_LOW.r + (SCORE_COLOR_HIGH.r - SCORE_COLOR_LOW.r) * t;
  const g = SCORE_COLOR_LOW.g + (SCORE_COLOR_HIGH.g - SCORE_COLOR_LOW.g) * t;
  const b = SCORE_COLOR_LOW.b + (SCORE_COLOR_HIGH.b - SCORE_COLOR_LOW.b) * t;
  return (
    '#' +
    [r, g, b]
      .map((channel) => Math.round(channel).toString(16).padStart(2, '0'))
      .join('')
  );
}

export function calculateDopamineScore(input: ScoreInput): number {
  const progress = input.targetSeconds > 0 ? input.watchedSeconds / input.targetSeconds : 0;
  const streakBonus = Math.min(input.streak || 0, 5) * 2;

  if (input.status === 'completed') {
    const base = input.failureReason === 'late' ? 44 : 28;
    return clamp(Math.round(base - progress * 12 - streakBonus), 10, input.failureReason === 'late' ? 50 : 35);
  }

  if (input.status === 'missed' || input.failureReason === 'late') {
    return clamp(98 - streakBonus, 95, 100);
  }

  return clamp(Math.round(92 - progress * 25 - streakBonus), 60, 90);
}

export function titleForResult(result: Pick<DailyResult, 'status' | 'failureReason' | 'watchedSeconds' | 'targetSeconds'>): string {
  if (result.status === 'completed' && result.targetSeconds >= 180) {
    return '本日のレイド完走者';
  }
  if (result.status === 'completed') {
    return '準・虚無耐久者';
  }
  if (result.status === 'missed') {
    return '通知だけ見た人';
  }
  if (result.failureReason === 'emergency_exit') {
    return 'スキップ欲に負けた者';
  }
  if (result.failureReason === 'backgrounded') {
    return '画面外に逃げた者';
  }
  if (result.watchedSeconds > 0) {
    return String(result.watchedSeconds) + '秒で中断した者';
  }
  return titles[Math.abs(result.watchedSeconds) % titles.length];
}

export function commentForResult(result: Pick<DailyResult, 'status' | 'failureReason' | 'dopamineScore' | 'watchedSeconds'>): string {
  return resultHeadline(result);
}

export function getDailyTitle(score: number): string {
  if (score <= 35) {
    return '本日のレイド完走者';
  }
  if (score <= 55) {
    return '準・虚無耐久者';
  }
  if (score <= 80) {
    return '虚無を見つめし者';
  }
  if (score <= 94) {
    return 'スクロールに魂を売った者';
  }
  return '通知だけ見た人';
}

export type SessionMetrics = {
  detoxRate: number;
  calmScore: number;
  untouchedMinutes: number;
};

export function calculateSessionMetrics(
  result: Pick<DailyResult, 'watchedSeconds' | 'targetSeconds' | 'status'>,
): SessionMetrics {
  const progress = result.targetSeconds > 0 ? result.watchedSeconds / result.targetSeconds : 0;
  const detoxRate = Math.min(100, Math.round(progress * 100));
  const calmBase = Math.min(100, Math.round((result.watchedSeconds / 30) * 8));
  const calmBonus = result.status === 'completed' ? 12 : 0;
  const calmScore = Math.min(100, calmBase + calmBonus);
  const untouchedMinutes = Math.max(0, Math.floor(result.watchedSeconds / 60));

  return { detoxRate, calmScore, untouchedMinutes };
}

export function getDailyComment(score: number): string {
  if (score <= 35) {
    return '今日もショートの逆に入れた。脳に余白が戻ってきている。';
  }
  if (score <= 70) {
    return '今日はまだ、ドパが残っている。次は低刺激ロングでクールダウン。';
  }
  return '次の集合で、余白のある3分に浸る。';
}
