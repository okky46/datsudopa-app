
import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

export type DopaSpikeOverlayHandle = {
  // 誘惑操作が起きた瞬間に呼ぶ。+1%の警告演出を流す。
  show: (message: string) => void;
};

// スクロール・スキップ・倍速などの「ドパる操作」をしたときの警告演出。
// 画面の縁が赤く脈打ち、+1% が浮かび上がる。
export const DopaSpikeOverlay = forwardRef<DopaSpikeOverlayHandle>(function DopaSpikeOverlay(_, ref) {
  const vignette = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);

  useImperativeHandle(ref, () => ({
    show: (nextMessage: string) => {
      setMessage(nextMessage);
      setVisible(true);
      vignette.setValue(0);
      float.setValue(0);
      Animated.parallel([
        Animated.sequence([
          Animated.timing(vignette, { toValue: 1, duration: 130, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(vignette, { toValue: 0, duration: 620, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        ]),
        Animated.timing(float, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) {
          setVisible(false);
        }
      });
    },
  }));

  if (!visible) {
    return null;
  }

  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [14, -46] });
  const floatOpacity = float.interpolate({ inputRange: [0, 0.15, 0.75, 1], outputRange: [0, 1, 1, 0] });

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View style={[styles.vignette, { opacity: vignette }]} />
      <View style={styles.center}>
        <Animated.View style={[styles.bubble, { opacity: floatOpacity, transform: [{ translateY }] }]}>
          <Text style={styles.plus}>ドパガキ度 +1%</Text>
          <Text style={styles.message}>{message}</Text>
        </Animated.View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  vignette: {
    ...StyleSheet.absoluteFill,
    borderWidth: 14,
    borderColor: 'rgba(194, 87, 70, 0.55)',
    backgroundColor: 'rgba(194, 87, 70, 0.10)',
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(244, 179, 168, 0.6)',
  },
  plus: {
    color: '#F6B7AA',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  message: {
    color: 'rgba(244, 247, 251, 0.85)',
    fontSize: 12,
    fontWeight: '600',
  },
});
