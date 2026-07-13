
// ホームの主指標「累計脱ドパ時間」。gradientWash を敷いた主役カード。

import { StyleSheet, Text, View } from 'react-native';
import { homeCopy } from '../../constants/copy';
import { colors, fontFamily, gradientWash, radius, spacing } from '../../constants/theme';
import { formatDurationJa } from '../../utils/date';
import { SoftGradient } from '../ui/SoftGradient';

type Props = {
  totalSeconds: number;
};

export function TotalTimeCard({ totalSeconds }: Props) {
  return (
    <View style={styles.card}>
      <SoftGradient colors={gradientWash} direction="vertical" borderRadius={radius.xl} style={StyleSheet.absoluteFill} />
      <Text style={styles.label}>{homeCopy.totalLabel}</Text>
      <Text style={styles.value}>{formatDurationJa(totalSeconds)}</Text>
      <Text style={styles.sub}>{homeCopy.totalSub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    paddingVertical: 26,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 106, 0.22)',
  },
  label: {
    color: '#B7A98C',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
    letterSpacing: 3,
  },
  value: {
    color: colors.text,
    fontSize: 52,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
    letterSpacing: -2,
    lineHeight: 60,
    textShadowColor: 'rgba(201, 169, 106, 0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
  },
  sub: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fontFamily.medium,
  },
});
