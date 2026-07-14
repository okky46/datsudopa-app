
// 累計脱ドパ時間・ドパガキ度・日次ロングstep・未参加処理・初回利用日を、
// 単一の ProgressState として原子的に更新する。すべての更新は mutex で直列化し、
// 1回の read-modify-write（AsyncStorageの単一キー書き込み）で完結させる。
// これにより finalize の途中失敗でも状態が食い違わず、二重実行でも二重反映しない。

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
import { ProgressState } from '../types/progress';
import { WatchSession } from '../types/session';
import { jstDateKey, raidWindowPhase, shiftJstDateKey } from '../utils/jst';
import { Mutex } from '../utils/mutex';
import { StorageService } from './StorageService';

const progressMutex = new Mutex();

function emptyState(): ProgressState {
  return {
    totalDetoxSeconds: 0,
    dopagakiLevel: null,
    longSecondsByDate: {},
    longReductionByDate: {},
    missedProcessedDates: [],
    firstUseDateKey: null,
    firstEligibleRaidDateKey: null,
    appliedSessionIds: [],
  };
}

function clampLevel(level: number): number {
  return Math.max(DOPAGAKI_MIN, Math.min(DOPAGAKI_MAX, Math.round(level)));
}

/** 直近分だけ保持してオブジェクトの肥大化を防ぐ */
function pruneByDate<T>(map: Record<string, T>, keep = 21): Record<string, T> {
  const entries = Object.entries(map).sort((a, b) => b[0].localeCompare(a[0])).slice(0, keep);
  return Object.fromEntries(entries);
}

export type EffectResult = { totalDetoxSeconds: number; dopagakiLevel: number; applied: number };

export class ProgressService {
  /**
   * 進捗状態を読み込む。旧仕様（個別キー）からの移行を1度だけ行う。
   * 既存の確定済みセッションは「反映済み」として登録し、復旧で二重加算しない。
   */
  private static async load(sessionsForMigration?: WatchSession[]): Promise<ProgressState> {
    const stored = await StorageService.getProgressState();
    if (stored) {
      return { ...emptyState(), ...stored };
    }

    // --- 旧個別キーからの移行 ---
    const sessions = sessionsForMigration ?? (await StorageService.getSessions());
    const legacyLevel = await StorageService.getDopagakiLevel();
    const migrated: ProgressState = {
      ...emptyState(),
      totalDetoxSeconds: await StorageService.getTotalDetoxSeconds(),
      dopagakiLevel: legacyLevel,
      longReductionByDate: await StorageService.getDopagakiLongReduction(),
      missedProcessedDates: await StorageService.getDopagakiMissedProcessed(),
      firstUseDateKey: await StorageService.getFirstUseDateKey(),
      firstEligibleRaidDateKey: await StorageService.getFirstUseDateKey(),
    };
    // 既存の確定済みロングから日次累計秒を復元し、確定済みセッションを反映済みとして登録
    for (const session of sessions) {
      if (session.status === 'active') {
        continue;
      }
      if (session.kind === 'long') {
        migrated.longSecondsByDate[session.dateKey] =
          (migrated.longSecondsByDate[session.dateKey] ?? 0) + session.watchedSeconds;
      }
      migrated.appliedSessionIds.push(session.sessionId);
    }
    await StorageService.saveProgressState(migrated);
    return migrated;
  }

  private static async mutate<T>(fn: (draft: ProgressState) => T, sessionsForMigration?: WatchSession[]): Promise<T> {
    return progressMutex.runExclusive(async () => {
      const state = await ProgressService.load(sessionsForMigration);
      const result = fn(state);
      state.longSecondsByDate = pruneByDate(state.longSecondsByDate);
      state.longReductionByDate = pruneByDate(state.longReductionByDate);
      state.missedProcessedDates = state.missedProcessedDates.slice(-40);
      state.appliedSessionIds = state.appliedSessionIds.slice(-400);
      await StorageService.saveProgressState(state);
      return result;
    });
  }

  static async getTotalDetoxSeconds(): Promise<number> {
    return (await ProgressService.load()).totalDetoxSeconds;
  }

  static async getLevel(): Promise<number> {
    const state = await ProgressService.load();
    return clampLevel(state.dopagakiLevel ?? DOPAGAKI_DEFAULT_INITIAL);
  }

  /** オンボーディング完了時: 初期ドパガキ度・初回利用日・未参加判定開始日を設定 */
  static async initializeOnComplete(shortsUsageId: string, now = new Date()): Promise<number> {
    const initial = DOPAGAKI_INITIAL_BY_USAGE[shortsUsageId] ?? DOPAGAKI_DEFAULT_INITIAL;
    const today = jstDateKey(now);
    // 22:03以降（窓が閉じた後）に初回登録したら、当日は未参加判定の対象外＝翌日から
    const firstEligible = raidWindowPhase(now) === 'closed' ? shiftJstDateKey(today, 1) : today;
    await ProgressService.mutate((draft) => {
      draft.dopagakiLevel = initial;
      if (!draft.firstUseDateKey) {
        draft.firstUseDateKey = today;
      }
      if (!draft.firstEligibleRaidDateKey) {
        draft.firstEligibleRaidDateKey = firstEligible;
      }
    });
    return initial;
  }

