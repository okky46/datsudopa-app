
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdBanner } from '../../src/components/AdBanner';
import { DopamineScoreCard } from '../../src/components/DopamineScoreCard';
import { HistoryList } from '../../src/components/HistoryList';
import { RaidStatusCard } from '../../src/components/RaidStatusCard';
import { APP_CATCHPHRASE } from '../../src/constants/copy';
import { colors, spacing, typography } from '../../src/constants/theme';
import { DailyResult } from '../../src/types/result';
import { RaidStatusView } from '../../src/types/raid';
import { UserSettings } from '../../src/types/settings';
import { LongVideoService } from '../../src/services/LongVideoService';
import { NotificationService } from '../../src/services/NotificationService';
import { RaidService } from '../../src/services/RaidService';
import { StorageService } from '../../src/services/StorageService';
import { getDailyComment } from '../../src/utils/score';
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
    let storedResults = await StorageService.getDailyResults();
    storedResults = await RaidService.ensureMissedResultRecorded(storedSettings, storedResults);
    await NotificationService.scheduleDailyRaid(storedSettings);
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

  useEffect(() => {
    if (raidStatus?.status !== 'available') {
      return;
    }
    const timer = setInterval(() => {
      const nextStatus = RaidService.getRaidStatus(settings, results);
      setRaidStatus(nextStatus);
      if (nextStatus.status === 'missed' && !RaidService.getTodayRaidResult(results)) {
        void RaidService.ensureMissedResultRecorded(settings, results).then(setResults);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [raidStatus?.status, settings, results]);

  const latestRaidResult = results.find((result) => result.mode === 'raid');
  const latestResult = latestRaidResult ?? results[0];
  const score = latestResult?.dopamineScore ?? 72;
  const oneLiner = latestResult?.comment || getDailyComment(score);

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
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={colors.accent}
            onRefresh={() => {
              setRefreshing(true);
              void load().finally(() => setRefreshing(false));
            }}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.brand}>脱ドパ</Text>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.catchphrase}>{APP_CATCHPHRASE}</Text>
        </View>

        <DopamineScoreCard score={score} nickname={settings.nickname} result={latestResult} compact />
        {raidStatus && <RaidStatusCard raidStatus={raidStatus} onStart={startRaid} />}

        <Text style={styles.oneLiner}>今日の一言：{oneLiner}</Text>

        <HistoryList results={results} />
        <AdBanner />
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
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 120,
  },
  header: {
    gap: 2,
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  brand: {
    color: colors.textSubtle,
    ...typography.brandMark,
  },
  greeting: {
    color: colors.text,
    ...typography.display,
  },
  catchphrase: {
    color: colors.textMuted,
    ...typography.body,
  },
  oneLiner: {
    color: colors.textMuted,
    fontSize: 15,
    fontStyle: 'italic',
    lineHeight: 22,
    paddingHorizontal: spacing.xs,
    marginTop: -spacing.xs,
  },
});
