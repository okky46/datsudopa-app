
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, AppState, AppStateStatus, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LONG_EXIT_CONFIRM, RAID_PLAYER_NOTE, dopaSpikeCopy, longPlayerHints } from '../constants/copy';
import { colors, gradientBar, spacing, zenMaru } from '../constants/theme';
import { DopamineService } from '../services/DopamineService';
import { DopaSpikeKind } from '../types/dopamine';
import { FailureReason } from '../types/result';
import { VideoAsset, WatchMode } from '../types/video';
import { formatSeconds } from '../utils/date';
import { CelebrationOverlay } from './player/CelebrationOverlay';
import { DopaSpikeOverlay, DopaSpikeOverlayHandle } from './player/DopaSpikeOverlay';
import { PressableScale } from './ui/Motion';
import { SoftGradient } from './ui/SoftGradient';

const videoText = '#F4F7FB';
const videoTextMuted = '#DDE8D8';

type Props = {
  video: VideoAsset;
  mode: WatchMode;
  targetSeconds: number;
  // spikeDelta: 視聴中の誘惑操作で上がったドパガキ度の合計
  onComplete: (watchedSeconds: number, spikeDelta: number) => void;
  onFail: (reason: FailureReason, watchedSeconds: number, spikeDelta: number) => void;
};

function RemoteVideoLayer({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = true;
    instance.muted = true;
    instance.play();
  });

  return <VideoView player={player} style={StyleSheet.absoluteFill} nativeControls={false} contentFit="cover" />;
}

function GeneratedPlaceholder({ mood }: { mood: string }) {
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

  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.72] });

  return (
    <View style={styles.generated}>
      <Animated.View style={[styles.lightPool, { opacity }]} />
      <View style={styles.horizon} />
      <View style={styles.horizonSoft} />
      <Text style={styles.generatedText}>{mood.replace('_', ' ')}</Text>
    </View>
  );
}

function VideoLayer({ video }: { video: VideoAsset }) {
  if (video.sourceType === 'remote') {
    return <RemoteVideoLayer uri={video.uri} />;
  }
  return <GeneratedPlaceholder mood={video.mood} />;
}

function SkipGlyph() {
  return (
    <View style={styles.skipGlyph}>
      <View style={styles.skipTriangle} />
      <View style={styles.skipTriangle} />
      <View style={styles.skipBar} />
    </View>
  );
}

function SpeedGlyph() {
  return <Text style={styles.speedGlyphText}>2×</Text>;
}

