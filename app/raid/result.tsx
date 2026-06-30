
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { ResultCard } from '../../src/components/ResultCard';
import { ShareButton } from '../../src/components/ShareButton';
import { colors, spacing, typography } from '../../src/constants/theme';
import { screenCopy } from '../../src/constants/copy';
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
    return { title: screenCopy.longResultTitle, line: screenCopy.longResultLine };
  }
  return { title: screenCopy.raidResultTitle, line: screenCopy.raidResultLine };
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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{hero.title} ✨</Text>

        {result ? (
          <>
            <ResultCard result={result} />
            <Text style={styles.line}>{result.comment || hero.line}</Text>
            <ShareButton result={result} variant="full" />
            <PrimaryButton label="履歴を見る  ›" variant="ghost" onPress={() => router.replace('/(tabs)')} />
          </>
        ) : (
          <>
            <Text style={styles.empty}>記録が見つかりませんでした。</Text>
            <PrimaryButton label="ホームへ" variant="ghost" onPress={() => router.replace('/(tabs)')} />
          </>
        )}
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    color: colors.text,
    textAlign: 'center',
    ...typography.h1,
  },
  line: {
    color: colors.textMuted,
    ...typography.caption,
    textAlign: 'center',
    marginTop: -spacing.xs,
  },
  empty: {
    color: colors.textMuted,
    ...typography.body,
    textAlign: 'center',
  },
});
