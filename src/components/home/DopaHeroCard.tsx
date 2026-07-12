
import { StyleSheet, Text, View } from 'react-native';
import { homeCopy } from '../../constants/copy';
import { colors, fontFamily, gradientBar, gradientWash, radius, spacing } from '../../constants/theme';
import { DopamineDeltas } from '../../types/dopamine';
import { SoftGradient } from '../ui/SoftGradient';

type Props = {
  level: number;
  deltas: DopamineDeltas;
  titleName: string;
};

function deltaText(value: number | null): string {
  if (value === null) {
    return '—';
  }
  if (value > 0) {
    return `+${value}%`;
  }
  if (value < 0) {
    return `${value}%`;
  }
  return '±0%';
}

function deltaColor(value: number | null): string {
  if (value === null || value === 0) {
    return colors.textSubtle;
  }
  // ドパガキ度は下がるほど良い
  return value < 0 ? colors.accent : colors.danger;
}

function DeltaCell({ label, value }: { label: string; value: number | null }) {
  return (
    <View style={styles.deltaCell}>
      <Text style={styles.deltaLabel}>{label}</Text>
      <Text style={[styles.deltaValue, { color: deltaColor(value) }]}>{deltaText(value)}</Text>
    </View>
  );
}

export function DopaHeroCard({ level, deltas, titleName }: Props) {
  const fill = Math.max(6, Math.min(100, level));

  return (
    <View style={styles.card}>
      <SoftGradient colors={gradientWash} direction="vertical" borderRadius={radius.xl} style={StyleSheet.absoluteFill} />

      <Text style={styles.scoreLabel}>{homeCopy.scoreLabel}</Text>
      <View style={styles.scoreRow}>
        <Text style={styles.score}>{level}</Text>
        <Text style={styles.percent}>%</Text>
      </View>

      <View style={styles.barTrack}>
        <SoftGradient colors={gradientBar} direction="horizontal" borderRadius={radius.pill} style={{ width: `${fill}%`, height: '100%' }} />
      </View>

      <View style={styles.deltaRow}>
        <DeltaCell label={homeCopy.deltaYesterday} value={deltas.vsYesterday} />
        <View style={styles.deltaDivider} />
        <DeltaCell label={homeCopy.deltaLastWeek} value={deltas.vsLastWeek} />
        <View style={styles.deltaDivider} />
        <DeltaCell label={homeCopy.deltaLastMonth} value={deltas.vsLastMonth} />
      </View>

      <View style={styles.titleCapsule} accessibilityLabel={`${homeCopy.titleLabel} ${titleName}`}>
        <Text style={styles.titleText} numberOfLines={1}>
          「{titleName}」
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    paddingTop: 26,
    paddingHorizontal: spacing.lg,
    paddingBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 106, 0.22)',
  },
  scoreLabel: {
    color: '#B7A98C',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
    letterSpacing: 3,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  score: {
    color: colors.text,
    fontSize: 74,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
    letterSpacing: -3,
    lineHeight: 80,
    textShadowColor: 'rgba(201, 169, 106, 0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 24,
  },
  percent: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '500',
    fontFamily: fontFamily.medium,
    marginTop: 14,
    marginLeft: 4,
  },
  barTrack: {
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
    marginTop: 20,
    marginHorizontal: 2,
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  deltaCell: {
    flex: 1,
    alignItems: 'center',
  },
  deltaDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  deltaLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '500',
    fontFamily: fontFamily.medium,
  },
  deltaValue: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  titleCapsule: {
    marginTop: 18,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(201, 169, 106, 0.28)',
    maxWidth: '96%',
  },
  titleText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
  },
});