export function VideoPlayerShell({ video, mode, targetSeconds, onComplete, onFail }: Props) {
  const [remainingSeconds, setRemainingSeconds] = useState(targetSeconds);
  const [celebrating, setCelebrating] = useState(false);
  const handledRef = useRef(false);
  const finishedRef = useRef(false);
  const startedAtRef = useRef(Date.now());
  const spikeDeltaRef = useRef(0);
  const lastSpikeRef = useRef(0);
  const spikeOverlayRef = useRef<DopaSpikeOverlayHandle>(null);
  const insets = useSafeAreaInsets();

  const watchedSeconds = useMemo(() => Math.max(0, targetSeconds - remainingSeconds), [remainingSeconds, targetSeconds]);

  // スクロール・スキップ・倍速などの操作は、見た目だけ用意されていて実際はドパガキ度が上がる
  const triggerSpike = useCallback((kind: DopaSpikeKind) => {
    if (handledRef.current || finishedRef.current) {
      return;
    }
    const now = Date.now();
    if (now - lastSpikeRef.current < 700) {
      return;
    }
    lastSpikeRef.current = now;
    spikeOverlayRef.current?.show(dopaSpikeCopy[kind]);
    void DopamineService.spike().then(({ applied }) => {
      spikeDeltaRef.current += applied;
    });
  }, []);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) =>
          Math.abs(gesture.dy) > 24 && Math.abs(gesture.dy) > Math.abs(gesture.dx) * 1.4,
        onPanResponderRelease: (_event, gesture) => {
          if (Math.abs(gesture.dy) > 40) {
            triggerSpike('scroll');
          }
        },
      }),
    [triggerSpike],
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          if (!finishedRef.current) {
            finishedRef.current = true;
            const elapsed = Math.max(targetSeconds, Math.round((Date.now() - startedAtRef.current) / 1000));
            if (mode === 'normal') {
              // 完走演出を挟んでからリザルトへ
              setCelebrating(true);
            } else if (!handledRef.current) {
              handledRef.current = true;
              onComplete(elapsed, spikeDeltaRef.current);
            }
          }
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [mode, onComplete, targetSeconds]);

  useEffect(() => {
    if (mode !== 'raid') {
      return undefined;
    }

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if ((nextState === 'background' || nextState === 'inactive') && !handledRef.current) {
        handledRef.current = true;
        onFail('backgrounded', Math.round((Date.now() - startedAtRef.current) / 1000), spikeDeltaRef.current);
      }
    });
    return () => subscription.remove();
  }, [mode, onFail]);

  const confirmExit = () => {
    Alert.alert(LONG_EXIT_CONFIRM.title, LONG_EXIT_CONFIRM.message, [
      { text: LONG_EXIT_CONFIRM.continue, style: 'cancel' },
      {
        text: LONG_EXIT_CONFIRM.quit,
        style: 'destructive',
        onPress: () => {
          if (!handledRef.current) {
            handledRef.current = true;
            onFail('manual_exit', watchedSeconds, spikeDeltaRef.current);
          }
        },
      },
    ]);
  };

  const finishCelebration = useCallback(() => {
    if (!handledRef.current) {
      handledRef.current = true;
      onComplete(targetSeconds, spikeDeltaRef.current);
    }
  }, [onComplete, targetSeconds]);

  if (mode === 'normal') {
    const progress = targetSeconds > 0 ? Math.min(1, watchedSeconds / targetSeconds) : 0;
    const hint = longPlayerHints[Math.floor(watchedSeconds / 60) % longPlayerHints.length];

    return (
      <View style={styles.container}>
        <VideoLayer video={video} />

        {/* スクロールしたくなった指を検知するレイヤー */}
        <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers} />

        <View style={[styles.longTop, { top: Math.max(insets.top, spacing.md) }]} pointerEvents="none">
          <View style={styles.longTopRow}>
            <Text style={styles.longMode}>脱ドパロング</Text>
            <Text style={styles.longRemaining}>{formatSeconds(remainingSeconds)}</Text>
          </View>
          <Text style={styles.longHint} numberOfLines={1}>
            {hint}
          </Text>
        </View>

        <View style={[styles.actionRail, { bottom: 120 + insets.bottom }]}>
          <View style={styles.actionItem}>
            <PressableScale accessibilityRole="button" accessibilityLabel="スキップ" onPress={() => triggerSpike('skip')} style={styles.actionButton}>
              <SkipGlyph />
            </PressableScale>
            <Text style={styles.actionLabel}>スキップ</Text>
          </View>
          <View style={styles.actionItem}>
            <PressableScale accessibilityRole="button" accessibilityLabel="倍速" onPress={() => triggerSpike('speed')} style={styles.actionButton}>
              <SpeedGlyph />
            </PressableScale>
            <Text style={styles.actionLabel}>倍速</Text>
          </View>
        </View>

        <View style={[styles.longBottom, { paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.sm }]} pointerEvents="box-none">
          <Text style={styles.title}>{video.title}</Text>
          <Text style={styles.note} numberOfLines={2}>
            {video.description || ''}
          </Text>
          <Pressable onPress={confirmExit} style={styles.exitButton}>
            <Text style={styles.exitText}>視聴をやめる</Text>
          </Pressable>
        </View>

        <View style={[styles.progressTrack, { bottom: Math.max(insets.bottom, spacing.sm) }]} pointerEvents="none">
          <SoftGradient colors={gradientBar} direction="horizontal" style={{ width: `${Math.max(1, progress * 100)}%`, height: '100%' }} />
        </View>

        <DopaSpikeOverlay ref={spikeOverlayRef} />
        {celebrating && <CelebrationOverlay onDone={finishCelebration} />}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <VideoLayer video={video} />
      <View style={styles.scrim} />
      <View style={styles.top}>
        <Text style={styles.mode}>本日の脱ドパレイド</Text>
        <Text style={styles.remaining}>{formatSeconds(remainingSeconds)}</Text>
      </View>
      <View style={styles.bottom}>
        <Text style={styles.title}>{video.title}</Text>
        <Text style={styles.note}>{RAID_PLAYER_NOTE}</Text>
        <Pressable
          onPress={() => {
            if (!handledRef.current) {
              handledRef.current = true;
              onFail('emergency_exit', watchedSeconds, spikeDeltaRef.current);
            }
          }}
          style={styles.exitButton}
        >
          <Text style={styles.exitText}>中断する</Text>
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
    backgroundColor: 'rgba(143, 175, 138, 0.28)',
    transform: [{ scaleX: 1.8 }],
  },
  horizon: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '54%',
    height: 1,
    backgroundColor: 'rgba(244, 247, 251, 0.22)',
  },
  horizonSoft: {
    position: 'absolute',
    left: 28,
    right: 28,
    top: '62%',
    height: 2,
    backgroundColor: 'rgba(143, 175, 138, 0.14)',
  },
  generatedText: {
    color: 'rgba(244, 247, 251, 0.18)',
    letterSpacing: 8,
    textTransform: 'uppercase',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.36)',
  },
  longTop: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    gap: spacing.xs,
  },
  longTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  longMode: {
    color: 'rgba(244, 247, 251, 0.4)',
    fontSize: 12,
    fontFamily: zenMaru('600'),
    fontWeight: '600',
    letterSpacing: 1.6,
  },
  // 残り時間は薄い文字で右上に
  longRemaining: {
    color: 'rgba(244, 247, 251, 0.45)',
    fontSize: 16,
    fontFamily: zenMaru('700'),
    fontWeight: '700',
    letterSpacing: 1,
    fontVariant: ['tabular-nums'],
  },
  // 視聴中の一言。騒がず、映像の上にそっと置く
  longHint: {
    color: 'rgba(244, 247, 251, 0.55)',
    fontSize: 13,
    fontFamily: zenMaru('500'),
    fontWeight: '500',
    letterSpacing: 0.4,
  },
  actionRail: {
    position: 'absolute',
    right: spacing.md,
    gap: spacing.md,
    alignItems: 'center',
  },
  actionItem: {
    alignItems: 'center',
    gap: 4,
  },
  actionButton: {
    width: 52,
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    borderWidth: 1,
    borderColor: 'rgba(244, 247, 251, 0.22)',
  },
  actionLabel: {
    color: 'rgba(244, 247, 251, 0.6)',
    fontSize: 11,
    fontWeight: '600',
  },
  skipGlyph: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  skipTriangle: {
    width: 0,
    height: 0,
    borderTopWidth: 7,
    borderBottomWidth: 7,
    borderLeftWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: videoText,
  },
  skipBar: {
    width: 2.5,
    height: 14,
    borderRadius: 2,
    backgroundColor: videoText,
    marginLeft: 1,
  },
  speedGlyphText: {
    color: videoText,
    fontSize: 16,
    fontWeight: '800',
  },
  longBottom: {
    position: 'absolute',
    left: 0,
    right: 76,
    bottom: 0,
    gap: 6,
    paddingHorizontal: spacing.lg,
  },
  progressTrack: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    height: 3,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: 'rgba(244, 247, 251, 0.18)',
  },
  top: {
    paddingTop: 62,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mode: {
    color: videoTextMuted,
    fontSize: 13,
    letterSpacing: 1.6,
  },
  remaining: {
    color: videoText,
    fontSize: 30,
    fontWeight: '800',
  },
  bottom: {
    marginTop: 'auto',
    gap: spacing.sm,
    padding: spacing.lg,
    paddingBottom: 42,
  },
  title: {
    color: videoText,
    fontSize: 20,
    fontWeight: '800',
  },
  note: {
    color: videoTextMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  exitButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    borderRadius: 999,
    backgroundColor: colors.dangerSoft,
  },
  exitText: {
    color: colors.danger,
    fontWeight: '700',
  },
});
