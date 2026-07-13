import 'react-native-reanimated';
import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import {
  useFonts,
  ZenMaruGothic_400Regular,
  ZenMaruGothic_500Medium,
  ZenMaruGothic_700Bold,
  ZenMaruGothic_900Black,
} from '@expo-google-fonts/zen-maru-gothic';
import { colors } from '../src/constants/theme';
import { AnalyticsService } from '../src/services/AnalyticsService';
import { NotificationService } from '../src/services/NotificationService';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    ZenMaruGothic_400Regular,
    ZenMaruGothic_500Medium,
    ZenMaruGothic_700Bold,
    ZenMaruGothic_900Black,
  });

  // 22時の通知タップ → 公式レイド開始導線へ直行。
  // 窓の外だった場合は active 側がホームへ戻し、追い脱ドパ導線を見せる。
  useEffect(() => {
    const openRaid = () => {
      void AnalyticsService.track('raid_notification_opened');
      router.push({ pathname: '/raid/active', params: { mode: 'raid' } });
    };
    const unsubscribe = NotificationService.addRaidNotificationListener(openRaid);
    void NotificationService.consumeLaunchRaidNotification().then((fromRaidNotification) => {
      if (fromRaidNotification) {
        openRaid();
      }
    });
    return unsubscribe;
  }, []);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'slide_from_right',
          animationDuration: 260,
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="raid/active" options={{ gestureEnabled: false, animation: 'fade' }} />
        <Stack.Screen name="raid/result" options={{ animation: 'fade_from_bottom' }} />
      </Stack>
    </>
  );
}
