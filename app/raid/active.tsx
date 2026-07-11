
import { useCallback, useMemo, useRef } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { VideoPlayerShell } from '../../src/components/VideoPlayerShell';
import { FailureReason } from '../../src/types/result';
import { WatchMode } from '../../src/types/video';
import { DopamineService } from '../../src/services/DopamineService';
import { LongVideoService } from '../../src/services/LongVideoService';
import { RaidService } from '../../src/services/RaidService';
import { ResultService } from '../../src/services/ResultService';
import { StorageService } from '../../src/services/StorageService';

export default function ActiveRaidScreen() {
  const params = useLocalSearchParams<{ mode?: WatchMode; videoId?: string; duration?: string }>();
  const handledRef = useRef(false);
  const mode: WatchMode = params.mode === 'normal' ? 'normal' : 'raid';
  const duration = Number(params.duration) || 180;
  const video = useMemo(() => LongVideoService.findById(params.videoId), [params.videoId]);
  const startedAt = useMemo(() => new Date().toISOString(), []);
  const isLongMode = mode === 'normal';

  const finish = useCallback(
    async (
      status: 'completed' | 'escaped',
      watchedSeconds: number,
      spikeDelta: number,
      failureReason: FailureReason = 'none',
    ) => {
      if (handledRef.current) {
        return;
      }
      handledRef.current = true;
      const settings = await StorageService.getSettings();
      const result = ResultService.createResult({
        status,
        mode,
        targetSeconds: duration,
        watchedSeconds: Math.min(watchedSeconds, duration),
        videoId: video.id,
        failureReason,
        raidStartedAt: startedAt,
        raidEndedAt: new Date().toISOString(),
        scheduledRaidTime: mode === 'raid' ? RaidService.getTodayRaidTime(settings) : undefined,
      });
      await StorageService.saveDailyResult(result);
      await StorageService.appendVideoWatchHistory(
        LongVideoService.createWatchRecord({
          videoId: video.id,
          mode,
          targetSeconds: duration,
          completed: status === 'completed',
        }),
      );
      if (mode === 'raid') {
        await StorageService.saveCurrentRaidState(null);
      }

      // セッションの結果を持続的なドパガキ度へ反映し、増減をリザルトに渡す
      const outcome = await DopamineService.adjust(
        DopamineService.sessionOutcomeDelta(status === 'completed', Math.min(watchedSeconds, duration)),
      );
      const sessionDelta = spikeDelta + outcome.applied;

      router.replace({
        pathname: '/raid/result',
        params: { date: result.date, mode: result.mode, level: String(outcome.level), delta: String(sessionDelta) },
      });
    },
    [duration, mode, startedAt, video.id],
  );

  return (
    <>
      <StatusBar hidden={isLongMode} style="light" />
      <VideoPlayerShell
        video={video}
        mode={mode}
        targetSeconds={duration}
        onComplete={(watchedSeconds, spikeDelta) => void finish('completed', watchedSeconds, spikeDelta)}
        onFail={(reason, watchedSeconds, spikeDelta) => void finish('escaped', watchedSeconds, spikeDelta, reason)}
      />
    </>
  );
}
