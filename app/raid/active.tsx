
// 視聴フロー本体。mode:
// - raid:  公式レイド（22:00:00〜22:02:59のみ。全ユーザー共通動画・3分固定）
// - catchup: 追い脱ドパ（公式レイドと同じ動画を3分。記録は通常ロング扱い）
// - long:  今日の1本（視聴時間は選択制）
// - first: オンボーディングの初回3分ロング
//
// ローカル記録（SessionService）が主。Supabase同期は非同期キューで行い、
// 通信の完了を視聴開始・リザルト表示の条件にしない。

import { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { WatchPlayer } from '../../src/components/player/WatchPlayer';
import { playerCopy, resultCopy } from '../../src/constants/copy';
import { RAID_DURATION_SECONDS } from '../../src/constants/raid';
import { colors } from '../../src/constants/theme';
import { ExitReason, LongSource, WatchSession } from '../../src/types/session';
import { ResolvedVideo } from '../../src/types/video';
import { AnalyticsService } from '../../src/services/AnalyticsService';
import { RaidSyncService } from '../../src/services/RaidSyncService';
import { SessionService } from '../../src/services/SessionService';
import { StorageService } from '../../src/services/StorageService';
import { VideoDeliveryService } from '../../src/services/VideoDeliveryService';

type WatchMode = 'raid' | 'catchup' | 'long' | 'first';

function parseMode(value?: string): WatchMode {
  if (value === 'raid' || value === 'catchup' || value === 'first') {
    return value;
  }
  return 'long';
}

export default function ActiveWatchScreen() {
  const params = useLocalSearchParams<{ mode?: string; duration?: string }>();
  const mode = parseMode(params.mode);
  const isRaid = mode === 'raid';
  const targetSeconds = isRaid || mode === 'catchup' || mode === 'first'
    ? RAID_DURATION_SECONDS
    : Math.max(60, Number(params.duration) || RAID_DURATION_SECONDS);

  const [video, setVideo] = useState<ResolvedVideo | null>(null);
  const sessionRef = useRef<WatchSession | null>(null);
  const startingRef = useRef(false);
  const watchedRef = useRef(0);

  // 起動時: 開始可否の検証 → 動画解決 → セッション開始（すべてローカルで即決）
  useEffect(() => {
    let cancelled = false;
    const start = async () => {
      if (startingRef.current) {
        return;
      }
      startingRef.current = true;

      const manifest = await VideoDeliveryService.getLocalManifest();
      const videoId = mode === 'long'
        ? VideoDeliveryService.getLongVideoId(manifest)
        : VideoDeliveryService.getRaidVideoId(manifest);
      const resolved = await VideoDeliveryService.resolveVideo(videoId, manifest);
      if (cancelled) {
        return;
      }

      const longSource: LongSource | undefined =
        mode === 'catchup' ? 'catchup' : mode === 'first' ? 'first_long' : mode === 'long' ? 'daily' : undefined;
      // startSession が二重起動防止・公式時間検証の最終防衛を担う。
      // 開始できない（当日レイド済み・窓外）場合は null を返すのでホームへ戻す。
      const session = await SessionService.startSession({
        kind: isRaid ? 'raid' : 'long',
        longSource,
        videoId,
        targetSeconds,
      });
      if (!session) {
        void AnalyticsService.track('raid_start_rejected', { mode });
        router.replace('/(tabs)');
        return;
      }
      sessionRef.current = session;
      if (resolved.source == null) {
        void AnalyticsService.track('video_fallback_used', { videoId });
      }

      if (isRaid) {
        void RaidSyncService.enqueueStart(session);
        void AnalyticsService.track('raid_started');
      } else {
        void AnalyticsService.track(
          mode === 'catchup' ? 'catchup_long_started' : mode === 'first' ? 'first_long_started' : 'long_started',
        );
      }

      setVideo(resolved);
    };
    void start();
    return () => {
      cancelled = true;
    };
  }, [isRaid, mode, targetSeconds]);

  // 画面アンマウントの最終防衛: タブ遷移・ナビpop・ジェスチャー等で
  // 確定されないまま離脱しても、そこまでの視聴時間を保存し active を残さない。
  // すでに確定済みなら finalizeSession が null を返すので二重加算されない。
  useEffect(
    () => () => {
      const session = sessionRef.current;
      if (session) {
        void SessionService.finalizeSession(session.sessionId, {
          completed: false,
          watchedSeconds: watchedRef.current,
          exitReason: 'user_exit',
        });
      }
    },
    [],
  );

  const finish = useCallback(
    async (completed: boolean, watchedSeconds: number, exitReason?: ExitReason) => {
      const session = sessionRef.current;
      if (!session) {
        router.replace('/(tabs)');
        return;
      }
      const summary = await SessionService.finalizeSession(session.sessionId, {
        completed,
        watchedSeconds,
        exitReason,
      });
      if (!summary) {
        // すでに確定済み（二重呼び出し）。何も加算しない
        return;
      }

      if (isRaid) {
        void RaidSyncService.enqueueFinish(summary.session);
        void AnalyticsService.track(completed ? 'raid_completed' : 'raid_exited', {
          watchedSeconds: summary.session.watchedSeconds,
        });
      } else {
        if (completed) {
          void AnalyticsService.track(mode === 'first' ? 'first_long_completed' : 'long_completed', {
            watchedSeconds: summary.session.watchedSeconds,
          });
        }
      }

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
    },
    [isRaid, mode],
  );

  const trackMilestone = useCallback(
    (seconds: number) => {
      if (isRaid) {
        if (seconds === 30) {
          void AnalyticsService.track('raid_30s_reached');
        } else if (seconds === 60) {
          void AnalyticsService.track('raid_60s_reached');
        }
      } else if (mode === 'first' && seconds === 30) {
        void AnalyticsService.track('first_long_30s_reached');
      }
    },
    [isRaid, mode],
  );

  return (
    <>
      <StatusBar hidden style="light" />
      {video ? (
        <WatchPlayer
          video={video}
          kindLabel={isRaid ? playerCopy.raidLabel : mode === 'catchup' ? resultCopy.catchupKindLabel : playerCopy.longLabel}
          targetSeconds={targetSeconds}
          failOnBackground={isRaid}
          onComplete={(watchedSeconds) => void finish(true, watchedSeconds)}
          onExit={(reason, watchedSeconds) => void finish(false, watchedSeconds, reason)}
          onMilestone={trackMilestone}
          onProgress={(watchedSeconds) => {
            watchedRef.current = watchedSeconds;
          }}
        />
      ) : (
        <View style={{ flex: 1, backgroundColor: colors.black }} />
      )}
    </>
  );
}
