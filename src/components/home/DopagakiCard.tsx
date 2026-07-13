
// ドパガキ度カード。数値 + ゴールドのスコアバー + エンタメ指標の注記のみ。

import { StyleSheet, Text, View } from 'react-native';
import { homeCopy } from '../../constants/copy';
import { colors, fontFamily, gradientBar, radius, spacing } from '../../constants/theme';
import { SoftGradient } from '../ui/SoftGradient';

type Props = {
  level: number;
};

export function DopagakiCard({ level }: Props) {
  const fill = Math.max(4, Math.min(100, level));

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.label}>{homeCopy.dopagakiLabel}</Text>
        <Text style={styles.value}>{level}</Text>
      </View>
      <View style={styles.barTrack}>
        <SoftGradient colors={gradientBar} direction="horizontal" borderRadius={radius.pill} style={{ width: `${fill}%`, height: '100%' }} />
      </View>
      <Text style={styles.note}>{homeCopy.dopagakiNote}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fontFamily.medium,
  },
  value: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  barTrack: {
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
  },
  note: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '500',
    fontFamily: fontFamily.medium,
  },
});
