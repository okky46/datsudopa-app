
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { colors } from '../../constants/theme';
import { SoftGradient } from './SoftGradient';

// タイトル横の小さなオーロラ/パール感のある丸いアクセント
export function AuroraDot({ size = 22, style }: { size?: number; style?: ViewStyle }) {
  return (
    <View style={[{ width: size, height: size, borderRadius: size }, styles.dotWrap, style]}>
      <SoftGradient
        colors={['#CFE8F6', '#E2DAF6', '#F8DCE8', '#D9F0E2']}
        direction="horizontal"
        borderRadius={size}
        style={{ width: size, height: size }}
      />
      <View style={[styles.dotShine, { width: size * 0.34, height: size * 0.34, borderRadius: size }]} />
    </View>
  );
}

// 軽いきらめき（✨）。控えめなアクセントとして使う。
export function Sparkle({ size = 13, style }: { size?: number; style?: ViewStyle }) {
  return <Text style={[{ fontSize: size }, style]}>✨</Text>;
}

// 丸いパステルバッジ＋チェックマーク（達成感の主役）
export function CheckBadge({ size = 64 }: { size?: number }) {
  const tick = size * 0.42;
  return (
    <View style={[styles.badgeOuter, { width: size, height: size, borderRadius: size }]}>
      <SoftGradient colors={['#CFE5F6', '#DCD7F2', '#EBD9F0']} direction="horizontal" borderRadius={size} style={StyleSheet.absoluteFill} />
      <View style={[styles.badgeInner, { width: size * 0.72, height: size * 0.72, borderRadius: size }]}>
        <View style={[styles.tick, { width: tick }]}>
          <View style={styles.tickShort} />
          <View style={styles.tickLong} />
        </View>
      </View>
    </View>
  );
}

// 左右の月桂冠のような軽い装飾（細い弧の代わりに小さな葉を点で表現）
export function LaurelLeaves({ color = colors.textFaint }: { color?: string }) {
  return (
    <>
      <View style={[styles.laurel, styles.laurelLeft]}>
        <View style={[styles.leaf, { backgroundColor: color }]} />
        <View style={[styles.leaf, { backgroundColor: color, opacity: 0.7 }]} />
        <View style={[styles.leaf, { backgroundColor: color, opacity: 0.5 }]} />
      </View>
      <View style={[styles.laurel, styles.laurelRight]}>
        <View style={[styles.leaf, { backgroundColor: color }]} />
        <View style={[styles.leaf, { backgroundColor: color, opacity: 0.7 }]} />
        <View style={[styles.leaf, { backgroundColor: color, opacity: 0.5 }]} />
      </View>
    </>
  );
}

const CONFETTI = [
  { top: 6, left: '12%', color: '#F2C9D2', size: 7 },
  { top: 30, left: '22%', color: '#CDE8D8', size: 5 },
  { top: 14, left: '78%', color: '#CFE2F2', size: 6 },
  { top: 40, left: '86%', color: '#DCD7F2', size: 5 },
  { top: 60, left: '8%', color: '#F6E4C0', size: 5 },
  { top: 70, left: '90%', color: '#F2C9D2', size: 6 },
];

// 結果カード上部に散らす、紙吹雪のような小さな色点
export function Confetti() {
  return (
    <View pointerEvents="none" style={styles.confettiWrap}>
      {CONFETTI.map((dot, index) => (
        <View
          key={index}
          style={[
            styles.confettiDot,
            {
              top: dot.top,
              left: dot.left as ViewStyle['left'],
              width: dot.size,
              height: dot.size,
              borderRadius: dot.size,
              backgroundColor: dot.color,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dotWrap: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotShine: {
    position: 'absolute',
    top: '16%',
    left: '18%',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  badgeOuter: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  badgeInner: {
    backgroundColor: 'rgba(255,255,255,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tick: {
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickShort: {
    position: 'absolute',
    left: 0,
    bottom: 2,
    width: 7,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
    transform: [{ rotate: '45deg' }],
  },
  tickLong: {
    position: 'absolute',
    right: 0,
    bottom: 4,
    width: 13,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
    transform: [{ rotate: '-50deg' }],
  },
  laurel: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center',
  },
  laurelLeft: {},
  laurelRight: {
    transform: [{ scaleX: -1 }],
  },
  leaf: {
    width: 4,
    height: 9,
    borderRadius: 4,
  },
  confettiWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 90,
  },
  confettiDot: {
    position: 'absolute',
  },
});