  /**
   * セッション確定の効果（累計加算・ドパガキ度）を反映する。
   * appliedSessionIds で冪等化し、1回のwriteで原子的に適用する。
   */
  static async applySessionEffects(session: WatchSession): Promise<EffectResult> {
    return ProgressService.mutate((draft) => {
      if (draft.appliedSessionIds.includes(session.sessionId)) {
        return {
          totalDetoxSeconds: draft.totalDetoxSeconds,
          dopagakiLevel: clampLevel(draft.dopagakiLevel ?? DOPAGAKI_DEFAULT_INITIAL),
          applied: 0,
        };
      }

      draft.totalDetoxSeconds = Math.max(0, draft.totalDetoxSeconds + Math.max(0, session.watchedSeconds));

      let applied = 0;
      const before = draft.dopagakiLevel ?? DOPAGAKI_DEFAULT_INITIAL;

      if (session.kind === 'raid') {
        const next = clampLevel(before + (session.status === 'completed' ? DOPAGAKI_RAID_COMPLETED_DELTA : DOPAGAKI_RAID_EXITED_DELTA));
        applied = next - before;
        draft.dopagakiLevel = next;
      } else {
        // 通常ロング: 日次累計秒を加算し、floor(累計/180) を1日最大capまでstepとして反映
        const dateKey = session.dateKey;
        draft.longSecondsByDate[dateKey] = (draft.longSecondsByDate[dateKey] ?? 0) + Math.max(0, session.watchedSeconds);
        const eligibleSteps = Math.min(
          DOPAGAKI_LONG_DAILY_CAP,
          Math.floor(draft.longSecondsByDate[dateKey] / DOPAGAKI_LONG_STEP_SECONDS),
        );
        const alreadySteps = draft.longReductionByDate[dateKey] ?? 0;
        const newSteps = eligibleSteps - alreadySteps;
        if (newSteps > 0) {
          const next = clampLevel(before + newSteps * DOPAGAKI_LONG_STEP_DELTA);
          applied = next - before;
          draft.dopagakiLevel = next;
          draft.longReductionByDate[dateKey] = alreadySteps + newSteps;
        }
      }

      draft.appliedSessionIds.push(session.sessionId);
      return {
        totalDetoxSeconds: draft.totalDetoxSeconds,
        dopagakiLevel: clampLevel(draft.dopagakiLevel ?? DOPAGAKI_DEFAULT_INITIAL),
        applied,
      };
    });
  }

  /**
   * 確定済みだが効果が未反映のセッションを起動時に復旧する。
   * applySessionEffects が冪等なので、既に反映済みなら何もしない。
   */
  static async recoverPendingEffects(sessions: WatchSession[]): Promise<void> {
    const state = await ProgressService.load(sessions);
    const applied = new Set(state.appliedSessionIds);
    for (const session of sessions) {
      if (session.status !== 'active' && !applied.has(session.sessionId)) {
        await ProgressService.applySessionEffects(session);
      }
    }
  }

  /**
   * 公式レイド未参加の日への+1を、日付単位で1回だけ適用する。
   * firstEligibleRaidDateKey より前（初回登録日が22:03以降なら当日）は対象外。
   * 長期間未起動でも直近 DOPAGAKI_MISSED_BACKFILL_MAX_DAYS 日ぶんまでしか遡らない。
   */
  static async processMissedDays(sessions: WatchSession[], now = new Date()): Promise<void> {
    await ProgressService.mutate((draft) => {
      const lowerBound = draft.firstEligibleRaidDateKey ?? draft.firstUseDateKey;
      if (!lowerBound || draft.dopagakiLevel == null) {
        return;
      }
      const processed = new Set(draft.missedProcessedDates);
      const raidDates = new Set(
        sessions.filter((s) => s.kind === 'raid' && s.status !== 'active').map((s) => s.dateKey),
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
      for (const dateKey of candidates) {
        if (dateKey < lowerBound || processed.has(dateKey)) {
          continue;
        }
        if (!raidDates.has(dateKey)) {
          missedCount += 1;
        }
        processed.add(dateKey);
        draft.missedProcessedDates.push(dateKey);
      }
      if (missedCount > 0) {
        draft.dopagakiLevel = clampLevel(draft.dopagakiLevel + missedCount * DOPAGAKI_RAID_MISSED_DELTA);
      }
    }, sessions);
  }
}
