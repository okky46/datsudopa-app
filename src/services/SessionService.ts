
// 視聴セッションのライフサイクル管理。
// startSession → finalizeSession の1往復で、累計脱ドパ時間とドパガキ度へ1回だけ反映する。
// finalize は status==='active' のセッションにしか効かないため、二重タップ・二重保存でも二重加算されない。

import * as Crypto from 'expo-crypto';
import { STREAK_MIN_SECONDS_PER_DAY } from '../constants/raid';
import {
  DayHistory,
  DayHistoryStatus,
  ExitReason,
  LongSource,
  SessionKind,
  SessionSummary,
  WatchSession,
} from '../types/session';
import { jstDateKey, jstWeekStartKey, raidWindowPhase, shiftJstDateKey, todayRaidId } from '../utils/jst';
import { Mutex } from '../utils/mutex';
import { DopagakiService } from './DopagakiService';
import { StorageService } from './StorageService';

type StartInput = {
  kind: SessionKind;
  longSource?: LongSource;
  videoId: string;
  targetSeconds: number;
};

type FinalizeInput = {
  completed: boolean;
  watchedSeconds: number;
  exitReason?: ExitReason;
};

/** active のまま放置されたセッションを離脱扱いにするまでの猶予（ms） */
const STALE_ACTIVE_GRACE_MS = 10 * 60 * 1000;

// セッション開始・確定・復旧を直列化する。ボタン連打・通知二重処理・画面二重遷移で
// 同時に呼ばれても、read-modify-write が重ならず1セッションだけ作られ、1回だけ反映される。
const sessionMutex = new Mutex();

export class SessionService {
  /**
   * 視聴セッションを開始する。公式レイドは1日1セッションに制限し、mutexで排他する。
   * 開始できない場合（当日レイド済み・公式時間外）は null を返す。
   */
  static async startSession(input: StartInput, now = new Date()): Promise<WatchSession | null> {
    return sessionMutex.runExclusive(async () => {
      const sessions = await StorageService.getSessions();

      if (input.kind === 'raid') {
        // 二重起動の最終防衛: 当日のraidが active/completed/exited のいずれでも存在すれば拒否
        if (SessionService.hasAnyRaidSessionToday(sessions, now)) {
          return null;
        }
        // 公式時間外での開始も拒否（UI判定に依存しない最終防衛）
        if (raidWindowPhase(now) !== 'open') {
          return null;
        }
      }

      const session: WatchSession = {
        sessionId: Crypto.randomUUID(),
        kind: input.kind,
        longSource: input.kind === 'long' ? input.longSource ?? 'daily' : undefined,
        raidId: input.kind === 'raid' ? todayRaidId(now) : undefined,
        dateKey: jstDateKey(now),
        videoId: input.videoId,
        startedAt: now.toISOString(),
        targetSeconds: input.targetSeconds,
        watchedSeconds: 0,
        status: 'active',
      };
      await StorageService.saveSessions([session, ...sessions]);
      return session;
    });
  }

  /** 当日の公式レイドセッションが状態を問わず存在するか（開始可否の最終判定に使う） */
  static hasAnyRaidSessionToday(sessions: WatchSession[], now = new Date()): boolean {
    const today = jstDateKey(now);
    return sessions.some((session) => session.kind === 'raid' && session.dateKey === today);
  }

  /**
   * セッションを確定し、累計・ドパガキ度へ反映して集計を返す。
   * すでに確定済み（activeでない）の場合は null を返し、何も加算しない。
   */
  static async finalizeSession(sessionId: string, outcome: FinalizeInput, now = new Date()): Promise<SessionSummary | null> {
    const sessions = await StorageService.getSessions();
    const index = sessions.findIndex((item) => item.sessionId === sessionId);
    if (index < 0 || sessions[index].status !== 'active') {
      return null;
    }

    const target = sessions[index].targetSeconds;
    const watchedSeconds = Math.max(0, Math.min(Math.round(outcome.watchedSeconds), target));
    const updated: WatchSession = {
      ...sessions[index],
      status: outcome.completed ? 'completed' : 'exited',
      watchedSeconds,
      endedAt: now.toISOString(),
      exitReason: outcome.completed ? undefined : outcome.exitReason ?? 'user_exit',
    };
    const nextSessions = [...sessions];
    nextSessions[index] = updated;
    await StorageService.saveSessions(nextSessions);

    const total = (await StorageService.getTotalDetoxSeconds()) + watchedSeconds;
    await StorageService.saveTotalDetoxSeconds(total);

    const dopagaki =
      updated.kind === 'raid'
        ? await DopagakiService.applyRaidOutcome(outcome.completed)
        : await DopagakiService.applyLongWatched(updated.dateKey, watchedSeconds);

    return {
      session: updated,
      totalDetoxSeconds: total,
      dopagakiLevel: dopagaki.level,
      dopagakiDelta: dopagaki.applied,
      streakDays: SessionService.getStreakDays(nextSessions, now),
    };
  }

