
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/theme';

const DOT_COLORS = ['#C9E9D6', '#D2E3F3', '#DCD7F2'];

type Props = {
  label: string;
};

// 名前もチャットも出さない、静かに呼吸する小さな気配クラスター。
// 「同じ時間に誰かがいる」ことだけを、控えめに伝える。
export function PresenceBadge({ label }: Props) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });

  return (
    <View style={styles.row}>
      <View style={styles.dots}>
        {DOT_COLORS.map((color, index) => (
          <Animated.View
            key={color}
            style={[
              styles.dot,
              {
                backgroundColor: color,
                marginLeft: index === 0 ? 0 : -6,
                opacity: index === 1 ? opacity : 0.85,
              },
            ]}
          />
        ))}
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 11,
    height: 11,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.card,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
});
