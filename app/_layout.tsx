
import 'react-native-reanimated';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ScreenFrame } from '../src/components/ScreenFrame';
import { colors } from '../src/constants/theme';
import { ScreenFrameProvider } from '../src/contexts/ScreenFrameContext';

export default function RootLayout() {
  return (
    <ScreenFrameProvider>
      <ScreenFrame>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="raid/active" options={{ gestureEnabled: false }} />
          <Stack.Screen name="raid/result" />
        </Stack>
      </ScreenFrame>
    </ScreenFrameProvider>
  );
}
