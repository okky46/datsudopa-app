import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../constants/theme';
import { DailyResult } from '../types/result';
import { resultStatusLabel } from '../utils/resultLabels';

type Props = {
  results: DailyResult[];
};

function scoreColor(score: number): string {
  if (score <= 40) return colors.success;
  if (score <= 75) return colors.textMuted;
  return colors.danger;
}

function historyLabel(result: DailyResult): string {
  if (result.mode === 'normal') {
    return result.status === 'completed' ? 'ロング完走' : 'ロング中断';
  }
  return resultStatusLabel(result);
}

export function HistoryList({ results }: Props) {
  const latest = results.slice(0, 7);

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>脱ドパ記録</Text>
      {latest.length === 0 ? (
        <Text style={styles.empty}>まだ記録はない。</Text>
      ) : (
        <View style={styles.list}>
          {latest.map((result) => (
            <View key={result.date + result.mode} style={styles.row}>
              <Text style={styles.date}>{result.date.slice(5).replace('-', '/')}</Text>
              <Text style={styles.title} numberOfLines={1}>
                {historyLabel(result)}
              </Text>
              <Text style={[styles.score, { color: scoreColor(result.dopamineScore) }]}>{result.dopamineScore}%</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  heading: {
    color: colors.textSubtle,
    ...typography.label,
  },
  empty: {
    color: colors.textSubtle,
    ...typography.caption,
  },
  list: {
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  date: {
    width: 44,
    color: colors.textSubtle,
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  title: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 14,
  },
  score: {
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
