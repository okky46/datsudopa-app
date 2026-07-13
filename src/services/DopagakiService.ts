
// ドパガキ度（0〜100のエンタメ指標）。増減ルールは src/constants/dopagaki.ts に集約。

import {
  DOPAGAKI_DEFAULT_INITIAL,
  DOPAGAKI_INITIAL_BY_USAGE,
  DOPAGAKI_LONG_DAILY_CAP,
  DOPAGAKI_LONG_STEP_DELTA,
  DOPAGAKI_LONG_STEP_SECONDS,
  DOPAGAKI_MAX,
  DOPAGAKI_MIN,
  DOPAGAKI_MISSED_BACKFILL_MAX_DAYS,
  DOPAGAKI_RAID_COMPLETED_DELTA,
  DOPAGAKI_RAID_EXITED_DELTA,
  DOPAGAKI_RAID_MISSED_DELTA,
} from '../constants/dopagaki';
import { WatchSession } from '../types/session';
import { jstDateKey, raidWindowPhase, shiftJstDateKey } from '../utils/jst';
import { StorageService } from './StorageService';

function clamp(level: number): number {
  return Math.max(DOPAGAKI_MIN, Math.min(DOPAGAKI_MAX, Math.round(level)));
}

export class DopagakiService {
  /** オンボーディングの自己申告からドパガキ度を初期化する */
  static async initialize(shortsUsageId: string): Promise<number> {
    const initial = DOPAGAKI_INITIAL_BY_USAGE[shortsUsageId] ?? DOPAGAKI_DEFAULT_INITIAL;
    await StorageService.saveDopagakiLevel(initial);
    return initial;
  }

  static async getLevel(): Promise<number> {
    const stored = await StorageService.getDopagakiLevel();
    return clamp(stored ?? DOPAGAKI_DEFAULT_INITIAL);
  }

  private static async adjust(delta: number): Promise<{ level: number; applied: number }> {
    const current = await DopagakiService.getLevel();
    const next = clamp(current + delta);
    await StorageService.saveDopagakiLevel(next);
    return { level: next, applied: next - current };
  }

  /** 公式レイドの結果を反映（完走−3 / 途中離脱+1） */
  static async applyRaidOutcome(completed: boolean): Promise<{ level: number; applied: number }> {
    return DopagakiService.adjust(completed ? DOPAGAKI_RAID_COMPLETED_DELTA : DOPAGAKI_RAID_EXITED_DELTA);
  }

  /**
   * 通常ロング（追い脱ドパ含む）の実視聴時間を反映。
   * 3分ごとに−1、1日の減少は合計−3まで。
   */
  static async applyLongWatched(dateKey: string, watchedSeconds: number): Promise<{ level: number; applied: number }> {
    const steps = Math.floor(watchedSeconds / DOPAGAKI_LONG_STEP_SECONDS);
    if (steps <= 0) {
      const level = await DopagakiService.getLevel();
      return { level, applied: 0 };
    }
    const reductionMap = await StorageService.getDopagakiLongReduction();
    const alreadyApplied = reductionMap[dateKey] ?? 0;
    const remaining = Math.max(0, DOPAGAKI_LONG_DAILY_CAP - alreadyApplied);
    const applySteps = Math.min(steps, remaining);
    if (applySteps <= 0) {
      const level = await DopagakiService.getLevel();
      return { level, applied: 0 };
    }
    reductionMap[dateKey] = alreadyApplied + applySteps;
    await StorageService.saveDopagakiLongReduction(reductionMap);
    return DopagakiService.adjust(applySteps * DOPAGAKI_LONG_STEP_DELTA);
  }

  /**
   * 公式レイド未参加の日への+1を、日付単位で1回だけ適用する。
   * 長期間未起動でも直近 DOPAGAKI_MISSED_BACKFILL_MAX_DAYS 日ぶんまでしか遡らない。
   * 「今日」は22:03を過ぎてレイド参加記録がない場合のみ対象。
   */
  static async processMissedDays(sessions: WatchSession[], now = new Date()): Promise<void> {
    const firstUse = await StorageService.getFirstUseDateKey();
    if (!firstUse) {
      return;
    }
    const processed = new Set(await StorageService.getDopagakiMissedProcessed());
    const raidDates = new Set(
      sessions.filter((session) => session.kind === 'raid' && session.status !== 'active').map((session) => session.dateKey),
    );

    const todayKey = jstDateKey(now);
    const candidates: string[] = [];
    for (let daysAgo = DOPAGAKI_MISSED_BACKFILL_MAX_DAYS; daysAgo >= 1; daysAgo -= 1) {
      candidates.push(shiftJstDateKey(todayKey, -daysAgo));
    }
    if (raidWindowPhase(now) === 'closed') {
      candidates.push(todayKey);
    }

    let missedCount = 0;
    const newlyProcessed: string[] = [];
    for (const dateKey of candidates) {
      if (dateKey < firstUse || processed.has(dateKey)) {
        continue;
      }
      if (!raidDates.has(dateKey)) {
        missedCount += 1;
      }
      newlyProcessed.push(dateKey);
    }

    if (newlyProcessed.length === 0) {
      return;
    }
    if (missedCount > 0) {
      await DopagakiService.adjust(missedCount * DOPAGAKI_RAID_MISSED_DELTA);
    }
    await StorageService.saveDopagakiMissedProcessed([...processed, ...newlyProcessed].sort());
  }
}
