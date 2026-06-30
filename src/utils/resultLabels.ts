import { DailyResult } from '../types/result';

export function resultStatusLabel(result: Pick<DailyResult, 'status' | 'failureReason'>): string {
  if (result.status === 'completed') {
    return '3分完走';
  }
  if (result.status === 'missed') {
    return '未参加';
  }
  if (result.failureReason === 'emergency_exit') {
    return '緊急離脱';
  }
  if (result.failureReason === 'backgrounded') {
    return '離脱';
  }
  if (result.failureReason === 'closed' || result.failureReason === 'manual_exit') {
    return '中断';
  }
  return '中断';
}

export function resultHeadline(result: Pick<DailyResult, 'status' | 'failureReason' | 'watchedSeconds'>): string {
  if (result.status === 'completed') {
    return 'ショートの逆、完了。虚無に3分耐えた。';
  }
  if (result.status === 'missed') {
    return '未参加。みんなが虚無を見ている間、今日は入れなかった。';
  }
  if (result.failureReason === 'emergency_exit') {
    return '中断。スキップ欲に押されたが、秒数は残った。';
  }
  if (result.failureReason === 'backgrounded') {
    return '離脱。画面の外に出た瞬間も、レイド記録になる。';
  }
  if (result.watchedSeconds > 0) {
    return '中断。まだドパは抜けきっていない。';
  }
  return '中断。今日はここまで。';
}
