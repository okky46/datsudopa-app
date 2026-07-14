import { router } from 'expo-router';
import { ExitReason, WatchSession } from '../types/session';
import { AnalyticsService } from './AnalyticsService';
import { RaidSyncService } from './RaidSyncService';
import { SessionService } from './SessionService';

type FinalizeOptions = {
  session: WatchSession;
  completed: boolean;
  watchedSeconds: number;
  exitReason?: ExitReason;
  navigateToResult: boolean;
  mode: 'raid' | 'catchup' | 'long' | 'first';
};

export class WatchFinalizeService {
  static async finalize(options: FinalizeOptions): Promise<boolean> {
    const summary = await SessionService.finalizeSession(options.session.sessionId, {
      completed: options.completed,
      watchedSeconds: options.watchedSeconds,
      exitReason: options.exitReason,
    });
    if (!summary) {
      return false;
    }

    if (summary.session.kind === 'raid') {
      await RaidSyncService.enqueueFinish(summary.session);
      void AnalyticsService.track(options.completed ? 'raid_completed' : 'raid_exited', {
        watchedSeconds: summary.session.watchedSeconds,
      });
    } else if (options.completed) {
      void AnalyticsService.track(options.mode === 'first' ? 'first_long_completed' : 'long_completed', {
        watchedSeconds: summary.session.watchedSeconds,
      });
    }

    if (options.navigateToResult) {
      router.replace({
        pathname: '/raid/result',
        params: {
          sessionId: summary.session.sessionId,
          total: String(summary.totalDetoxSeconds),
          level: String(summary.dopagakiLevel),
          delta: String(summary.dopagakiDelta),
          streak: String(summary.streakDays),
        },
      });
    }
    return true;
  }
}
