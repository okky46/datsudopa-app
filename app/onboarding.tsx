
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeIn,
  FadeInUp,
  FadeOut,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { PrimaryButton } from '../src/components/PrimaryButton';
import { AuroraDot, CheckBadge } from '../src/components/ui/Decorations';
import { onboardingCopy } from '../src/constants/copy';
import { DEFAULT_SHORTS_USAGE_ID, SHORTS_USAGE_OPTIONS, type ShortsUsageOption } from '../src/constants/onboarding';
import { colors, radius, shadows, spacing, typography } from '../src/constants/theme';
import { NotificationService } from '../src/services/NotificationService';
import { StorageService } from '../src/services/StorageService';

const STEP_COUNT = 8;
const ENTER = FadeInUp.duration(420).easing(Easing.out(Easing.cubic));
const EXIT = FadeOut.duration(160);

// 数字を直感に刺さる形で見せるためのカウントアップ（ease-out）
function useCountUp(target: number, durationMs = 1300): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frame: number;
    const startedAt = Date.now();
    const tick = () => {
      const t = Math.min(1, (Date.now() - startedAt) / durationMs);
      const eased = 1 - (1 - t) ** 3;
      setValue(Math.round(target * eased));
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return value;
}

function BackGlyph() {
  return (
    <View style={styles.backGlyph}>
      <View style={[styles.backLine, styles.backLineUp]} />
      <View style={[styles.backLine, styles.backLineDown]} />
    </View>
  );
}

function PlayTriangle() {
  return <View style={styles.playTriangle} />;
}

// レイド紹介: 散らばっていた淡い点が、ゆっくり中央に集まってくる。
// 「一人じゃない」を文章ではなくUIで伝えるための、静かな演出。
const GATHER_DOTS = [
  { fromX: -124, fromY: -58, toX: -28, toY: -8, size: 12, color: colors.pastelMint },
  { fromX: 112, fromY: -70, toX: 24, toY: -20, size: 10, color: colors.pastelLavender },
  { fromX: -92, fromY: 60, toX: -12, toY: 24, size: 9, color: colors.pastelPink },
  { fromX: 132, fromY: 46, toX: 32, toY: 12, size: 11, color: colors.pastelBlue },
  { fromX: -140, fromY: 4, toX: -36, toY: 12, size: 8, color: colors.pastelYellow },
  { fromX: 64, fromY: 82, toX: 8, toY: 32, size: 9, color: colors.pastelMint },
  { fromX: -44, fromY: -86, toX: -4, toY: -28, size: 10, color: colors.pastelBlue },
  { fromX: 26, fromY: -36, toX: 14, toY: 0, size: 7, color: colors.pastelPink },
] as const;

function GatherDot({ dot, index }: { dot: (typeof GATHER_DOTS)[number]; index: number }) {
  const gather = useSharedValue(0);
  const breath = useSharedValue(0);

  useEffect(() => {
    gather.value = withDelay(
      240 + index * 200,
      withTiming(1, { duration: 1500, easing: Easing.out(Easing.cubic) }),
    );
    breath.value = withDelay(
      index * 180,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
  }, [breath, gather, index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + gather.value * 0.45 + breath.value * 0.22,
    transform: [
      { translateX: interpolate(gather.value, [0, 1], [dot.fromX, dot.toX]) },
      { translateY: interpolate(gather.value, [0, 1], [dot.fromY, dot.toY]) },
      { scale: 0.6 + gather.value * 0.4 + breath.value * 0.08 },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.gatherDot,
        {
          width: dot.size,
          height: dot.size,
          borderRadius: dot.size,
          marginLeft: -dot.size / 2,
          marginTop: -dot.size / 2,
          backgroundColor: dot.color,
        },
        animatedStyle,
      ]}
    />
  );
}

function GatheringDots() {
  return (
    <View style={styles.gatherField} pointerEvents="none">
      {GATHER_DOTS.map((dot, index) => (
        <GatherDot key={index} dot={dot} index={index} />
      ))}
    </View>
  );
}

function OnboardingProgress({ progress }: { progress: SharedValue<number> }) {
  const [trackWidth, setTrackWidth] = useState(0);

  const fillStyle = useAnimatedStyle(() => ({
    width: trackWidth * progress.value,
  }));

  return (
    <View style={styles.progressTrack} onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}>
      <Animated.View style={[styles.progressFill, fillStyle]} />
    </View>
  );
}

