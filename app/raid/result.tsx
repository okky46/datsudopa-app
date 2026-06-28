
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { ResultCard } from '../../src/components/ResultCard';
import { ShareButton } from '../../src/components/ShareButton';
import { colors, spacing } from '../../src/constants/theme';
import { StorageService } from '../../src/services/StorageService';
import { DailyResult } from '../../src/types/result';

export default function ResultScreen() {
  const params = useLocalSearchParams<{ date?: string; mode?: DailyResult['mode'] }>();
  const [result, setResult] = useState<DailyResult | null>(null);

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

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>RAID RESULT</Text>
          <Text style={styles.title}>記録は残る</Text>
          <Text style={styles.subtitle}>完走しても逃げても、今日のログとして保存されます。</Text>
        </View>
        {result ? (
          <>
            <ResultCard result={result} />
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
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2.5,
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
