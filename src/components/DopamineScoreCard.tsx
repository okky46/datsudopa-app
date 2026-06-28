
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';
import { DailyResult } from '../types/result';
import { getDailyComment, getDailyTitle } from '../utils/score';
import { ShareButton } from './ShareButton';

type Props = {
  score: number;
  result?: DailyResult | null;
};

export function DopamineScoreCard({ score, result }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.caption}>TODAY'S DOPAGAKI INDEX</Text>
      <View style={styles.row}>
        <Text style={styles.score}>{score}%</Text>
        <View style={styles.meta}>
          <Text style={styles.title}>{result?.title || getDailyTitle(score)}</Text>
          <Text style={styles.comment}>{result?.comment || getDailyComment(score)}</Text>
        </View>
      </View>
      <ShareButton result={result} compact />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  caption: {
    color: colors.textSubtle,
    fontSize: 11,
    letterSpacing: 1.6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  score: {
    color: colors.text,
    fontSize: 54,
    fontWeight: '800',
    letterSpacing: -2,
  },
  meta: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  comment: {
    color: colors.textMuted,
    lineHeight: 20,
  },
});
