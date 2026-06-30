
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
  const color = focused ? colors.blue : colors.textSubtle;
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
          height: 82,
          paddingTop: 8,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: colors.blue,
        tabBarInactiveTintColor: colors.textSubtle,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
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
    width: 48,
    height: 42,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    borderRadius: 999,
    backgroundColor: colors.accentSoft,
    shadowColor: colors.blue,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  featuredIconFocused: {
    backgroundColor: colors.blue,
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
