
// ホーム。表示優先順: 次回レイド → 累計脱ドパ時間 → ドパガキ度 → 連続日数・今週の履歴 → 広告。
// フォーカスのたびにローカル集計を読み直し、未参加処理・通知再スケジュール・
// 各種キューの再送（非同期・待たない）を行う。

import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdBanner } from '../../src/components/AdBanner';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { DopagakiCard } from '../../src/components/home/DopagakiCard';
import { RaidCard } from '../../src/components/home/RaidCard';
import { TotalTimeCard } from '../../src/components/home/TotalTimeCard';
import { WeekCard } from '../../src/components/home/WeekCard';
import { EnterCard } from '../../src/components/ui/Motion';
import { SoftGradient } from '../../src/components/ui/SoftGradient';
import { APP_NAME } from '../../src/constants/copy';
import { colors, fontFamily, spacing } from '../../src/constants/theme';
import { DayHistory, WatchSession } from '../../src/types/session';
import { AnalyticsService } from '../../src/services/AnalyticsService';
import { DopagakiService } from '../../src/services/DopagakiService';
import { NotificationService } from '../../src/services/NotificationService';
import { ProfileService } from '../../src/services/ProfileService';
import { RaidHomeState, RaidService } from '../../src/services/RaidService';
import { RaidSyncService } from '../../src/services/RaidSyncService';
import { SessionService } from '../../src/services/SessionService';
import { StorageService } from '../../src/services/StorageService';
import { VideoDeliveryService } from '../../src/services/VideoDeliveryService';

export default function HomeScreen() {
  const [sessions, setSessions] = useState<WatchSession[]>([]);
  const [raidState, setRaidState] = useState<RaidHomeState | null>(null);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [level, setLevel] = useState<number | null>(null);
  const [streakDays, setStreakDays] = useState(0);
  const [week, setWeek] = useState<DayHistory[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const settings = await StorageService.getSettings();
    if (!settings.onboardingCompleted) {
      router.replace('/onboarding');
      return;
    }

    await SessionService.cleanupStaleActiveSessions();
    const storedSessions = await StorageService.getSessions();
    await DopagakiService.processMissedDays(storedSessions);

    setSessions(storedSessions);
    setRaidState(RaidService.getHomeState(storedSessions));
    setTotalSeconds(await StorageService.getTotalDetoxSeconds());
    setLevel(await DopagakiService.getLevel());
    setStreakDays(SessionService.getStreakDays(storedSessions));
    setWeek(SessionService.getWeekHistory(storedSessions));

    // 以下はすべて非同期のバックグラウンド処理。ホーム表示を止めない
    void NotificationService.scheduleDailyRaid(settings);
    void VideoDeliveryService.prefetchDaily();
    void RaidSyncService.flush();
    void ProfileService.flushPendingSync();
    void AnalyticsService.flush();
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  // カウントダウンと開始猶予の残り時間を1秒ごとに更新
  useEffect(() => {
    const timer = setInterval(() => {
      setRaidState(RaidService.getHomeState(sessions));
    }, 1000);
    return () => clearInterval(timer);
  }, [sessions]);

  const startRaid = () => {
    router.push({ pathname: '/raid/active', params: { mode: 'raid' } });
  };

  const startCatchup = () => {
    router.push({ pathname: '/raid/active', params: { mode: 'catchup' } });
  };

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
            <Text style={styles.brand}>{APP_NAME}</Text>
          </View>

          {raidState && (
            <EnterCard index={0}>
              <RaidCard state={raidState} onStart={startRaid} onCatchup={startCatchup} />
            </EnterCard>
          )}

          <EnterCard index={1}>
            <TotalTimeCard totalSeconds={totalSeconds} />
          </EnterCard>

          {level !== null && (
            <EnterCard index={2}>
              <DopagakiCard level={level} />
            </EnterCard>
          )}

          <EnterCard index={3}>
            <WeekCard streakDays={streakDays} week={week} />
          </EnterCard>

          <AdBanner placement="home" />

          {__DEV__ && (
            <PrimaryButton label="3分視聴の確認用（DEV）" variant="ghost" onPress={startCatchup} />
          )}
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
});
