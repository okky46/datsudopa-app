
// 公式レイドの開始可否とホーム表示状態。毎日22:00 JST固定、開始猶予は180秒。

import { WatchSession } from '../types/session';
import {
  nextRaidStartAt,
  raidWindowPhase,
  raidWindowSecondsLeft,
} from '../utils/jst';
import { SessionService } from './SessionService';

export type RaidHomeState =
  | { phase: 'countdown'; startAt: Date }
  | { phase: 'open'; secondsLeft: number }
  | { phase: 'done'; raidStatus: 'completed' | 'exited'; nextStartAt: Date }
  | { phase: 'catchup'; nextStartAt: Date };

export class RaidService {
  /**
   * 22:00:00〜22:02:59 かつ、当日のレイドセッションが状態を問わず存在しない場合のみ開始可能。
   * active セッションも含めて判定し、二重起動を防ぐ（最終防衛は SessionService.startSession）。
   */
  static canStartOfficialRaid(sessions: WatchSession[], now = new Date()): boolean {
    if (raidWindowPhase(now) !== 'open') {
      return false;
    }
    return !SessionService.hasAnyRaidSessionToday(sessions, now);
  }

  static getHomeState(sessions: WatchSession[], now = new Date()): RaidHomeState {
    const todayRaid = SessionService.getTodayRaidSession(sessions, now);
    if (todayRaid) {
      return {
        phase: 'done',
        raidStatus: todayRaid.status === 'completed' ? 'completed' : 'exited',
        nextStartAt: nextRaidStartAt(now),
      };
    }

    const phase = raidWindowPhase(now);
    if (phase === 'before') {
      return { phase: 'countdown', startAt: nextRaidStartAt(now) };
    }
    if (phase === 'open') {
      return { phase: 'open', secondsLeft: raidWindowSecondsLeft(now) };
    }
    return { phase: 'catchup', nextStartAt: nextRaidStartAt(now) };
  }
}
