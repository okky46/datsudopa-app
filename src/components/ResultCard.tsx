
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';
import { DailyResult } from '../types/result';
import { formatSeconds } from '../utils/date';

type Props = {
  result: DailyResult;
};

export function ResultCard({ result }: Props) {
  const statusLabel = result.status === 'completed' ? '完走' : result.status === 'missed' ? '未参加' : '失敗';

  return (
    <View style={styles.card}>
      <Text style={styles.caption}>RESULT</Text>
      <Text style={styles.status}>{statusLabel}</Text>
      <Text style={styles.score}>ドパガキ度 {result.dopamineScore}%</Text>
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
    fontSize: 11,
    letterSpacing: 1.8,
  },
  status: {
    color: colors.text,
    fontSize: 42,
    fontWeight: '800',
  },
  score: {
    color: colors.blue,
    fontSize: 18,
    fontWeight: '700',
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
