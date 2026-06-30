
import { useCallback, useMemo, useRef } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { VideoPlayerShell } from '../../src/components/VideoPlayerShell';
import { FailureReason } from '../../src/types/result';
import { WatchMode } from '../../src/types/video';
import { LongVideoService } from '../../src/services/LongVideoService';
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
    async (status: 'completed' | 'escaped', watchedSeconds: number, failureReason: FailureReason = 'none') => {
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
        scheduledRaidTime: mode === 'raid' ? settings.raidTime : undefined,
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
      router.replace({ pathname: '/raid/result', params: { date: result.date, mode: result.mode } });
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
        onComplete={(watchedSeconds) => void finish('completed', watchedSeconds)}
        onFail={(reason, watchedSeconds) => void finish('escaped', watchedSeconds, reason)}
      />
    </>
  );
}
