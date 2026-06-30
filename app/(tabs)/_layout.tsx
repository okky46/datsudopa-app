
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

function PlayIcon({ color }: { color: string }) {
  return <View style={[styles.playIcon, { borderLeftColor: color }]} />;
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

function TabIcon({ type, focused, featured = false }: { type: 'home' | 'play' | 'menu'; focused: boolean; featured?: boolean }) {
  const color = focused ? colors.accent : colors.textSubtle;
  const iconColor = featured && focused ? colors.card : color;

  return (
    <View style={[styles.iconWrap, featured && styles.featuredIcon, focused && featured && styles.featuredIconFocused]}>
      {type === 'home' && <HomeIcon color={color} />}
      {type === 'play' && <PlayIcon color={iconColor} />}
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
          height: 84,
          paddingTop: 10,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.3,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'ホーム', tabBarIcon: ({ focused }) => <TabIcon type="home" focused={focused} /> }} />
      <Tabs.Screen
        name="long"
        options={{
          title: '脱ドパロング',
          tabBarIcon: ({ focused }) => <TabIcon type="play" focused={focused} featured />,
          tabBarItemStyle: styles.longTabItem,
          tabBarLabelStyle: styles.longTabLabel,
        }}
      />
      <Tabs.Screen name="menu" options={{ title: 'メニュー', tabBarIcon: ({ focused }) => <TabIcon type="menu" focused={focused} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredIcon: {
    width: 46,
    height: 40,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    borderRadius: 999,
    backgroundColor: colors.accentSoft,
  },
  featuredIconFocused: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
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
  playIcon: {
    width: 0,
    height: 0,
    marginLeft: 3,
    borderTopWidth: 9,
    borderBottomWidth: 9,
    borderLeftWidth: 14,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  menuIcon: {
    gap: 4,
  },
  menuBar: {
    width: 20,
    height: 2,
    borderRadius: 999,
  },
  longTabItem: {
    paddingTop: 0,
    transform: [{ translateY: -4 }],
  },
  longTabLabel: {
    fontSize: 11,
    fontWeight: '800',
    paddingTop: 2,
  },
});
