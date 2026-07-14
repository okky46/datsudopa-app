
// オンボーディング（5画面）:
// 1. 問題提起 → 2. ショート利用時間 → 3. 月間・年間の損失可視化 →
// 4. 22時レイド説明＋公開ユーザーネーム設定 → 5. 初回3分ロング開始。
// 完了時にドパガキ度を自己申告から初期化し、通知許可を取得して初回ロングへ直行する。

import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeIn,
  FadeInUp,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { PrimaryButton } from '../src/components/PrimaryButton';
import { Chip } from '../src/components/ui/Chip';
import { onboardingCopy } from '../src/constants/copy';
import {
  SHORTS_USAGE_OPTIONS,
  findUsageOption,
  monthlyLossHours,
  yearlyLossHours,
  type ShortsUsageOption,
} from '../src/constants/onboarding';
import { colors, radius, shadows, spacing, typography } from '../src/constants/theme';
import { AnalyticsService } from '../src/services/AnalyticsService';
import { NotificationService } from '../src/services/NotificationService';
import { ProfileService } from '../src/services/ProfileService';
import { ProgressService } from '../src/services/ProgressService';
import { StorageService } from '../src/services/StorageService';
import { generateNameCandidates, validatePublicName } from '../src/utils/username';

const STEP_COUNT = 5;
const ENTER = FadeInUp.duration(420).easing(Easing.out(Easing.cubic));
const EXIT = FadeOut.duration(160);

