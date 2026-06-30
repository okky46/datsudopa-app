
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../constants/theme';
import { DailyResult } from '../types/result';
import { formatSeconds } from '../utils/date';
import { calculateSessionMetrics } from '../utils/score';
import { resultStatusLabel } from '../utils/resultLabels';
import { Card } from './ui/Card';
import { RainbowAccent } from './ui/RainbowAccent';

type Props = {
  result: DailyResult;
};

export function ResultCard({ result }: Props) {
  const completed = result.status === 'completed';
  const statusLabel = resultStatusLabel(result);
  const metrics = calculateSessionMetrics(result);
  const isLong = result.mode === 'normal';
  const modeLabel = isLong ? '脱ドパロング自主練' : '本日の脱ドパレイド';
  const resultLine =
    result.status === 'completed'
      ? '虚無に' + formatSeconds(result.targetSeconds) + '耐えた'
      : result.status === 'missed'
        ? '未参加。3分以内に集合できなかった'
        : formatSeconds(result.watchedSeconds) + 'で中断';

  return (
    <Card variant="hero" style={styles.card}>
      <View style={styles.statusRow}>
        <View style={[styles.statusPill, completed && styles.statusPillDone]}>
          <Text style={[styles.statusText, completed && styles.statusTextDone]}>{statusLabel}</Text>
        </View>
        <Text style={styles.brand}>脱ドパ</Text>
      </View>

      <Text style={styles.modeLabel}>{modeLabel}</Text>
      <Text style={styles.resultLine}>{resultLine}</Text>

      <Text style={styles.scoreLabel}>今日のドパガキ度</Text>
      <View style={styles.scoreRow}>
        <Text style={styles.score}>{result.dopamineScore}</Text>
        <Text style={styles.percent}>%</Text>
      </View>
      {completed && <RainbowAccent height={6} style={styles.accent} />}

      <Text style={styles.title}>{result.title}</Text>
      <Text style={styles.comment}>{result.comment}</Text>

      {isLong && (
        <View style={styles.metrics}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{metrics.detoxRate}%</Text>
            <Text style={styles.metricLabel}>脱ドパ達成率</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{metrics.calmScore}</Text>
            <Text style={styles.metricLabel}>静けさスコア</Text>
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>耐久 {formatSeconds(result.watchedSeconds)}</Text>
        <Text style={styles.footerDot}>·</Text>
        <Text style={styles.footerText}>目標 {formatSeconds(result.targetSeconds)}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  statusPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusPillDone: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentBorder,
  },
  statusText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '800',
  },
  statusTextDone: {
    color: colors.text,
  },
  brand: {
    color: colors.textFaint,
    ...typography.brandMark,
    fontSize: 16,
  },
  modeLabel: {
    color: colors.textSubtle,
    ...typography.label,
  },
  resultLine: {
    color: colors.text,
    ...typography.h2,
    marginBottom: spacing.sm,
  },
  scoreLabel: {
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
  percent: {
    color: colors.textSubtle,
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 14,
    marginLeft: 2,
  },
  accent: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    width: '52%',
  },
  title: {
    color: colors.text,
    ...typography.h2,
    marginTop: spacing.xs,
  },
  comment: {
    color: colors.textMuted,
    ...typography.body,
  },
  metrics: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  metricItem: {
    flex: 1,
    gap: 2,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  metricValue: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
  },
  metricLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  footerText: {
    color: colors.textSubtle,
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  footerDot: {
    color: colors.textFaint,
  },
});