  static async findSession(sessionId: string): Promise<WatchSession | null> {
    const sessions = await StorageService.getSessions();
    return sessions.find((item) => item.sessionId === sessionId) ?? null;
  }

  /**
   * アプリ強制終了などで active のまま残ったセッションを離脱として確定する。
   * 実際の視聴秒数は分からないため加算は0秒（過大加算を避ける）。
   */
  static async cleanupStaleActiveSessions(now = new Date()): Promise<void> {
    const sessions = await StorageService.getSessions();
    for (const session of sessions) {
      if (session.status !== 'active') {
        continue;
      }
      const deadline = new Date(session.startedAt).getTime() + session.targetSeconds * 1000 + STALE_ACTIVE_GRACE_MS;
      if (now.getTime() > deadline) {
        await SessionService.finalizeSession(session.sessionId, {
          completed: false,
          watchedSeconds: 0,
          exitReason: 'backgrounded',
        }, now);
      }
    }
  }

  // --- 集計 ---

  static hasRaidSessionForDate(sessions: WatchSession[], dateKey: string): boolean {
    return sessions.some((session) => session.kind === 'raid' && session.dateKey === dateKey && session.status !== 'active');
  }

  static getTodayRaidSession(sessions: WatchSession[], now = new Date()): WatchSession | undefined {
    const today = jstDateKey(now);
    return sessions.find((session) => session.kind === 'raid' && session.dateKey === today && session.status !== 'active');
  }

  /** 日ごとの合計視聴秒数（確定済みセッションのみ） */
  static getDailySeconds(sessions: WatchSession[]): Record<string, number> {
    const map: Record<string, number> = {};
    for (const session of sessions) {
      if (session.status === 'active') {
        continue;
      }
      map[session.dateKey] = (map[session.dateKey] ?? 0) + session.watchedSeconds;
    }
    return map;
  }

  /** その日にレイドまたはロングで合計3分以上視聴した日を「継続」として数える */
  static getStreakDays(sessions: WatchSession[], now = new Date()): number {
    const daily = SessionService.getDailySeconds(sessions);
    let cursor = jstDateKey(now);
    if ((daily[cursor] ?? 0) < STREAK_MIN_SECONDS_PER_DAY) {
      cursor = shiftJstDateKey(cursor, -1);
    }
    let streak = 0;
    while ((daily[cursor] ?? 0) >= STREAK_MIN_SECONDS_PER_DAY) {
      streak += 1;
      cursor = shiftJstDateKey(cursor, -1);
    }
    return streak;
  }

  /** 今週（月曜はじまり）の日別履歴 */
  static getWeekHistory(sessions: WatchSession[], now = new Date()): DayHistory[] {
    const weekStart = jstWeekStartKey(now);
    const todayKey = jstDateKey(now);
    const finished = sessions.filter((session) => session.status !== 'active');

    const days: DayHistory[] = [];
    for (let offset = 0; offset < 7; offset += 1) {
      const dateKey = shiftJstDateKey(weekStart, offset);
      const daySessions = finished.filter((session) => session.dateKey === dateKey);
      const raid = daySessions.find((session) => session.kind === 'raid');
      let status: DayHistoryStatus = 'none';
      if (raid?.status === 'completed') {
        status = 'raid_completed';
      } else if (raid?.status === 'exited') {
        status = 'raid_exited';
      } else if (daySessions.some((session) => session.watchedSeconds > 0)) {
        status = 'long_only';
      }
      days.push({
        dateKey,
        status,
        isToday: dateKey === todayKey,
        isFuture: dateKey > todayKey,
      });
    }
    return days;
  }
}
