
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows, spacing, typography } from '../constants/theme';
import { DailyResult } from '../types/result';
import { resultStatusLabel } from '../utils/resultLabels';
import { dopamineScoreColor } from '../utils/score';
import { CheckBadge, Confetti, LaurelLeaves, Sparkle } from './ui/Decorations';
import { PastelWash } from './ui/PastelWash';

type Props = {
  result: DailyResult;
};

function formatMMSS(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.max(0, totalSeconds % 60);
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function headlineLabel(result: DailyResult): string {
  if (result.status === 'completed') return '完走';
  if (result.status === 'missed') return '未参加';
  return resultStatusLabel(result);
}

export function ResultCard({ result }: Props) {
  const completed = result.status === 'completed';
  const watched = completed ? result.targetSeconds : result.watchedSeconds;
  const scoreColor = dopamineScoreColor(result.dopamineScore);

  return (
    <View style={styles.card}>
      <PastelWash borderRadius={radius.xl} variant="result" />
      <Confetti />

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
      <Text style={styles.time}>
        {formatMMSS(watched)} / {formatMMSS(result.targetSeconds)}
      </Text>

      <View style={styles.divider} />

      <Text style={styles.scoreLabel}>ドパガキ度</Text>
      <View style={styles.scoreRow}>
        <Text style={[styles.score, { color: scoreColor }]}>{result.dopamineScore}</Text>
        <Text style={[styles.percent, { color: scoreColor }]}>%</Text>
      </View>

      <Text style={styles.titleLabel}>称号</Text>
      <View style={styles.titleCapsule}>
        <Text style={styles.titleText} numberOfLines={1}>
          {result.title}
        </Text>
        <Sparkle size={12} />
      </View>

      <Text style={styles.brandMark}>脱ドパ</Text>
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
  time: {
    color: colors.textSubtle,
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  divider: {
    width: '70%',
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderStrong,
    marginVertical: spacing.lg,
  },
  scoreLabel: {
    color: colors.textMuted,
    ...typography.label,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  score: {
    color: colors.accent,
    fontSize: 56,
    fontWeight: '800',
    letterSpacing: -2,
    lineHeight: 60,
  },
  percent: {
    color: colors.accent,
    fontSize: 22,
    fontWeight: '700',
    marginTop: 8,
    marginLeft: 2,
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
    backgroundColor: colors.cardTranslucent,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  titleText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  brandMark: {
    color: colors.textFaint,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: spacing.lg,
  },
});
