
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';
import { DailyResult } from '../types/result';

type Props = {
  results: DailyResult[];
};

export function HistoryList({ results }: Props) {
  const latest = results.slice(0, 7);

  return (
    <View style={styles.card}>
      <Text style={styles.caption}>直近7日</Text>
      {latest.length === 0 ? (
        <Text style={styles.empty}>まだ記録はありません。通知を見た時点で、もう始まります。</Text>
      ) : (
        latest.map((result) => (
          <View key={result.date + result.mode} style={styles.row}>
            <Text style={styles.date}>{result.date.slice(5)}</Text>
            <Text style={styles.title}>{result.title}</Text>
            <Text style={styles.score}>{result.dopamineScore}%</Text>
          </View>
        ))
      )}
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
    fontSize: 12,
    letterSpacing: 1.4,
  },
  empty: {
    color: colors.textMuted,
    lineHeight: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  date: {
    width: 48,
    color: colors.textSubtle,
  },
  title: {
    flex: 1,
    color: colors.text,
  },
  score: {
    color: colors.blue,
    fontWeight: '700',
  },
});
