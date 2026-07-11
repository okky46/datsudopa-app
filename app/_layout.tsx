import 'react-native-reanimated';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../src/constants/theme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />
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
        <Stack.Screen name="howto" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="raid/active" options={{ gestureEnabled: false, animation: 'fade' }} />
        <Stack.Screen name="raid/result" options={{ animation: 'fade_from_bottom' }} />
      </Stack>
    </>
  );
}
