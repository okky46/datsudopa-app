
import { StyleSheet, View, type ViewStyle } from 'react-native';

type Props = {
  borderRadius?: number;
  // 'home' | 'result' でわずかにブロブの配置を変える
  variant?: 'home' | 'result';
  style?: ViewStyle;
};

// 主役カードに敷く、ごく淡いオーロラ/パステルのウォッシュ。
// 角に大きな半透明の色だまりを置き、白ベースの上にやわらかいグラデーション感を作る。
export function PastelWash({ borderRadius = 0, variant = 'home', style }: Props) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius, overflow: 'hidden' }, style]}>
      <View style={styles.base} />
      <View style={[styles.blob, styles.blobBlue, variant === 'result' && styles.blobBlueResult]} />
      <View style={[styles.blob, styles.blobLavender]} />
      <View style={[styles.blob, styles.blobPink, variant === 'result' && styles.blobPinkResult]} />
      <View style={[styles.blob, styles.blobMint]} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
  },
  blob: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 999,
    opacity: 0.55,
  },
  blobBlue: {
    top: -120,
    left: -70,
    backgroundColor: '#DCEAF8',
  },
  blobBlueResult: {
    top: -110,
    left: -40,
    backgroundColor: '#E2ECF8',
  },
  blobLavender: {
    top: -90,
    right: -90,
    backgroundColor: '#E8E2F8',
  },
  blobPink: {
    bottom: -130,
    right: -60,
    backgroundColor: '#FBE6EE',
  },
  blobPinkResult: {
    bottom: -120,
    right: -50,
    backgroundColor: '#FBE7EF',
  },
  blobMint: {
    bottom: -120,
    left: -90,
    backgroundColor: '#DCF0E4',
    opacity: 0.45,
  },
});
