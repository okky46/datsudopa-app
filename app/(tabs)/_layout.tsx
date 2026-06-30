
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../src/constants/theme';

function HomeIcon({ color }: { color: string }) {
  return (
    <View style={styles.homeIcon}>
      <View style={[styles.homeRoof, { borderBottomColor: color }]} />
      <View style={[styles.homeBody, { borderColor: color }]} />
    </View>
  );
}

function ClockIcon({ color }: { color: string }) {
  return (
    <View style={[styles.clock, { borderColor: color }]}>
      <View style={[styles.clockHandV, { backgroundColor: color }]} />
      <View style={[styles.clockHandH, { backgroundColor: color }]} />
    </View>
  );
}

function MenuIcon({ color }: { color: string }) {
  return (
    <View style={styles.menuIcon}>
      <View style={[styles.menuBar, { backgroundColor: color }]} />
      <View style={[styles.menuBar, { backgroundColor: color }]} />
      <View style={[styles.menuBar, { backgroundColor: color }]} />
    </View>
  );
}

function TabIcon({ type, focused }: { type: 'home' | 'clock' | 'menu'; focused: boolean }) {
  const color = focused ? colors.text : colors.textSubtle;

  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapFocused]}>
      {type === 'home' && <HomeIcon color={color} />}
      {type === 'clock' && <ClockIcon color={color} />}
      {type === 'menu' && <MenuIcon color={color} />}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 88,
          paddingTop: 10,
          paddingBottom: 12,
        },
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.3,
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'ホーム', tabBarIcon: ({ focused }) => <TabIcon type="home" focused={focused} /> }} />
      <Tabs.Screen name="long" options={{ title: 'ロング', tabBarIcon: ({ focused }) => <TabIcon type="clock" focused={focused} /> }} />
      <Tabs.Screen name="menu" options={{ title: 'メニュー', tabBarIcon: ({ focused }) => <TabIcon type="menu" focused={focused} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 56,
    height: 34,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapFocused: {
    backgroundColor: 'rgba(214, 222, 243, 0.55)',
  },
  homeIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
  },
  homeRoof: {
    width: 0,
    height: 0,
    borderLeftWidth: 11,
    borderRightWidth: 11,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  homeBody: {
    width: 17,
    height: 12,
    marginTop: -1,
    borderWidth: 2,
    borderTopWidth: 0,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  clock: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockHandV: {
    position: 'absolute',
    width: 2,
    height: 6,
    borderRadius: 2,
    top: 4,
  },
  clockHandH: {
    position: 'absolute',
    width: 5,
    height: 2,
    borderRadius: 2,
    top: 9,
    left: 9,
  },
  menuIcon: {
    gap: 4,
  },
  menuBar: {
    width: 20,
    height: 2,
    borderRadius: 999,
  },
});
