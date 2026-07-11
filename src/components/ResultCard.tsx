
import { StyleSheet, Text, View } from 'react-native';
import { resultCopy } from '../constants/copy';
import { colors, radius, shadows, spacing, typography } from '../constants/theme';
import { DailyResult } from '../types/result';
import { resultStatusLabel } from '../utils/resultLabels';
import { dopamineScoreColor } from '../utils/score';
import { CheckBadge, Confetti, LaurelLeaves, Sparkle } from './ui/Decorations';
import { PastelWash } from './ui/PastelWash';

type Props = {
  result: DailyResult;
  // 現在の持続ドパガキ度と、このセッションでの増減
  level: number;
  levelDelta: number | null;
};

function headlineLabel(result: DailyResult): string {
  if (result.status === 'completed') return '完走';
  if (result.status === 'missed') return '未参加';
  return resultStatusLabel(result);
}

function reclaimedLabel(watchedSeconds: number): { value: string; unit: string } {
  if (watchedSeconds < 60) {
    return { value: String(Math.max(0, watchedSeconds)), unit: '秒' };
  }
  return { value: String(Math.floor(watchedSeconds / 60)), unit: '分' };
}

function deltaBadgeText(delta: number | null): string | null {
  if (delta === null) {
    return null;
  }
  if (delta > 0) return `+${delta}%`;
  if (delta < 0) return `${delta}%`;
  return '±0%';
}

export function ResultCard({ result, level, levelDelta }: Props) {
  const completed = result.status === 'completed';
  const watched = completed ? result.targetSeconds : result.watchedSeconds;
  const reclaimed = reclaimedLabel(watched);
  const scoreColor = dopamineScoreColor(level);
  const deltaText = deltaBadgeText(levelDelta);
  const deltaGood = (levelDelta ?? 0) < 0;

  return (
    <View style={styles.card}>
      <PastelWash borderRadius={radius.xl} variant="result" />
      {completed && <Confetti />}

      <View style={styles.badgeRow}>
        <LaurelLeaves />
        <View style={styles.badgeCenter}>
          {completed ? (
            <CheckBadge size={64} />
          ) : (
            <View style={styles.neutralBadge}>
              <View style={styles.neutralDot} />
            </View>
          )}
        </View>
        <LaurelLeaves />
      </View>

      <Text style={styles.headline}>{headlineLabel(result)}</Text>

      <View style={styles.divider} />

      <Text style={styles.metricLabel}>{resultCopy.reclaimedLabel}</Text>
      <View style={styles.metricRow}>
        <Text style={[styles.metricValue, { color: colors.accent }]}>{reclaimed.value}</Text>
        <Text style={[styles.metricUnit, { color: colors.accent }]}>{reclaimed.unit}</Text>
        {completed && <Sparkle size={15} style={styles.metricSparkle} />}
      </View>

      <Text style={[styles.metricLabel, styles.scoreGap]}>{resultCopy.scoreLabel}</Text>
      <View style={styles.metricRow}>
        <Text style={[styles.score, { color: scoreColor }]}>{level}</Text>
        <Text style={[styles.scorePercent, { color: scoreColor }]}>%</Text>
        {deltaText && (
          <View style={[styles.deltaBadge, deltaGood ? styles.deltaBadgeGood : styles.deltaBadgeBad]}>
            <Text style={[styles.deltaBadgeText, { color: deltaGood ? colors.accent : colors.danger }]}>{deltaText}</Text>
          </View>
        )}
      </View>

      <Text style={styles.titleLabel}>称号</Text>
      <View style={styles.titleCapsule}>
        <Text style={styles.titleText} numberOfLines={1}>
          {result.title}
        </Text>
        <Sparkle size={12} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    ...shadows.hero,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  badgeCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  neutralBadge: {
    width: 64,
    height: 64,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  neutralDot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: colors.textSubtle,
  },
  headline: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: spacing.md,
  },
  divider: {
    width: '70%',
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderStrong,
    marginVertical: spacing.lg,
  },
  metricLabel: {
    color: colors.textMuted,
    ...typography.label,
  },
  scoreGap: {
    marginTop: spacing.lg,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  metricValue: {
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1.5,
    lineHeight: 52,
    fontVariant: ['tabular-nums'],
  },
  metricUnit: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 22,
    marginLeft: 2,
  },
  metricSparkle: {
    marginTop: 4,
    marginLeft: 4,
  },
  score: {
    fontSize: 56,
    fontWeight: '800',
    letterSpacing: -2,
    lineHeight: 60,
    fontVariant: ['tabular-nums'],
  },
  scorePercent: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 8,
    marginLeft: 2,
  },
  deltaBadge: {
    marginTop: 16,
    marginLeft: spacing.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  deltaBadgeGood: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentBorder,
  },
  deltaBadgeBad: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.dangerBorder,
  },
  deltaBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  titleLabel: {
    color: colors.textSubtle,
    ...typography.label,
    marginTop: spacing.lg,
  },
  titleCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 1,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  titleText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
});
