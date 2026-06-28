
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdBanner } from '../../src/components/AdBanner';
import { DopamineScoreCard } from '../../src/components/DopamineScoreCard';
import { HistoryList } from '../../src/components/HistoryList';
import { RaidStatusCard } from '../../src/components/RaidStatusCard';
import { ResultCard } from '../../src/components/ResultCard';
import { colors, spacing } from '../../src/constants/theme';
import { DailyResult } from '../../src/types/result';
import { RaidStatusView } from '../../src/types/raid';
import { UserSettings } from '../../src/types/settings';
import { LongVideoService } from '../../src/services/LongVideoService';
import { RaidService } from '../../src/services/RaidService';
import { StorageService } from '../../src/services/StorageService';

export default function HomeScreen() {
  const [settings, setSettings] = useState<UserSettings>(StorageService.getDefaultSettings());
  const [results, setResults] = useState<DailyResult[]>([]);
  const [raidStatus, setRaidStatus] = useState<RaidStatusView | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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
          <Text style={styles.kicker}>脱ドパ</Text>
          <Text style={styles.title}>今日の儀式</Text>
          <Text style={styles.subtitle}>SNSの強い刺激から、静かな映像空間へ退避する毎日1回のレイド。</Text>
        </View>

        <DopamineScoreCard score={score} result={latestResult} />
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
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  kicker: {
    color: colors.blue,
    fontSize: 13,
    letterSpacing: 3,
    fontWeight: '700',
  },
  title: {
    color: colors.text,
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -1.2,
  },
  subtitle: {
    color: colors.textMuted,
    lineHeight: 22,
  },
});
