
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { celebrationCopy } from '../../constants/copy';
import { rainbowSoft } from '../../constants/theme';

const RAY_COUNT = 10;
const CONFETTI_COUNT = 14;
const TOTAL_DURATION_MS = 2600;

type Props = {
  onDone: () => void;
};

// 完走時だけに許した、パチンコの大当たりみたいな短いピカピカ演出。
// 光は派手だが色は既存のパステル虹に限定し、2.6秒で静けさに戻る。
export function CelebrationOverlay({ onDone }: Props) {
  const { width, height } = useWindowDimensions();
  const scrim = useRef(new Animated.Value(0)).current;
  const strobe = useRef(new Animated.Value(0)).current;
  const rays = useRef(new Animated.Value(0)).current;
  const headline = useRef(new Animated.Value(0)).current;
  const confetti = useRef(new Animated.Value(0)).current;
  const doneRef = useRef(false);

  useEffect(() => {
    const strobeLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(strobe, { toValue: 1, duration: 90, useNativeDriver: true }),
        Animated.timing(strobe, { toValue: 0, duration: 130, useNativeDriver: true }),
      ]),
      { iterations: 6 },
    );
    const raysLoop = Animated.loop(
      Animated.timing(rays, { toValue: 1, duration: 1400, easing: Easing.linear, useNativeDriver: true }),
    );

    Animated.timing(scrim, { toValue: 1, duration: 160, useNativeDriver: true }).start();
    strobeLoop.start();
    raysLoop.start();
    Animated.spring(headline, { toValue: 1, damping: 9, stiffness: 190, mass: 0.8, useNativeDriver: true }).start();
    Animated.timing(confetti, { toValue: 1, duration: TOTAL_DURATION_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();

    const timer = setTimeout(() => {
      if (!doneRef.current) {
        doneRef.current = true;
        onDone();
      }
    }, TOTAL_DURATION_MS);

    return () => {
      clearTimeout(timer);
      strobeLoop.stop();
      raysLoop.stop();
    };
  }, [confetti, headline, onDone, rays, scrim, strobe]);

  const spin = rays.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const strobeOpacity = strobe.interpolate({ inputRange: [0, 1], outputRange: [0, 0.4] });
  const headlineScale = headline.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const rayLength = Math.max(width, height) * 0.62;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="auto">
      <Animated.View style={[styles.scrim, { opacity: scrim }]} />

      <Animated.View style={[styles.rayWrap, { transform: [{ rotate: spin }] }]} pointerEvents="none">
        {Array.from({ length: RAY_COUNT }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.ray,
              {
                height: rayLength,
                backgroundColor: rainbowSoft[index % rainbowSoft.length],
                transform: [{ rotate: `${(360 / RAY_COUNT) * index}deg` }, { translateY: -rayLength / 2 }],
              },
            ]}
          />
        ))}
      </Animated.View>

      <Animated.View style={[styles.strobe, { opacity: strobeOpacity }]} pointerEvents="none" />

      <View style={styles.confettiWrap} pointerEvents="none">
        {Array.from({ length: CONFETTI_COUNT }).map((_, index) => {
          const left = ((index * 71) % 100) / 100;
          const size = 6 + (index % 4) * 3;
          const fall = confetti.interpolate({
            inputRange: [0, 1],
            outputRange: [-40 - (index % 5) * 30, height * 0.9],
          });
          const sway = confetti.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0, index % 2 === 0 ? 24 : -24, 0],
          });
          return (
            <Animated.View
              key={index}
              style={[
                styles.confetti,
                {
                  left: left * width,
                  width: size,
                  height: size,
                  borderRadius: index % 3 === 0 ? 2 : size,
                  backgroundColor: rainbowSoft[index % rainbowSoft.length],
                  transform: [{ translateY: fall }, { translateX: sway }],
                },
              ]}
            />
          );
        })}
      </View>

      <View style={styles.center} pointerEvents="none">
        <Animated.View style={[styles.headlineWrap, { opacity: headline, transform: [{ scale: headlineScale }] }]}>
          <Text style={styles.headline}>{celebrationCopy.headline}</Text>
          <Text style={styles.sub}>{celebrationCopy.sub}</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(6, 8, 14, 0.82)',
  },
  rayWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ray: {
    position: 'absolute',
    width: 10,
    borderRadius: 8,
    opacity: 0.5,
  },
  strobe: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#FFF8ED',
  },
  confettiWrap: {
    ...StyleSheet.absoluteFill,
  },
  confetti: {
    position: 'absolute',
    top: 0,
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headlineWrap: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingVertical: 22,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
  },
  headline: {
    color: '#2E3450',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  sub: {
    color: '#6B7185',
    fontSize: 13,
    fontWeight: '600',
  },
});
