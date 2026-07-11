
import { DopamineDeltas, DopamineSnapshot } from '../types/dopamine';
import { toDateKey } from '../utils/date';
import { StorageService } from './StorageService';

export const DOPAMINE_DEFAULT_LEVEL = 72;

function clampLevel(level: number): number {
  return Math.max(0, Math.min(100, Math.round(level)));
}

function shiftDateKey(days: number, base = new Date()): string {
  const date = new Date(base);
  date.setDate(date.getDate() - days);
  return toDateKey(date);
}

// dateKey 以前で一番新しいスナップショットを返す
function snapshotOnOrBefore(history: DopamineSnapshot[], dateKey: string): DopamineSnapshot | undefined {
  let found: DopamineSnapshot | undefined;
  for (const snapshot of history) {
    if (snapshot.date <= dateKey && (!found || snapshot.date > found.date)) {
      found = snapshot;
    }
  }
  return found;
}

export class DopamineService {
  static async getLevel(): Promise<number> {
    const level = await StorageService.getDopamineLevel(DOPAMINE_DEFAULT_LEVEL);
    return clampLevel(level);
  }

  // レベルを delta だけ動かし、今日のスナップショットを更新する
  static async adjust(delta: number): Promise<{ level: number; applied: number }> {
    const current = await DopamineService.getLevel();
    const next = clampLevel(current + delta);
    await StorageService.saveDopamineLevel(next);

    const today = toDateKey();
    const history = await StorageService.getDopamineHistory();
    const withoutToday = history.filter((snapshot) => snapshot.date !== today);
    await StorageService.saveDopamineHistory(
      [...withoutToday, { date: today, level: next }].sort((a, b) => a.date.localeCompare(b.date)),
    );

    return { level: next, applied: next - current };
  }

  // 視聴中の誘惑（スクロール/スキップ/倍速）1回ぶん
  static async spike(): Promise<{ level: number; applied: number }> {
    const total = await StorageService.getTemptationTotal();
    await StorageService.saveTemptationTotal(total + 1);
    return DopamineService.adjust(1);
  }

  // 共有はドパるので微増
  static async bumpForShare(): Promise<{ level: number; applied: number }> {
    return DopamineService.adjust(1);
  }

  // セッション終了時の増減量。完走は視聴時間に応じて下がり、失敗は上がる。
  static sessionOutcomeDelta(completed: boolean, watchedSeconds: number): number {
    if (completed) {
      const minutes = watchedSeconds / 60;
      return -Math.min(12, Math.max(3, Math.round(2 + minutes / 3)));
    }
    return 4;
  }

  static async getDeltas(now = new Date()): Promise<DopamineDeltas> {
    const level = await DopamineService.getLevel();
    const history = await StorageService.getDopamineHistory();

    const deltaAgainst = (daysAgo: number): number | null => {
      const snapshot = snapshotOnOrBefore(history, shiftDateKey(daysAgo, now));
      return snapshot ? level - snapshot.level : null;
    };

    return {
      vsYesterday: deltaAgainst(1),
      vsLastWeek: deltaAgainst(7),
      vsLastMonth: deltaAgainst(30),
    };
  }
}
