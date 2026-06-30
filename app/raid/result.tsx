
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { ResultCard } from '../../src/components/ResultCard';
import { ShareButton } from '../../src/components/ShareButton';
import { colors, spacing, typography } from '../../src/constants/theme';
import { englishLabels } from '../../src/constants/copy';
import { StorageService } from '../../src/services/StorageService';
import { DailyResult } from '../../src/types/result';
import { useScreenFrame } from '../../src/contexts/ScreenFrameContext';
import { formatClock } from '../../src/utils/date';

function getCelebrationTime(result: DailyResult): string {
  if (result.raidEndedAt) {
    return formatClock(new Date(result.raidEndedAt));
  }
  return formatClock(new Date());
}

function getHeroCopy(result: DailyResult | null) {
  if (result?.mode === 'normal') {
    return {
      kicker: englishLabels.longSessionResult,
      title: '脱ドパロング視聴結果',
      subtitle: 'どれだけ脱ドパできたか、スマホを触らなかった時間でどれだけ落ち着けたかを数字にしました。',
    };
  }

  return {
    kicker: englishLabels.sessionResult,
    title: '脱ドパレイド結果',
    subtitle: '完走しても逃げても、今日のログとして保存されます。',
  };
}

export default function ResultScreen() {
  const params = useLocalSearchParams<{ date?: string; mode?: DailyResult['mode'] }>();
  const [result, setResult] = useState<DailyResult | null>(null);
  const { triggerCelebration } = useScreenFrame();

  const load = useCallback(async () => {
    const results = await StorageService.getDailyResults();
    const matched = results.find((item) => item.date === params.date && item.mode === params.mode) || results[0] || null;
    setResult(matched);
  }, [params.date, params.mode]);

  useEffect(() => {
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    if (result?.status === 'completed') {
      triggerCelebration(7000, getCelebrationTime(result));
    }
  }, [result, triggerCelebration]);

  const hero = getHeroCopy(result);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>{hero.kicker}</Text>
          <Text style={styles.title}>{hero.title}</Text>
          <Text style={styles.subtitle}>{hero.subtitle}</Text>
        </View>
        {result ? (
          <>
            <ResultCard result={result} />
            {result.status === 'completed' && (
              <PrimaryButton
                label="脱ドパ成功アニメをもう一度"
                variant="ghost"
                onPress={() => triggerCelebration(7000, getCelebrationTime(result))}
              />
            )}
            <ShareButton result={result} />
          </>
        ) : (
          <Text style={styles.empty}>リザルトが見つかりませんでした。</Text>
        )}
        <PrimaryButton label="ホームへ戻る" variant="ghost" onPress={() => router.replace('/(tabs)')} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    gap: spacing.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  hero: {
    gap: spacing.sm,
    paddingTop: spacing.xl,
  },
  kicker: {
    color: colors.blue,
    ...typography.englishKicker,
  },
  title: {
    color: colors.text,
    fontSize: 36,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    lineHeight: 22,
  },
  empty: {
    color: colors.textMuted,
  },
});
