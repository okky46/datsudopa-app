
// 全画面プレイヤー。レイド中の表示は「映像・残り時間・中断操作」の3つだけ。
// 点・名前・人数・広告・煽り文言は表示しない（MVP_REQUIREMENTS.md 9章）。

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, AppState, AppStateStatus, BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { playerCopy } from '../../constants/copy';
import { colors, spacing, zenMaru } from '../../constants/theme';
import { ExitReason } from '../../types/session';
import { ResolvedVideo } from '../../types/video';
import { formatSeconds } from '../../utils/date';
import { clampWatchedSeconds, nextWatchedSecondsFromRemaining } from './watchProgress';

const videoText = '#F4F7FB';

type Props = {
  video: ResolvedVideo;
  kindLabel: string;
  targetSeconds: number;
  /** trueならbackground/inactiveで離脱扱いにする（公式レイド） */
  failOnBackground: boolean;
  onComplete: (watchedSeconds: number) => void;
  onExit: (reason: ExitReason, watchedSeconds: number) => void;
  /** 30秒・60秒到達などの分析用フック */
  onMilestone?: (seconds: number) => void;
  /** 毎秒の視聴経過。画面アンマウント時に確実に視聴時間を保存するため親が保持する */
  onProgress?: (watchedSeconds: number) => void;
};

function VideoSourceLayer({ video, onPlaybackError }: { video: ResolvedVideo; onPlaybackError: () => void }) {
  const source = video.source;
  const player = useVideoPlayer(source ?? null, (instance) => {
    instance.loop = true;
    instance.muted = true;
    if (source != null) {
      instance.play();
    }
  });

  useEffect(() => {
    if (source == null) {
      return undefined;
    }
    const subscription = player.addListener('statusChange', (payload) => {
      if (payload.status === 'error') {
        onPlaybackError();
      }
    });
    return () => subscription.remove();
  }, [onPlaybackError, player, source]);

  if (source == null) {
    return <GeneratedPlaceholder />;
  }
  return <VideoView player={player} style={StyleSheet.absoluteFill} nativeControls={false} contentFit="cover" />;
}

// 実動画が未配置のときの、静かな生成プレースホルダー。
// 外部取得に失敗してもレイド自体は成立させるための最終フォールバック。
function GeneratedPlaceholder() {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 4200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 5200, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.18, 0.6] });

  return (
    <View style={styles.generated}>
      <Animated.View style={[styles.lightPool, { opacity }]} />
      <View style={styles.horizon} />
    </View>
  );
}

export function WatchPlayer({ video, kindLabel, targetSeconds, failOnBackground, onComplete, onExit, onMilestone, onProgress }: Props) {
  const [remainingSeconds, setRemainingSeconds] = useState(targetSeconds);
  const handledRef = useRef(false);
  const watchedSecondsRef = useRef(0);
  const insets = useSafeAreaInsets();

  const watchedSeconds = useMemo(() => clampWatchedSeconds(targetSeconds - remainingSeconds, targetSeconds), [remainingSeconds, targetSeconds]);

  const trackedWatchedSeconds = useCallback(
    () => clampWatchedSeconds(watchedSecondsRef.current, targetSeconds),
    [targetSeconds],
  );

  const finishOnce = useCallback(
    (action: () => void) => {
      if (handledRef.current) {
        return;
      }
      handledRef.current = true;
      action();
    },
    [],
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingSeconds((current) => {
        const next = current - 1;
        const watched = nextWatchedSecondsFromRemaining(current, targetSeconds);
        watchedSecondsRef.current = watched;
        onProgress?.(watched);
        if (watched === 30 || watched === 60) {
          onMilestone?.(watched);
        }
        if (next <= 0) {
          finishOnce(() => onComplete(targetSeconds));
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [finishOnce, onComplete, onMilestone, onProgress, targetSeconds]);

  useEffect(() => {
    if (!failOnBackground) {
      return undefined;
    }
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        finishOnce(() => onExit('backgrounded', trackedWatchedSeconds()));
      }
    });
    return () => subscription.remove();
  }, [failOnBackground, finishOnce, onExit, trackedWatchedSeconds]);

  const handlePlaybackError = useCallback(() => {
    // 継続不能な再生エラーは離脱扱い（外部通信障害のみでは失敗にしない:
    // その場合はプレースホルダー描画側へフォールバック済みでここには来ない）
    finishOnce(() => onExit('playback_error', trackedWatchedSeconds()));
  }, [finishOnce, onExit, trackedWatchedSeconds]);

  const confirmExit = useCallback(() => {
    Alert.alert(playerCopy.exitConfirmTitle, playerCopy.exitConfirmMessage, [
      { text: playerCopy.exitConfirmContinue, style: 'cancel' },
      {
        text: playerCopy.exitConfirmQuit,
        style: 'destructive',
        onPress: () => finishOnce(() => onExit('user_exit', trackedWatchedSeconds())),
      },
    ]);
  }, [finishOnce, onExit, trackedWatchedSeconds]);

  // Androidハードウェア戻る・ジェスチャー戻るを中断確認へ集約する。
  // 確認なしに画面を離脱させない（return true でデフォルトの戻るを止める）。
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!handledRef.current) {
        confirmExit();
      }
      return true;
    });
    return () => subscription.remove();
  }, [confirmExit]);

  return (
    <View style={styles.container}>
      <VideoSourceLayer video={video} onPlaybackError={handlePlaybackError} />
      <View style={styles.scrim} pointerEvents="none" />

      <View style={[styles.top, { top: Math.max(insets.top, spacing.md) }]} pointerEvents="none">
        <Text style={styles.kind}>{kindLabel}</Text>
        <Text style={styles.remaining}>{formatSeconds(remainingSeconds)}</Text>
      </View>

      <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.md }]}>
        <Pressable onPress={confirmExit} style={({ pressed }) => [styles.exitButton, pressed && styles.exitPressed]}>
          <Text style={styles.exitText}>{playerCopy.exit}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  generated: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#04060B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightPool: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(201, 169, 106, 0.16)',
    transform: [{ scaleX: 1.8 }],
  },
  horizon: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '56%',
    height: 1,
    backgroundColor: 'rgba(244, 247, 251, 0.16)',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
  },
  top: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kind: {
    color: 'rgba(244, 247, 251, 0.45)',
    fontSize: 12,
    fontFamily: zenMaru('600'),
    fontWeight: '600',
    letterSpacing: 1.6,
  },
  remaining: {
    color: 'rgba(244, 247, 251, 0.7)',
    fontSize: 22,
    fontFamily: zenMaru('700'),
    fontWeight: '700',
    letterSpacing: 1,
    fontVariant: ['tabular-nums'],
  },
  bottom: {
    marginTop: 'auto',
    alignItems: 'center',
  },
  exitButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(244, 247, 251, 0.22)',
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  exitPressed: {
    opacity: 0.7,
  },
  exitText: {
    color: 'rgba(244, 247, 251, 0.75)',
    fontSize: 13,
    fontFamily: zenMaru('600'),
    fontWeight: '600',
  },
});