const PRINCIPLE_DOTS = [colors.pastelMint, colors.pastelBlue, colors.pastelLavender, colors.pastelPink] as const;

export default function OnboardingScreen() {
  const [stepIndex, setStepIndex] = useState(0);
  const [usage, setUsage] = useState<ShortsUsageOption | null>(null);
  const [completing, setCompleting] = useState(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progress = useSharedValue(1 / STEP_COUNT);

  const goTo = useCallback(
    (next: number) => {
      if (advanceTimer.current) {
        clearTimeout(advanceTimer.current);
        advanceTimer.current = null;
      }
      const clamped = Math.max(0, Math.min(STEP_COUNT - 1, next));
      setStepIndex(clamped);
      progress.value = withTiming((clamped + 1) / STEP_COUNT, {
        duration: 420,
        easing: Easing.out(Easing.cubic),
      });
    },
    [progress],
  );

  useEffect(
    () => () => {
      if (advanceTimer.current) {
        clearTimeout(advanceTimer.current);
      }
    },
    [],
  );

  const selectUsage = (option: ShortsUsageOption) => {
    setUsage(option);
    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current);
    }
    advanceTimer.current = setTimeout(() => goTo(3), 420);
  };

  const complete = async () => {
    if (completing) {
      return;
    }
    setCompleting(true);
    try {
      const granted = await NotificationService.requestPermission();
      const settings = {
        ...StorageService.getDefaultSettings(),
        onboardingCompleted: true,
        notificationEnabled: granted,
      };
      await StorageService.saveSettings(settings);
      await NotificationService.scheduleDailyRaid(settings);
      router.replace('/(tabs)/long');
    } finally {
      setCompleting(false);
    }
  };

  const lossOption =
    usage ?? SHORTS_USAGE_OPTIONS.find((option) => option.id === DEFAULT_SHORTS_USAGE_ID) ?? SHORTS_USAGE_OPTIONS[0];

  const renderStep = () => {
    switch (stepIndex) {
      case 0:
        return (
          <Animated.View key="start" entering={ENTER} exiting={EXIT} style={styles.stepFill}>
            <View style={styles.stepCenter}>
              <View style={styles.brandRow}>
                <Text style={styles.brand}>脱ドパ</Text>
                <AuroraDot size={20} />
              </View>
              <Text style={styles.displayTitle}>{onboardingCopy.start.title}</Text>
              <Text style={styles.subtitle}>{onboardingCopy.start.subtitle}</Text>
            </View>
            <View style={styles.ctaSlot}>
              <PrimaryButton label={onboardingCopy.start.cta} onPress={() => goTo(1)} />
            </View>
          </Animated.View>
        );
      case 1:
        return (
          <Animated.View key="problem" entering={ENTER} exiting={EXIT} style={styles.stepFill}>
            <View style={styles.stepCenter}>
              <Text style={styles.title}>{onboardingCopy.problem.title}</Text>
              <Animated.Text entering={FadeIn.delay(500).duration(600)} style={styles.subtitle}>
                {onboardingCopy.problem.subtitle}
              </Animated.Text>
            </View>
            <View style={styles.ctaSlot}>
              <PrimaryButton label={onboardingCopy.problem.cta} onPress={() => goTo(2)} />
            </View>
          </Animated.View>
        );
      case 2:
        return (
          <Animated.View key="usage" entering={ENTER} exiting={EXIT} style={styles.stepFill}>
            <View style={styles.stepCenter}>
              <Text style={styles.title}>{onboardingCopy.usage.title}</Text>
              <View style={styles.options}>
                {SHORTS_USAGE_OPTIONS.map((option, index) => {
                  const selected = usage?.id === option.id;
                  return (
                    <Animated.View key={option.id} entering={FadeInUp.delay(160 + index * 70).duration(380)}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        onPress={() => selectUsage(option)}
                        style={({ pressed }) => [
                          styles.option,
                          selected && styles.optionSelected,
                          pressed && styles.optionPressed,
                        ]}
                      >
                        <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>{option.label}</Text>
                      </Pressable>
                    </Animated.View>
                  );
                })}
              </View>
            </View>
            <View style={styles.ctaSlot} />
          </Animated.View>
        );
      case 3:
        return (
          <Animated.View key="loss" entering={ENTER} exiting={EXIT} style={styles.stepFill}>
            <View style={styles.stepCenter}>
              <Text style={styles.lossPrefix}>{onboardingCopy.loss.monthlyPrefix}</Text>
              <View style={styles.lossNumberRow}>
                <LossHours target={lossOption.monthlyHours} />
                <Text style={styles.lossUnit}>{lossOption.monthlyUnit}</Text>
              </View>
              <Text style={styles.lossBody}>{onboardingCopy.loss.monthlyBody}</Text>
              <Animated.Text entering={FadeInUp.delay(1200).duration(500)} style={styles.lossLifetime}>
                {onboardingCopy.loss.lifetimeBefore}
                <Text style={styles.lossLifetimeStrong}>{lossOption.lifetimeLabel}</Text>
                {onboardingCopy.loss.lifetimeAfter}
              </Animated.Text>
              <Animated.Text entering={FadeInUp.delay(2000).duration(500)} style={styles.lossRecover}>
                {onboardingCopy.loss.recover}
              </Animated.Text>
            </View>
            <Animated.View entering={FadeIn.delay(2300).duration(400)} style={styles.ctaSlot}>
              <PrimaryButton label={onboardingCopy.loss.cta} onPress={() => goTo(4)} />
            </Animated.View>
          </Animated.View>
        );
      case 4:
        return (
          <Animated.View key="motto" entering={ENTER} exiting={EXIT} style={styles.stepFill}>
            <View style={styles.stepCenter}>
              <Text style={styles.title}>{onboardingCopy.motto.title}</Text>
              <Text style={styles.subtitle}>{onboardingCopy.motto.subtitle}</Text>
              <View style={styles.principles}>
                {onboardingCopy.motto.principles.map((principle, index) => (
                  <Animated.View
                    key={principle}
                    entering={FadeInUp.delay(360 + index * 110).duration(400)}
                    style={styles.principleCard}
                  >
                    <View style={[styles.principleDot, { backgroundColor: PRINCIPLE_DOTS[index % PRINCIPLE_DOTS.length] }]} />
                    <Text style={styles.principleLabel}>{principle}</Text>
                  </Animated.View>
                ))}
              </View>
            </View>
            <View style={styles.ctaSlot}>
              <PrimaryButton label={onboardingCopy.motto.cta} onPress={() => goTo(5)} />
            </View>
          </Animated.View>
        );
      case 5:
        return (
          <Animated.View key="firstLong" entering={ENTER} exiting={EXIT} style={styles.stepFill}>
            <View style={styles.stepCenter}>
              <View style={styles.playBadge}>
                <PlayTriangle />
              </View>
              <Text style={styles.title}>{onboardingCopy.firstLong.title}</Text>
              <Text style={styles.subtitle}>{onboardingCopy.firstLong.subtitle}</Text>
            </View>
            <View style={styles.ctaSlot}>
              <PrimaryButton label={onboardingCopy.firstLong.cta} onPress={() => goTo(6)} />
            </View>
          </Animated.View>
        );
      case 6:
        return (
          <Animated.View key="raid" entering={ENTER} exiting={EXIT} style={styles.stepFill}>
            <View style={styles.stepCenter}>
              <GatheringDots />
              <Text style={styles.raidTitle}>{onboardingCopy.raid.title}</Text>
              <Text style={styles.subtitle}>{onboardingCopy.raid.subtitle}</Text>
            </View>
            <View style={styles.ctaSlot}>
              <PrimaryButton label={onboardingCopy.raid.cta} onPress={() => goTo(7)} />
            </View>
          </Animated.View>
        );
      default:
        return (
          <Animated.View key="done" entering={ENTER} exiting={EXIT} style={styles.stepFill}>
            <View style={styles.stepCenter}>
              <CheckBadge size={64} />
              <Text style={styles.displayTitle}>{onboardingCopy.done.title}</Text>
              <Text style={styles.subtitle}>{onboardingCopy.done.subtitle}</Text>
            </View>
            <View style={styles.ctaSlot}>
              <PrimaryButton
                label={onboardingCopy.done.cta}
                variant="gradient"
                icon={<PlayTriangle />}
                disabled={completing}
                onPress={complete}
              />
            </View>
          </Animated.View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        {stepIndex > 0 && !completing ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={onboardingCopy.back}
            hitSlop={12}
            onPress={() => goTo(stepIndex - 1)}
            style={({ pressed }) => [styles.backButton, pressed && styles.backPressed]}
          >
            <BackGlyph />
            <Text style={styles.backLabel}>{onboardingCopy.back}</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.stepArea}>{renderStep()}</View>

      <View style={styles.footer}>
        <OnboardingProgress progress={progress} />
      </View>
    </SafeAreaView>
  );
}

function LossHours({ target }: { target: number }) {
  const hours = useCountUp(target);
  return <Text style={styles.lossNumber}>{hours}</Text>;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    height: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  backPressed: {
    opacity: 0.6,
  },
  backGlyph: {
    width: 9,
    height: 14,
    justifyContent: 'center',
  },
  backLine: {
    position: 'absolute',
    left: 0,
    width: 9,
    height: 1.6,
    borderRadius: 2,
    backgroundColor: colors.textSubtle,
  },
  backLineUp: {
    top: 3,
    transform: [{ rotate: '-38deg' }],
  },
  backLineDown: {
    bottom: 3,
    transform: [{ rotate: '38deg' }],
  },
  backLabel: {
    color: colors.textSubtle,
    ...typography.caption,
    fontWeight: '600',
  },
  stepArea: {
    flex: 1,
  },
  stepFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  stepCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  ctaSlot: {
    minHeight: 56,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  brand: {
    color: colors.textSubtle,
    ...typography.brandMark,
  },
  displayTitle: {
    color: colors.text,
    ...typography.display,
    lineHeight: 42,
    textAlign: 'center',
  },
  title: {
    color: colors.text,
    ...typography.h1,
    lineHeight: 38,
    textAlign: 'center',
  },
  raidTitle: {
    color: colors.text,
    ...typography.h2,
    lineHeight: 32,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textMuted,
    ...typography.body,
    textAlign: 'center',
  },
  options: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  option: {
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.card,
    ...shadows.soft,
  },
  optionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  optionPressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  optionLabel: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
  optionLabelSelected: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
  lossPrefix: {
    color: colors.textMuted,
    ...typography.body,
  },
  lossNumberRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  lossNumber: {
    color: colors.text,
    ...typography.score,
  },
  lossUnit: {
    color: colors.text,
    ...typography.h2,
    marginBottom: spacing.md,
  },
  lossBody: {
    color: colors.textMuted,
    ...typography.body,
    textAlign: 'center',
    marginTop: -spacing.sm,
  },
  lossLifetime: {
    color: colors.textMuted,
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  lossLifetimeStrong: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  lossRecover: {
    color: colors.accent,
    ...typography.body,
    fontWeight: '700',
    textAlign: 'center',
  },
  principles: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  principleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    ...shadows.soft,
  },
  principleDot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
  },
  principleLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  playBadge: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    marginBottom: spacing.xs,
    ...shadows.soft,
  },
  playTriangle: {
    width: 0,
    height: 0,
    borderTopWidth: 7,
    borderBottomWidth: 7,
    borderLeftWidth: 12,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: colors.text,
    marginLeft: 2,
  },
  gatherField: {
    alignSelf: 'stretch',
    height: 150,
    marginBottom: spacing.sm,
  },
  gatherDot: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  progressTrack: {
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSunken,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
});