// 数字を直感に刺さる形で見せるためのカウントアップ（ease-out）
function useCountUp(target: number, durationMs = 1200): number {
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

function CountUpHours({ target }: { target: number }) {
  const hours = useCountUp(target);
  return <Text style={styles.lossNumber}>{hours}</Text>;
}

export default function OnboardingScreen() {
  const [stepIndex, setStepIndex] = useState(0);
  const [usage, setUsage] = useState<ShortsUsageOption | null>(null);
  const [candidates, setCandidates] = useState<string[]>(() => generateNameCandidates(3));
  // 自動生成候補の1つ目を最初から入れておく（そのまま使用 / 再生成 / 自由入力のどれでも進める）
  const [draftName, setDraftName] = useState<string>(() => candidates[0] ?? '');
  const [nameError, setNameError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progress = useSharedValue(1 / STEP_COUNT);

  useEffect(() => {
    void AnalyticsService.track('onboarding_started');
  }, []);

  useEffect(
    () => () => {
      if (advanceTimer.current) {
        clearTimeout(advanceTimer.current);
      }
    },
    [],
  );

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

  const selectUsage = (option: ShortsUsageOption) => {
    setUsage(option);
    if (advanceTimer.current) {
      clearTimeout(advanceTimer.current);
    }
    advanceTimer.current = setTimeout(() => goTo(2), 420);
  };

  const confirmName = () => {
    const validation = validatePublicName(draftName);
    if (!validation.ok) {
      setNameError(validation.reason);
      return;
    }
    setNameError(null);
    setDraftName(validation.normalized);
    goTo(4);
  };

  const complete = async () => {
    if (completing) {
      return;
    }
    setCompleting(true);
    try {
      const validation = validatePublicName(draftName);
      const publicName = validation.ok ? validation.normalized : generateNameCandidates(1)[0];
      const usageOption = findUsageOption(usage?.id);

      // requested/granted/denied の記録は NotificationService.requestPermission 内で行う
      const granted = await NotificationService.requestPermission();

      const settings = {
        onboardingCompleted: true,
        publicName,
        notificationEnabled: granted,
        shortsUsageId: usageOption.id,
      };
      await StorageService.saveSettings(settings);
      // 初期ドパガキ度・初回利用日・未参加判定開始日（22:03以降の初回登録は翌日から）をまとめて設定
      await ProgressService.initializeOnComplete(usageOption.id);
      await NotificationService.scheduleDailyRaid(settings);
      void ProfileService.syncPublicName(publicName);
      void AnalyticsService.track('onboarding_completed');

      router.replace({ pathname: '/raid/active', params: { mode: 'first' } });
    } finally {
      setCompleting(false);
    }
  };

  const lossOption = findUsageOption(usage?.id);

  const renderStep = () => {
    switch (stepIndex) {
      case 0:
        return (
          <Animated.View key="problem" entering={ENTER} exiting={EXIT} style={styles.stepFill}>
            <View style={styles.stepCenter}>
              <Text style={styles.title}>{onboardingCopy.problem.title}</Text>
              <Animated.Text entering={FadeIn.delay(500).duration(600)} style={styles.subtitle}>
                {onboardingCopy.problem.body}
              </Animated.Text>
            </View>
            <View style={styles.ctaSlot}>
              <PrimaryButton label={onboardingCopy.problem.cta} onPress={() => goTo(1)} />
            </View>
          </Animated.View>
        );
      case 1:
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
      case 2:
        return (
          <Animated.View key="loss" entering={ENTER} exiting={EXIT} style={styles.stepFill}>
            <View style={styles.stepCenter}>
              <Text style={styles.lossPrefix}>{onboardingCopy.loss.monthlyPrefix}</Text>
              <View style={styles.lossNumberRow}>
                <CountUpHours target={monthlyLossHours(lossOption)} />
                <Text style={styles.lossUnit}>{onboardingCopy.loss.hoursUnit}</Text>
              </View>
              <Animated.Text entering={FadeInUp.delay(900).duration(500)} style={styles.lossYearly}>
                {onboardingCopy.loss.yearlyPrefix}
                <Text style={styles.lossYearlyStrong}>
                  {yearlyLossHours(lossOption)}
                  {onboardingCopy.loss.hoursUnit}
                </Text>
                。
              </Animated.Text>
              <Animated.Text entering={FadeInUp.delay(1400).duration(500)} style={styles.lossBody}>
                {onboardingCopy.loss.body}
              </Animated.Text>
              <Animated.Text entering={FadeInUp.delay(1900).duration(500)} style={styles.lossRecover}>
                {onboardingCopy.loss.recover}
              </Animated.Text>
              <Animated.Text entering={FadeIn.delay(2100).duration(400)} style={styles.lossDisclaimer}>
                {onboardingCopy.loss.disclaimer}
              </Animated.Text>
            </View>
            <Animated.View entering={FadeIn.delay(2200).duration(400)} style={styles.ctaSlot}>
              <PrimaryButton label={onboardingCopy.loss.cta} onPress={() => goTo(3)} />
            </Animated.View>
          </Animated.View>
        );
      case 3:
        return (
          <Animated.View key="raid" entering={ENTER} exiting={EXIT} style={styles.stepFill}>
            <View style={styles.stepCenter}>
              <Text style={styles.raidTitle}>{onboardingCopy.raid.title}</Text>
              <Text style={styles.subtitle}>{onboardingCopy.raid.body}</Text>

              <View style={styles.nameBlock}>
                <Text style={styles.nameLabel}>{onboardingCopy.raid.nameLabel}</Text>
                <TextInput
                  value={draftName}
                  onChangeText={(value) => {
                    setDraftName(value);
                    setNameError(null);
                  }}
                  placeholder={candidates[0] ?? '夜更かしペンギン'}
                  placeholderTextColor={colors.textSubtle}
                  maxLength={24}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.nameInput}
                />
                {nameError && <Text style={styles.nameError}>{nameError}</Text>}
                <View style={styles.candidateRow}>
                  {candidates.map((candidate) => (
                    <Chip
                      key={candidate}
                      label={candidate}
                      compact
                      selected={draftName === candidate}
                      onPress={() => {
                        setDraftName(candidate);
                        setNameError(null);
                      }}
                    />
                  ))}
                  <Chip label={onboardingCopy.raid.regenerate} compact onPress={() => setCandidates(generateNameCandidates(3))} />
                </View>
                <Text style={styles.nameHint}>{onboardingCopy.raid.nameHint}</Text>
              </View>
            </View>
            <View style={styles.ctaSlot}>
              <PrimaryButton label={onboardingCopy.raid.cta} onPress={confirmName} />
            </View>
          </Animated.View>
        );
      default:
        return (
          <Animated.View key="firstLong" entering={ENTER} exiting={EXIT} style={styles.stepFill}>
            <View style={styles.stepCenter}>
              <View style={styles.playBadge}>
                <PlayTriangle />
              </View>
              <Text style={styles.title}>{onboardingCopy.firstLong.title}</Text>
              <Text style={styles.subtitle}>{onboardingCopy.firstLong.body}</Text>
            </View>
            <View style={styles.ctaSlot}>
              <PrimaryButton
                label={onboardingCopy.firstLong.cta}
                variant="gradient"
                icon={<PlayTriangle />}
                disabled={completing}
                onPress={() => void complete()}
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
  lossYearly: {
    color: colors.textMuted,
    ...typography.body,
    textAlign: 'center',
    marginTop: -spacing.sm,
  },
  lossYearlyStrong: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  lossBody: {
    color: colors.textMuted,
    ...typography.body,
    textAlign: 'center',
  },
  lossRecover: {
    color: colors.accent,
    ...typography.body,
    fontWeight: '700',
    textAlign: 'center',
  },
  lossDisclaimer: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  nameBlock: {
    alignSelf: 'stretch',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  nameLabel: {
    color: colors.textMuted,
    ...typography.label,
  },
  nameInput: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderStrong,
  },
  nameError: {
    color: colors.danger,
    ...typography.caption,
  },
  candidateRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  nameHint: {
    color: colors.textSubtle,
    ...typography.caption,
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
