
import { useEffect } from 'react';
import { Platform, StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';
import { useSegments } from 'expo-router';
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { FRAME_BORDER_WIDTH, RAINBOW_SEGMENTS, SCREEN_CORNER_RADIUS } from '../constants/frame';
import { colors } from '../constants/theme';
import { useScreenFrame } from '../contexts/ScreenFrameContext';

type Props = ViewProps & {
  children: React.ReactNode;
};

const roundedCurve: ViewStyle = Platform.OS === 'ios' ? { borderCurve: 'continuous' } : {};

function innerCornerRadius(borderWidth: number): number {
  return Math.max(0, SCREEN_CORNER_RADIUS - borderWidth);
}

function RainbowRing() {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 2400, easing: Easing.linear }),
      -1,
      false,
    );
  }, [rotation]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={styles.rainbowShell} pointerEvents="none">
      <Animated.View style={[styles.rainbowSpinner, spinStyle]}>
        <View style={styles.rainbowRow}>
          <View style={[styles.rainbowCell, { backgroundColor: RAINBOW_SEGMENTS[0] }]} />
          <View style={[styles.rainbowCell, { backgroundColor: RAINBOW_SEGMENTS[1] }]} />
          <View style={[styles.rainbowCell, { backgroundColor: RAINBOW_SEGMENTS[2] }]} />
          <View style={[styles.rainbowCell, { backgroundColor: RAINBOW_SEGMENTS[3] }]} />
        </View>
        <View style={styles.rainbowRow}>
          <View style={[styles.rainbowCell, { backgroundColor: RAINBOW_SEGMENTS[4] }]} />
          <View style={[styles.rainbowCell, { backgroundColor: RAINBOW_SEGMENTS[5] }]} />
          <View style={[styles.rainbowCell, { backgroundColor: RAINBOW_SEGMENTS[6] }]} />
          <View style={[styles.rainbowCell, { backgroundColor: RAINBOW_SEGMENTS[0] }]} />
        </View>
      </Animated.View>
    </View>
  );
}

const SUCCESS_COLORS = [...RAINBOW_SEGMENTS];

function SuccessBanner({ time }: { time: string }) {
  const pulse = useSharedValue(0);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 520, easing: Easing.in(Easing.cubic) }),
      ),
      -1,
      false,
    );
    shimmer.value = withRepeat(withTiming(SUCCESS_COLORS.length - 1, { duration: 1800, easing: Easing.linear }), -1, false);
  }, [pulse, shimmer]);

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.08]) }],
    borderColor: interpolateColor(
      shimmer.value,
      SUCCESS_COLORS.map((_, index) => index),
      SUCCESS_COLORS,
    ),
  }));

  const titleStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      shimmer.value,
      SUCCESS_COLORS.map((_, index) => index),
      SUCCESS_COLORS,
    ),
  }));

  const timeStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      shimmer.value,
      SUCCESS_COLORS.map((_, index) => index),
      SUCCESS_COLORS,
    ),
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.45, 0.95]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.96, 1.14]) }],
  }));

  return (
    <View style={styles.successOverlay} pointerEvents="none">
      <Animated.View style={[styles.successGlow, glowStyle]} />
      <Animated.View style={[styles.successBadge, badgeStyle]}>
        <Animated.Text style={[styles.successTime, timeStyle]}>{time}</Animated.Text>
        <Animated.Text style={[styles.successText, titleStyle]}>脱ドパ成功</Animated.Text>
      </Animated.View>
    </View>
  );
}

function RoundedBorder({ color, width }: { color: string; width: number }) {
  return (
    <View
      pointerEvents="none"
      style={[
        styles.roundedBorder,
        roundedCurve,
        {
          borderRadius: SCREEN_CORNER_RADIUS,
          borderWidth: width,
          borderColor: color,
        },
      ]}
    />
  );
}

export function ScreenFrame({ children, style, ...rest }: Props) {
  const segments = useSegments();
  const { frameColor, celebrating, celebrationTime } = useScreenFrame();
  const isFullscreenVideo = segments.includes('active');

  if (isFullscreenVideo) {
    return (
      <View style={[styles.plainRoot, style]} {...rest}>
        {children}
      </View>
    );
  }

  const borderWidth = celebrating ? FRAME_BORDER_WIDTH + 1 : FRAME_BORDER_WIDTH;
  const innerRadius = innerCornerRadius(borderWidth);

  return (
    <View style={[styles.root, style]} {...rest}>
      <View style={[styles.frameShell, roundedCurve, { borderRadius: SCREEN_CORNER_RADIUS }]}>
        {celebrating ? <RainbowRing /> : null}
        <View style={[styles.content, { padding: borderWidth }]}>
          <View style={[styles.inner, roundedCurve, { borderRadius: innerRadius }]}>{children}</View>
        </View>
        {celebrating ? (
          <>
            <View
              pointerEvents="none"
              style={[
                styles.innerMask,
                roundedCurve,
                {
                  top: borderWidth,
                  right: borderWidth,
                  bottom: borderWidth,
                  left: borderWidth,
                  borderRadius: innerRadius,
                },
              ]}
            />
            <SuccessBanner time={celebrationTime ?? '--:--'} />
          </>
        ) : (
          <RoundedBorder color={frameColor} width={borderWidth} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  plainRoot: {
    flex: 1,
    backgroundColor: colors.black,
  },
  frameShell: {
    flex: 1,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
  inner: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  innerMask: {
    position: 'absolute',
    backgroundColor: colors.background,
  },
  roundedBorder: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'transparent',
  },
  rainbowShell: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rainbowSpinner: {
    width: '220%',
    height: '220%',
  },
  rainbowRow: {
    flex: 1,
    flexDirection: 'row',
  },
  rainbowCell: {
    flex: 1,
  },
  successOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  successGlow: {
    position: 'absolute',
    width: 300,
    height: 160,
    borderRadius: 999,
    backgroundColor: '#FFD166',
  },
  successBadge: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 32,
    paddingVertical: 22,
    borderRadius: 28,
    borderWidth: 3,
    backgroundColor: 'rgba(8, 10, 14, 0.78)',
    shadowColor: '#FF6B6B',
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  successTime: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
  },
  successText: {
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: 'rgba(255, 255, 255, 0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});
