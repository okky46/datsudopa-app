
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '../../src/constants/theme';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  return <Text style={{ color: focused ? colors.blue : colors.textSubtle, fontSize: 18 }}>{label}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.backgroundSoft,
          borderTopColor: colors.border,
          height: 72,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarLabelStyle: {
          fontSize: 12,
          paddingBottom: 8,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'ホーム', tabBarIcon: ({ focused }) => <TabIcon label="□" focused={focused} /> }} />
      <Tabs.Screen name="long" options={{ title: 'ロング', tabBarIcon: ({ focused }) => <TabIcon label="◇" focused={focused} /> }} />
      <Tabs.Screen name="menu" options={{ title: 'メニュー', tabBarIcon: ({ focused }) => <TabIcon label="≡" focused={focused} /> }} />
    </Tabs>
  );
}
