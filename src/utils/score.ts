
import { DailyResult, DailyResultStatus, FailureReason } from '../types/result';
import { comments, titles } from '../constants/copy';

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
    return '静寂に3分耐えた者';
  }
  if (result.status === 'completed') {
    return '準・脱ドパ僧';
  }
  if (result.status === 'missed') {
    return '通知だけ見た人';
  }
  if (result.failureReason === 'emergency_exit') {
    return '逃亡ログ保有者';
  }
  if (result.watchedSeconds > 0) {
    return String(result.watchedSeconds) + '秒の逃亡者';
  }
  return titles[Math.abs(result.watchedSeconds) % titles.length];
}

export function commentForResult(result: Pick<DailyResult, 'status' | 'failureReason' | 'dopamineScore'>): string {
  if (result.status === 'completed') {
    return '虚無に耐えた時間だけ、少し戻ってくる。';
  }
  if (result.status === 'missed') {
    return '通知を見た時点で、もう始まっている。';
  }
  if (result.failureReason === 'backgrounded') {
    return 'アプリの外にも、逃げ道は記録される。';
  }
  if (result.dopamineScore >= 90) {
    return '逃げても記録は残る。';
  }
  return comments[result.dopamineScore % comments.length];
}

export function getDailyTitle(score: number): string {
  if (score <= 35) {
    return '本日のレイド完走者';
  }
  if (score <= 55) {
    return '準・脱ドパ僧';
  }
  if (score <= 80) {
    return '虚無を見つめし者';
  }
  if (score <= 94) {
    return 'スクロールに魂を売った者';
  }
  return '通知だけ見た人';
}

export function getDailyComment(score: number): string {
  if (score <= 35) {
    return '刺激がないことに、今日は少し耐えられた。';
  }
  if (score <= 70) {
    return '今日はまだ、取り返せる。';
  }
  return 'スクロールは祈りではない。';
}
