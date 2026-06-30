
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { Alert, Animated, AppState, AppStateStatus, Pressable, StyleSheet, Text, View } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LONG_EXIT_CONFIRM, LONG_VIDEO_DEFAULT_NOTE } from '../constants/copy';
import { colors, spacing } from '../constants/theme';
import { OrientationService } from '../services/OrientationService';
import { FailureReason } from '../types/result';
import { VideoAsset, WatchMode } from '../types/video';
import { formatSeconds } from '../utils/date';

const videoText = '#F4F7FB';
const videoTextMuted = '#DDE8D8';

type Props = {
  video: VideoAsset;
  mode: WatchMode;
  targetSeconds: number;
  onComplete: (watchedSeconds: number) => void;
  onFail: (reason: FailureReason, watchedSeconds: number) => void;
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

type LongPlayerProps = {
  video: VideoAsset;
  remainingSeconds: number;
  watchedSeconds: number;
  onFail: (reason: FailureReason, watchedSeconds: number) => void;
  handledRef: MutableRefObject<boolean>;
};

function LongVideoPlayer({ video, remainingSeconds, watchedSeconds, onFail, handledRef }: LongPlayerProps) {
  const [overlayVisible, setOverlayVisible] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    void OrientationService.lockLandscape();
    return () => {
      void OrientationService.lockPortrait();
    };
  }, []);

  const confirmExit = () => {
    Alert.alert(LONG_EXIT_CONFIRM.title, LONG_EXIT_CONFIRM.message, [
      { text: LONG_EXIT_CONFIRM.continue, style: 'cancel' },
      {
        text: LONG_EXIT_CONFIRM.quit,
        style: 'destructive',
        onPress: () => {
          if (!handledRef.current) {
            handledRef.current = true;
            onFail('manual_exit', watchedSeconds);
          }
        },
      },
    ]);
  };

  const timerBadge = (
    <View style={[styles.longStatus, { top: Math.max(insets.top, spacing.md) }]} pointerEvents="none">
      <Text style={styles.longStatusText}>脱ドパ中...</Text>
      <Text style={styles.longTimer}>{formatSeconds(remainingSeconds)}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <VideoLayer video={video} />

      {!overlayVisible ? (
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setOverlayVisible(true)}>
          {timerBadge}
        </Pressable>
      ) : (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOverlayVisible(false)}>
            <View style={styles.scrim} />
          </Pressable>
          {timerBadge}
          <View style={[styles.longOverlay, { paddingBottom: Math.max(insets.bottom, spacing.lg), paddingHorizontal: Math.max(insets.left, insets.right, spacing.lg) }]}>
            <Text style={styles.title}>{video.title}</Text>
            <Text style={styles.note}>{video.description || LONG_VIDEO_DEFAULT_NOTE}</Text>
            <Pressable onPress={confirmExit} style={styles.exitButton}>
              <Text style={styles.exitText}>視聴をやめる</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

export function VideoPlayerShell({ video, mode, targetSeconds, onComplete, onFail }: Props) {
  const [remainingSeconds, setRemainingSeconds] = useState(targetSeconds);
  const handledRef = useRef(false);
  const startedAtRef = useRef(Date.now());

  const watchedSeconds = useMemo(() => Math.max(0, targetSeconds - remainingSeconds), [remainingSeconds, targetSeconds]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          if (!handledRef.current) {
            handledRef.current = true;
            onComplete(Math.max(targetSeconds, Math.round((Date.now() - startedAtRef.current) / 1000)));
          }
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [onComplete, targetSeconds]);

  useEffect(() => {
    if (mode !== 'raid') {
      return undefined;
    }

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if ((nextState === 'background' || nextState === 'inactive') && !handledRef.current) {
        handledRef.current = true;
        onFail('backgrounded', Math.round((Date.now() - startedAtRef.current) / 1000));
      }
    });
    return () => subscription.remove();
  }, [mode, onFail]);

  if (mode === 'normal') {
    return (
      <LongVideoPlayer
        video={video}
        remainingSeconds={remainingSeconds}
        watchedSeconds={watchedSeconds}
        onFail={onFail}
        handledRef={handledRef}
      />
    );
  }

  const failLabel = '緊急離脱';

  return (
    <View style={styles.container}>
      <VideoLayer video={video} />
      <View style={styles.scrim} />
      <View style={styles.top}>
        <Text style={styles.mode}>脱ドパレイド</Text>
        <Text style={styles.remaining}>{formatSeconds(remainingSeconds)}</Text>
      </View>
      <View style={styles.bottom}>
        <Text style={styles.title}>{video.title}</Text>
        <Text style={styles.note}>刺激がないことに、耐えられるか。</Text>
        <Pressable
          onPress={() => {
            if (!handledRef.current) {
              handledRef.current = true;
              onFail('emergency_exit', watchedSeconds);
            }
          }}
          style={styles.exitButton}
        >
          <Text style={styles.exitText}>{failLabel}</Text>
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
  longStatus: {
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    borderWidth: 1,
    borderColor: 'rgba(244, 247, 251, 0.18)',
  },
  longStatusText: {
    color: videoText,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  longTimer: {
    color: videoText,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
    fontVariant: ['tabular-nums'],
  },
  longOverlay: {
    marginTop: 'auto',
    gap: spacing.sm,
    paddingTop: spacing.lg,
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
    fontSize: 24,
    fontWeight: '800',
  },
  note: {
    color: videoTextMuted,
    lineHeight: 22,
  },
  exitButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
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
