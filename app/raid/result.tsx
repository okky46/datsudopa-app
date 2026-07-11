
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { ResultCard } from '../../src/components/ResultCard';
import { ShareButton } from '../../src/components/ShareButton';
import { EnterCard } from '../../src/components/ui/Motion';
import { PresenceBadge } from '../../src/components/ui/PresenceBadge';
import { colors, radius, spacing, typography } from '../../src/constants/theme';
import { adminComments, resultCopy, screenCopy } from '../../src/constants/copy';
import { DopamineService } from '../../src/services/DopamineService';
import { PresenceService } from '../../src/services/PresenceService';
import { StorageService } from '../../src/services/StorageService';
import { DailyResult } from '../../src/types/result';

function getHeroCopy(result: DailyResult | null) {
  if (result?.mode === 'normal') {
    return { title: screenCopy.longResultTitle, line: screenCopy.longResultLine };
  }
  return { title: screenCopy.raidResultTitle, line: screenCopy.raidResultLine };
}

// 日付と視聴秒数から安定して同じひとことを選ぶ（再描画で変わらないように）
function pickAdminComment(result: DailyResult): string {
  const pool = result.status === 'completed' ? adminComments.success : adminComments.failure;
  let seed = result.watchedSeconds + result.targetSeconds;
  for (const char of result.date) {
    seed += char.charCodeAt(0);
  }
  return pool[seed % pool.length];
}

export default function ResultScreen() {
  const params = useLocalSearchParams<{ date?: string; mode?: DailyResult['mode']; level?: string; delta?: string }>();
  const [result, setResult] = useState<DailyResult | null>(null);
  const [level, setLevel] = useState<number | null>(null);

  const paramDelta = params.delta !== undefined ? Number(params.delta) : null;
  const levelDelta = paramDelta !== null && !Number.isNaN(paramDelta) ? paramDelta : null;

  const load = useCallback(async () => {
    const results = await StorageService.getDailyResults();
    const matched = results.find((item) => item.date === params.date && item.mode === params.mode) || results[0] || null;
    setResult(matched);
    const paramLevel = Number(params.level);
    setLevel(!Number.isNaN(paramLevel) && params.level !== undefined ? paramLevel : await DopamineService.getLevel());
  }, [params.date, params.level, params.mode]);

  useEffect(() => {
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const hero = getHeroCopy(result);

  const showScreenshotHint = () => {
    Alert.alert(resultCopy.screenshotAlertTitle, resultCopy.screenshotAlertBody);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{hero.title} ✨</Text>

        {result && level !== null ? (
          <>
            <EnterCard index={0}>
              <ResultCard result={result} level={level} levelDelta={levelDelta} />
            </EnterCard>

            <EnterCard index={1}>
              <View style={styles.adminBubble}>
                <Text style={styles.adminLabel}>{resultCopy.adminLabel}</Text>
                <Text style={styles.adminComment}>{pickAdminComment(result)}</Text>
              </View>
            </EnterCard>

            {result.mode === 'raid' && result.scheduledRaidTime && (
              <View style={styles.presenceWrap}>
                <PresenceBadge
                  label={
                    result.status === 'completed'
                      ? `他に${PresenceService.getCompanionCountForResult(result.date, result.scheduledRaidTime)}人が、この回を完走しました`
                      : `この回は${PresenceService.getRaidStats(result.date, result.scheduledRaidTime).active}人が一緒に耐えていました`
                  }
                />
              </View>
            )}

            <EnterCard index={2} style={styles.actions}>
              <ShareButton result={result} variant="full" onShared={() => void load()} />
              <View style={styles.subActions}>
                <PrimaryButton label={resultCopy.screenshotLabel} variant="ghost" onPress={showScreenshotHint} style={styles.subAction} />
                <PrimaryButton
                  label={resultCopy.homeLabel}
                  variant="ghost"
                  onPress={() => router.replace('/(tabs)')}
                  style={styles.subAction}
                />
              </View>
            </EnterCard>
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
  adminBubble: {
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  adminLabel: {
    color: colors.textSubtle,
    ...typography.label,
  },
  adminComment: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  presenceWrap: {
    alignItems: 'center',
    marginTop: -spacing.sm,
  },
  actions: {
    gap: spacing.sm,
  },
  subActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  subAction: {
    flex: 1,
  },
  empty: {
    color: colors.textMuted,
    ...typography.body,
    textAlign: 'center',
  },
});
