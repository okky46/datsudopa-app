
// 公式レイドは毎日22:00 JST固定。端末のタイムゾーンに依存せず、
// JST（UTC+9・夏時間なし）基準で日付キーとレイド時刻を計算する。

import { RAID_HOUR_JST, RAID_START_WINDOW_SECONDS } from '../constants/raid';

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** JST基準の YYYY-MM-DD */
export function jstDateKey(date = new Date()): string {
  const jst = new Date(date.getTime() + JST_OFFSET_MS);
  const year = jst.getUTCFullYear();
  const month = String(jst.getUTCMonth() + 1).padStart(2, '0');
  const day = String(jst.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** JSTの日付キーを days 日ずらす */
export function shiftJstDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const base = new Date(Date.UTC(year, month - 1, day));
  base.setUTCDate(base.getUTCDate() + days);
  const y = base.getUTCFullYear();
  const m = String(base.getUTCMonth() + 1).padStart(2, '0');
  const d = String(base.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 指定JST日付の22:00 JSTを、端末ローカルのDate（=正しい絶対時刻）で返す */
export function raidStartAt(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, RAID_HOUR_JST - 9, 0, 0));
}

/** `2026-07-13_22JST` 形式のレイドID */
export function raidIdForDateKey(dateKey: string): string {
  return `${dateKey}_${RAID_HOUR_JST}JST`;
}

export function todayRaidId(now = new Date()): string {
  return raidIdForDateKey(jstDateKey(now));
}

/** 今日のレイドがまだ先なら今日、過ぎていれば翌日の開始時刻 */
export function nextRaidStartAt(now = new Date()): Date {
  const todayKey = jstDateKey(now);
  const todayStart = raidStartAt(todayKey);
  if (now.getTime() < todayStart.getTime()) {
    return todayStart;
  }
  return raidStartAt(shiftJstDateKey(todayKey, 1));
}

export type RaidWindowPhase = 'before' | 'open' | 'closed';

/** 今日の公式レイド枠に対する現在の位置（開始前 / 開始可能 / 終了） */
export function raidWindowPhase(now = new Date()): RaidWindowPhase {
  const start = raidStartAt(jstDateKey(now)).getTime();
  const elapsed = (now.getTime() - start) / 1000;
  if (elapsed < 0) {
    return 'before';
  }
  if (elapsed < RAID_START_WINDOW_SECONDS) {
    return 'open';
  }
  return 'closed';
}

/** 開始猶予の残り秒数（open時のみ正の値） */
export function raidWindowSecondsLeft(now = new Date()): number {
  const start = raidStartAt(jstDateKey(now)).getTime();
  const elapsed = Math.floor((now.getTime() - start) / 1000);
  return Math.max(0, RAID_START_WINDOW_SECONDS - elapsed);
}

/** JST基準で月曜はじまりの週の開始日キー */
export function jstWeekStartKey(now = new Date()): string {
  const todayKey = jstDateKey(now);
  const [year, month, day] = todayKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekday = (date.getUTCDay() + 6) % 7; // 月曜=0
  return shiftJstDateKey(todayKey, -weekday);
}
