
import { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { radius, rainbowSoft } from '../../constants/theme';

type Props = {
  height?: number;
  style?: ViewStyle;
};

// 主役カードに限定して使う、霞んだ虹の細い帯。ゆっくり光が流れる程度の控えめな演出。
export function RainbowAccent({ height = 6, style }: Props) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(withTiming(1, { duration: 3600, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [shimmer]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + shimmer.value * 0.4,
    transform: [{ translateX: -60 + shimmer.value * 120 }],
  }));

  return (
    <View style={[styles.track, { height, borderRadius: height }, style]}>
      {rainbowSoft.map((color, index) => (
        <View key={color + index} style={[styles.cell, { backgroundColor: color }]} />
      ))}
      <Animated.View style={[styles.glow, glowStyle]} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: radius.pill,
  },
  cell: {
    flex: 1,
  },
  glow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
});
