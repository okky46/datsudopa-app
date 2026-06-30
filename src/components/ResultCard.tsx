
import { StyleSheet, Text, View } from 'react-native';
import { englishLabels } from '../constants/copy';
import { colors, radius, spacing, typography } from '../constants/theme';
import { DailyResult } from '../types/result';
import { formatSeconds } from '../utils/date';
import { calculateSessionMetrics } from '../utils/score';

type Props = {
  result: DailyResult;
};

export function ResultCard({ result }: Props) {
  const statusLabel = result.status === 'completed' ? '完走' : result.status === 'missed' ? '未参加' : '途中終了';
  const metrics = calculateSessionMetrics(result);
  const isLong = result.mode === 'normal';

  return (
    <View style={styles.card}>
      <Text style={styles.caption}>{isLong ? englishLabels.longSessionResult : englishLabels.latestResult}</Text>
      <Text style={styles.status}>{statusLabel}</Text>
      <Text style={styles.score}>{result.dopamineScore}%</Text>
      <Text style={styles.scoreLabel}>ドパガキ度（脳内刺激残量）</Text>

      {isLong && (
        <View style={styles.metrics}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{metrics.detoxRate}%</Text>
            <Text style={styles.metricLabel}>脱ドパ達成率</Text>
            <Text style={styles.metricHint}>目標時間のうち、どれだけ静かに過ごせたか</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{metrics.calmScore}</Text>
            <Text style={styles.metricLabel}>心の静けさスコア</Text>
            <Text style={styles.metricHint}>
              スマホを触らなかった{metrics.untouchedMinutes > 0 ? `${metrics.untouchedMinutes}分間` : '時間'}で落ち着いた度合い
            </Text>
          </View>
        </View>
      )}

      <Text style={styles.title}>{result.title}</Text>
      <Text style={styles.comment}>{result.comment}</Text>
      <View style={styles.stats}>
        <Text style={styles.stat}>視聴 {formatSeconds(result.watchedSeconds)}</Text>
        <Text style={styles.stat}>目標 {formatSeconds(result.targetSeconds)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  caption: {
    color: colors.textSubtle,
    ...typography.englishLabel,
  },
  status: {
    color: colors.text,
    fontSize: 42,
    fontWeight: '800',
  },
  score: {
    color: colors.blue,
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1,
  },
  scoreLabel: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  metrics: {
    gap: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  metricItem: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricValue: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
  },
  metricLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  metricHint: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  comment: {
    color: colors.textMuted,
    lineHeight: 22,
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  stat: {
    color: colors.textSubtle,
  },
});
