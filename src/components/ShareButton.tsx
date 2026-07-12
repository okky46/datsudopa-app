
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { DailyResult } from '../types/result';
import { ShareService } from '../services/ShareService';
import { colors, fontFamily, radius, spacing } from '../constants/theme';
import { PrimaryButton } from './PrimaryButton';

type Props = {
  result?: DailyResult | null;
  // inline: カード内に置く小さなピル / full: 単独の大きなボタン / icon: 正方形のアイコンだけのボタン
  variant?: 'inline' | 'full' | 'icon';
  // 共有完了後に呼ばれる（共有でドパガキ度が微増するため、呼び出し側で表示を更新できる）
  onShared?: () => void;
};

export function ShareGlyph({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <View style={[styles.shareIcon, { width: size, height: size }]} accessibilityElementsHidden importantForAccessibility="no">
      <View style={[styles.shareLine, styles.shareLineTop, { backgroundColor: color }]} />
      <View style={[styles.shareLine, styles.shareLineBottom, { backgroundColor: color }]} />
      <View style={[styles.shareDot, styles.shareDotLeft, { borderColor: color }]} />
      <View style={[styles.shareDot, styles.shareDotTop, { borderColor: color }]} />
      <View style={[styles.shareDot, styles.shareDotBottom, { borderColor: color }]} />
    </View>
  );
}

function handleShare(result: DailyResult | null | undefined, onShared?: () => void) {
  if (!result) {
    Alert.alert('まだ共有できる記録がない', 'レイドか自主練を終えると共有できます。');
    return;
  }
  void ShareService.shareResult(result).then(() => onShared?.());
}

export function ShareButton({ result, variant = 'full', onShared }: Props) {
  if (variant === 'icon') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="共有"
        disabled={!result}
        onPress={() => handleShare(result, onShared)}
        style={({ pressed }) => [styles.iconButton, !result && styles.pillDisabled, pressed && styles.pillPressed]}
      >
        <ShareGlyph color={colors.text} size={18} />
      </Pressable>
    );
  }

  if (variant === 'inline') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="共有"
        disabled={!result}
        onPress={() => handleShare(result, onShared)}
        style={({ pressed }) => [styles.pill, !result && styles.pillDisabled, pressed && styles.pillPressed]}
      >
        <ShareGlyph color={colors.text} size={15} />
        <Text style={styles.pillLabel}>共有</Text>
      </Pressable>
    );
  }

  return (
    <PrimaryButton
      label="共有する"
      disabled={!result}
      icon={<ShareGlyph color={colors.onPrimary} size={18} />}
      onPress={() => handleShare(result, onShared)}
    />
  );
}

const styles = StyleSheet.create({
  iconButton: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.card,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  pillDisabled: {
    opacity: 0.45,
  },
  pillPressed: {
    opacity: 0.7,
  },
  pillLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
  },
  shareIcon: {
    position: 'relative',
  },
  shareLine: {
    position: 'absolute',
    left: 6,
    width: 8,
    height: 2,
    borderRadius: 999,
  },
  shareLineTop: {
    top: 5,
    transform: [{ rotate: '-24deg' }],
  },
  shareLineBottom: {
    top: 10,
    transform: [{ rotate: '24deg' }],
  },
  shareDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 4,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  shareDotLeft: {
    left: 0,
    top: 6,
  },
  shareDotTop: {
    right: 0,
    top: 1,
  },
  shareDotBottom: {
    right: 0,
    bottom: 1,
  },
});
