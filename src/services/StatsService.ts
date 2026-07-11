
import { DailyResult } from '../types/result';
import { toDateKey } from '../utils/date';

export type WeeklyBalance = {
  failedMinutes: number;
  reclaimedMinutes: number;
  // 「○年分」「○日分」など、豊かな時間の予測ラベル
  projectionLabel: string;
};

export type CalendarDay = {
  dateKey: string;
  day: number;
  stamped: boolean;
  isToday: boolean;
};

function startOfWeekKey(now = new Date()): string {
  const date = new Date(now);
  const weekday = (date.getDay() + 6) % 7; // 月曜はじまり
  date.setDate(date.getDate() - weekday);
  return toDateKey(date);
}

// 今後50年続けた場合に取り戻せる時間をゆるく換算する
function projectionLabel(reclaimedMinutesThisWeek: number): string {
  const minutesPerYear = reclaimedMinutesThisWeek * 52;
  const totalMinutes = minutesPerYear * 50;
  const totalDays = totalMinutes / (60 * 24);
  if (totalDays >= 365) {
    const years = totalDays / 365;
    return years >= 10 ? `${Math.round(years)}年分` : `${Math.round(years * 10) / 10}年分`;
  }
  if (totalDays >= 1) {
    return `${Math.round(totalDays)}日分`;
  }
  return `${Math.max(0, Math.round(totalMinutes / 60))}時間分`;
}

export class StatsService {
  // 今週の「失敗した時間」と「取り戻した時間」（分）
  static getWeeklyBalance(results: DailyResult[], now = new Date()): WeeklyBalance {
    const weekStart = startOfWeekKey(now);
    const todayKey = toDateKey(now);
    let failedSeconds = 0;
    let reclaimedSeconds = 0;

    for (const result of results) {
      if (result.date < weekStart || result.date > todayKey) {
        continue;
      }
      reclaimedSeconds += Math.max(0, result.watchedSeconds);
      if (result.status !== 'completed') {
        failedSeconds += Math.max(0, result.targetSeconds - result.watchedSeconds);
      }
    }

    const reclaimedMinutes = Math.round(reclaimedSeconds / 60);
    return {
      failedMinutes: Math.round(failedSeconds / 60),
      reclaimedMinutes,
      projectionLabel: projectionLabel(reclaimedMinutes),
    };
  }

  // 完走した日の集合（スタンプ用）
  static getStampedDates(results: DailyResult[]): Set<string> {
    const stamped = new Set<string>();
    for (const result of results) {
      if (result.status === 'completed') {
        stamped.add(result.date);
      }
    }
    return stamped;
  }

  // 今日（または昨日）まで続く連続完走日数
  static getStreakDays(results: DailyResult[], now = new Date()): number {
    const stamped = StatsService.getStampedDates(results);
    const cursor = new Date(now);
    if (!stamped.has(toDateKey(cursor))) {
      cursor.setDate(cursor.getDate() - 1);
    }
    let streak = 0;
    while (stamped.has(toDateKey(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  static getCompletedLongCount(results: DailyResult[]): number {
    return results.filter((result) => result.status === 'completed').length;
  }

  // 今月のカレンダー（先頭に月曜はじまりの空きを含む週ごとの行）
  static getMonthCalendar(results: DailyResult[], now = new Date()): { label: string; weeks: (CalendarDay | null)[][] } {
    const stamped = StatsService.getStampedDates(results);
    const year = now.getFullYear();
    const month = now.getMonth();
    const todayKey = toDateKey(now);
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const leadingBlanks = (firstDay.getDay() + 6) % 7;

    const cells: (CalendarDay | null)[] = new Array(leadingBlanks).fill(null);
    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateKey = toDateKey(new Date(year, month, day));
      cells.push({ dateKey, day, stamped: stamped.has(dateKey), isToday: dateKey === todayKey });
    }
    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    const weeks: (CalendarDay | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }

    return { label: `${year}年${month + 1}月`, weeks };
  }
}
