
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, AppState, AppStateStatus, Pressable, StyleSheet, Text, View } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { colors, spacing } from '../constants/theme';
import { FailureReason } from '../types/result';
import { VideoAsset, WatchMode } from '../types/video';
import { formatSeconds } from '../utils/date';

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

  const failLabel = mode === 'raid' ? '緊急離脱' : '視聴をやめる';

  return (
    <View style={styles.container}>
      {video.sourceType === 'remote' ? <RemoteVideoLayer uri={video.uri} /> : <GeneratedPlaceholder mood={video.mood} />}
      <View style={styles.scrim} />
      <View style={styles.top}>
        <Text style={styles.mode}>{mode === 'raid' ? '脱ドパレイド' : '脱ドパロング'}</Text>
        <Text style={styles.remaining}>{formatSeconds(remainingSeconds)}</Text>
      </View>
      <View style={styles.bottom}>
        <Text style={styles.title}>{video.title}</Text>
        <Text style={styles.note}>刺激がないことに、耐えられるか。</Text>
        <Pressable
          onPress={() => {
            if (!handledRef.current) {
              handledRef.current = true;
              onFail(mode === 'raid' ? 'emergency_exit' : 'manual_exit', watchedSeconds);
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
    backgroundColor: 'rgba(123, 167, 215, 0.26)',
    transform: [{ scaleX: 1.8 }],
  },
  horizon: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '54%',
    height: 1,
    backgroundColor: 'rgba(244, 247, 251, 0.2)',
  },
  horizonSoft: {
    position: 'absolute',
    left: 28,
    right: 28,
    top: '62%',
    height: 2,
    backgroundColor: 'rgba(123, 167, 215, 0.1)',
  },
  generatedText: {
    color: 'rgba(244, 247, 251, 0.16)',
    letterSpacing: 8,
    textTransform: 'uppercase',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.36)',
  },
  top: {
    paddingTop: 62,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mode: {
    color: colors.textMuted,
    fontSize: 13,
    letterSpacing: 1.6,
  },
  remaining: {
    color: colors.text,
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
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  note: {
    color: colors.textMuted,
  },
  exitButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(200, 123, 123, 0.32)',
    borderRadius: 999,
    backgroundColor: 'rgba(200, 123, 123, 0.1)',
  },
  exitText: {
    color: colors.danger,
    fontWeight: '700',
  },
});
