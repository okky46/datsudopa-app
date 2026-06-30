
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../constants/theme';
import { DailyResult } from '../types/result';
import { dopamineScoreColor, getDailyComment, getDailyTitle } from '../utils/score';
import { Card } from './ui/Card';
import { ShareButton } from './ShareButton';

type Props = {
  score: number;
  nickname: string;
  result?: DailyResult | null;
  compact?: boolean;
};

export function DopamineScoreCard({ score, nickname, result, compact = false }: Props) {
  const displayName = (nickname ?? '').trim() || '名無しのドパガキ';
  const title = result?.title || getDailyTitle(score);
  const comment = result?.comment || getDailyComment(score);
  const scoreColor = dopamineScoreColor(score);

  return (
    <Card variant={compact ? 'default' : 'hero'} style={[styles.card, compact && styles.cardCompact]}>
      <View style={[styles.header, compact && styles.headerCompact]}>
        <Text style={styles.owner}>{displayName}</Text>
        <ShareButton result={result} variant="inline" />
      </View>

      <Text style={styles.label}>レイド後のドパガキ度</Text>
      <View style={styles.scoreRow}>
        <Text style={[styles.score, compact && styles.scoreCompact, { color: scoreColor }]}>{score}</Text>
        <Text style={[styles.percent, compact && styles.percentCompact, { color: scoreColor }]}>%</Text>
      </View>

      <View style={styles.meta}>
        <Text style={[styles.title, compact && styles.titleCompact]} numberOfLines={compact ? 1 : undefined}>
          {title}
        </Text>
        {!compact && <Text style={styles.comment}>{comment}</Text>}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xs,
  },
  cardCompact: {
    gap: 2,
    paddingVertical: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerCompact: {
    marginBottom: spacing.xs,
  },
  owner: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  label: {
    color: colors.textSubtle,
    ...typography.label,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  score: {
    color: colors.text,
    ...typography.score,
  },
  scoreCompact: {
    fontSize: 52,
    letterSpacing: -2,
  },
  percent: {
    color: colors.textSubtle,
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 14,
    marginLeft: 2,
  },
  percentCompact: {
    fontSize: 22,
    marginBottom: 8,
  },
  meta: {
    gap: 4,
  },
  title: {
    color: colors.text,
    ...typography.h2,
  },
  titleCompact: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  comment: {
    color: colors.textMuted,
    ...typography.body,
  },
});
