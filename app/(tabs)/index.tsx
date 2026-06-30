
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdBanner } from '../../src/components/AdBanner';
import { DopamineScoreCard } from '../../src/components/DopamineScoreCard';
import { HistoryList } from '../../src/components/HistoryList';
import { RaidStatusCard } from '../../src/components/RaidStatusCard';
import { ResultCard } from '../../src/components/ResultCard';
import { APP_CATCHPHRASE } from '../../src/constants/copy';
import { colors, spacing, typography } from '../../src/constants/theme';
import { DailyResult } from '../../src/types/result';
import { RaidStatusView } from '../../src/types/raid';
import { UserSettings } from '../../src/types/settings';
import { LongVideoService } from '../../src/services/LongVideoService';
import { RaidService } from '../../src/services/RaidService';
import { StorageService } from '../../src/services/StorageService';
import { getTimeBasedGreeting } from '../../src/utils/greeting';

export default function HomeScreen() {
  const [settings, setSettings] = useState<UserSettings>(StorageService.getDefaultSettings());
  const [results, setResults] = useState<DailyResult[]>([]);
  const [raidStatus, setRaidStatus] = useState<RaidStatusView | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [greeting, setGreeting] = useState(getTimeBasedGreeting());

  const load = useCallback(async () => {
    const storedSettings = await StorageService.getSettings();
    if (!storedSettings.onboardingCompleted) {
      router.replace('/onboarding');
      return;
    }
    const storedResults = await StorageService.getDailyResults();
    setSettings(storedSettings);
    setResults(storedResults);
    setRaidStatus(RaidService.getRaidStatus(storedSettings, storedResults));
    setGreeting(getTimeBasedGreeting());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const latestResult = results[0];
  const score = latestResult?.dopamineScore ?? 72;

  const startRaid = async () => {
    const video = LongVideoService.getRecommendedVideo();
    const state = RaidService.createRaidState(settings, video);
    await StorageService.saveCurrentRaidState(state);
    router.push({ pathname: '/raid/active', params: { mode: 'raid', videoId: video.id, duration: String(state.targetSeconds) } });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.blue}
            onRefresh={() => {
              setRefreshing(true);
              void load().finally(() => setRefreshing(false));
            }}
          />
        }
      >
        <View style={styles.hero}>
          <View style={styles.brandRow}>
            <View style={styles.brandLeft}>
              <View style={styles.logoSlot} accessibilityLabel="ロゴ予定地" />
              <Text style={styles.brandMark}>脱ドパ</Text>
            </View>
            <Text style={styles.catchCopy}>{APP_CATCHPHRASE}</Text>
          </View>
          <Text style={styles.greeting}>{greeting}</Text>
        </View>

        <DopamineScoreCard score={score} nickname={settings.nickname} result={latestResult} />
        {raidStatus && <RaidStatusCard raidStatus={raidStatus} raidTime={settings.raidTime} onStart={startRaid} />}
        {latestResult && <ResultCard result={latestResult} />}
        <HistoryList results={results} />
        <AdBanner label="ホーム下部 AdMob バナー" />
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
    paddingBottom: 110,
  },
  hero: {
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flexShrink: 1,
  },
  logoSlot: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentSoft,
  },
  brandMark: {
    color: colors.text,
    ...typography.brandMark,
  },
  catchCopy: {
    flex: 1,
    color: colors.blue,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
    textAlign: 'right',
  },
  greeting: {
    color: colors.textMuted,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 28,
  },
});
