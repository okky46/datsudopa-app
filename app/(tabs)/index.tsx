
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdBanner } from '../../src/components/AdBanner';
import { DopaHeroCard } from '../../src/components/home/DopaHeroCard';
import { RaidCard } from '../../src/components/home/RaidCard';
import { RecordCard } from '../../src/components/home/RecordCard';
import { SharePill } from '../../src/components/home/SharePill';
import { WeeklyBalanceCard } from '../../src/components/home/WeeklyBalanceCard';
import { EnterCard } from '../../src/components/ui/Motion';
import { SoftGradient } from '../../src/components/ui/SoftGradient';
import { homeCopy } from '../../src/constants/copy';
import { colors, fontFamily, spacing } from '../../src/constants/theme';
import { DailyResult } from '../../src/types/result';
import { DopamineDeltas } from '../../src/types/dopamine';
import { RaidStatusView } from '../../src/types/raid';
import { UserSettings } from '../../src/types/settings';
import { DopamineService } from '../../src/services/DopamineService';
import { LongVideoService } from '../../src/services/LongVideoService';
import { NotificationService } from '../../src/services/NotificationService';
import { RaidService } from '../../src/services/RaidService';
import { ShareService } from '../../src/services/ShareService';
import { StatsService, WeeklyBalance } from '../../src/services/StatsService';
import { StorageService } from '../../src/services/StorageService';
import { TitleService } from '../../src/services/TitleService';

function ProfileGlyph() {
  return (
    <View style={styles.profileRing}>
      <View style={styles.profileDot} />
      <View style={styles.profileArc} />
    </View>
  );
}

export default function HomeScreen() {
  const [settings, setSettings] = useState<UserSettings>(StorageService.getDefaultSettings());
  const [results, setResults] = useState<DailyResult[]>([]);
  const [raidStatus, setRaidStatus] = useState<RaidStatusView | null>(null);
  const [level, setLevel] = useState<number | null>(null);
  const [deltas, setDeltas] = useState<DopamineDeltas>({ vsYesterday: null, vsLastWeek: null, vsLastMonth: null });
  const [titleName, setTitleName] = useState('ドパガキ見習い');
  const [balance, setBalance] = useState<WeeklyBalance | null>(null);
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

    const storedLevel = await DopamineService.getLevel();
    const storedDeltas = await DopamineService.getDeltas();
    const unlockStats = await TitleService.getUnlockStats(storedResults);

    setSettings(storedSettings);
    setResults(storedResults);
    setRaidStatus(RaidService.getRaidStatus(storedSettings, storedResults));
    setLevel(storedLevel);
    setDeltas(storedDeltas);
    setTitleName(TitleService.displayTitle(unlockStats, storedSettings).name);
    setBalance(StatsService.getWeeklyBalance(storedResults));
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

  const startRaid = async () => {
    const video = LongVideoService.getRecommendedVideo();
    const state = RaidService.createRaidState(settings, video);
    await StorageService.saveCurrentRaidState(state);
    router.push({ pathname: '/raid/active', params: { mode: 'raid', videoId: video.id, duration: String(state.targetSeconds) } });
  };

  const shareStatus = async () => {
    await ShareService.shareStatus();
    // 共有でドパガキ度が微増するので表示を更新
    await load();
  };

  const streakDays = StatsService.getStreakDays(results);
  const calendar = StatsService.getMonthCalendar(results);

  return (
    <View style={styles.root}>
      <SoftGradient
        colors={[colors.backgroundTop, colors.background]}
        direction="vertical"
        style={StyleSheet.absoluteFill}
        steps={40}
      />
      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              tintColor={colors.primary}
              onRefresh={() => {
                setRefreshing(true);
                void load().finally(() => setRefreshing(false));
              }}
            />
          }
        >
          <View style={styles.header}>
            <Text style={styles.brand}>脱ドパ</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="プロフィール" style={styles.profileWrap} onPress={() => {}}>
              <ProfileGlyph />
            </Pressable>
          </View>

          {raidStatus && level !== null && (
            <EnterCard index={0}>
              <DopaHeroCard level={level} deltas={deltas} titleName={titleName} />
            </EnterCard>
          )}

          {raidStatus && (
            <EnterCard index={1}>
              <RaidCard raidStatus={raidStatus} onStart={() => void startRaid()} />
            </EnterCard>
          )}

          <EnterCard index={2}>
            <SharePill label={homeCopy.shareLabel} onPress={() => void shareStatus()} />
          </EnterCard>

          {balance && (
            <EnterCard index={3}>
              <WeeklyBalanceCard balance={balance} />
            </EnterCard>
          )}

          <EnterCard index={4}>
            <RecordCard streakDays={streakDays} calendarLabel={calendar.label} weeks={calendar.weeks} />
          </EnterCard>

          <AdBanner />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safe: {
    flex: 1,
  },
  content: {
    gap: spacing.md,
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
    marginBottom: spacing.xs,
  },
  brand: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '900',
    fontFamily: fontFamily.black,
    letterSpacing: 1,
  },
  profileWrap: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileRing: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 106, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  profileArc: {
    position: 'absolute',
    width: 16,
    height: 8,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1.5,
    borderColor: colors.primary,
    bottom: 7,
  },
});
