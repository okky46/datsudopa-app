
import { StyleSheet, Text, View } from 'react-native';
import { englishLabels } from '../constants/copy';
import { colors, radius, spacing, typography } from '../constants/theme';
import { DailyResult } from '../types/result';
import { getDailyComment, getDailyTitle } from '../utils/score';
import { ShareButton } from './ShareButton';

type Props = {
  score: number;
  nickname: string;
  result?: DailyResult | null;
};

export function DopamineScoreCard({ score, nickname, result }: Props) {
  const displayName = nickname.trim() || '名無しのドパガキ';

  return (
    <View style={styles.card}>
      <Text style={styles.caption}>{englishLabels.stimulationMeter}</Text>
      <Text style={styles.scoreOwner}>{displayName}のドパガキ度</Text>
      <Text style={styles.scoreHint}>脳内刺激の残りを、ざっくり%で表示しています</Text>
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
    ...typography.englishLabel,
  },
  scoreOwner: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  scoreHint: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
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
