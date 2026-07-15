import 'react-native-reanimated';
import { Stack } from 'expo-router';
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
import { useRaidNotificationRouter } from '../src/hooks/useRaidNotificationRouter';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    ZenMaruGothic_400Regular,
    ZenMaruGothic_500Medium,
    ZenMaruGothic_700Bold,
    ZenMaruGothic_900Black,
  });

  // 通知タップからの遷移を一元管理（コールドスタート/リスナーの二重処理防止・
  // ナビ準備待ち・オンボーディング優先・窓外はホームへ）。
  useRaidNotificationRouter(fontsLoaded);

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
