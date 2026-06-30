
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdBanner } from '../../src/components/AdBanner';
import { HistoryList } from '../../src/components/HistoryList';
import { HomeHeroCard } from '../../src/components/HomeHeroCard';
import { AuroraDot } from '../../src/components/ui/Decorations';
import { HOME_CATCHPHRASE } from '../../src/constants/copy';
import { colors, spacing, typography } from '../../src/constants/theme';
import { DailyResult } from '../../src/types/result';
import { RaidStatusView } from '../../src/types/raid';
import { UserSettings } from '../../src/types/settings';
import { LongVideoService } from '../../src/services/LongVideoService';
import { NotificationService } from '../../src/services/NotificationService';
import { RaidService } from '../../src/services/RaidService';
import { StorageService } from '../../src/services/StorageService';

function BellIcon() {
  return (
    <View style={styles.bell}>
      <View style={styles.bellBody} />
      <View style={styles.bellClapper} />
    </View>
  );
}

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
    let storedResults = await StorageService.getDailyResults();
    storedResults = await RaidService.ensureMissedResultRecorded(storedSettings, storedResults);
    await NotificationService.scheduleDailyRaid(storedSettings);
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
          <View style={styles.brandRow}>
            <Text style={styles.brand}>脱ドパ</Text>
            <AuroraDot size={22} style={styles.brandDot} />
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="通知" style={styles.bellWrap} onPress={() => {}}>
            <BellIcon />
          </Pressable>
        </View>

        {raidStatus && <HomeHeroCard score={score} raidStatus={raidStatus} result={latestResult} onStart={startRaid} />}

        <View style={styles.catchphraseRow}>
          <Text style={styles.catchphrase}>✨ {HOME_CATCHPHRASE} ✨</Text>
        </View>

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
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brand: {
    color: colors.text,
    ...typography.brandMark,
  },
  brandDot: {
    marginTop: 2,
  },
  bellWrap: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bell: {
    width: 22,
    height: 24,
    alignItems: 'center',
  },
  bellBody: {
    width: 18,
    height: 16,
    borderWidth: 2,
    borderColor: colors.textSubtle,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  bellClapper: {
    width: 6,
    height: 3,
    marginTop: 1,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: colors.textSubtle,
  },
  catchphraseRow: {
    alignItems: 'center',
    marginTop: -spacing.xs,
  },
  catchphrase: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
});
