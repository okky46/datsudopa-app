
import { StyleSheet, Text, View } from 'react-native';
import { colors, gradientBar, radius, shadows, spacing, typography } from '../constants/theme';
import { DailyResult } from '../types/result';
import { RaidStatusView } from '../types/raid';
import { dopamineScoreColor } from '../utils/score';
import { PrimaryButton } from './PrimaryButton';
import { ShareButton } from './ShareButton';
import { PastelWash } from './ui/PastelWash';
import { SoftGradient } from './ui/SoftGradient';

type Props = {
  score: number;
  raidStatus: RaidStatusView;
  result?: DailyResult | null;
  onStart: () => void;
};

function ClockGlyph({ color }: { color: string }) {
  return (
    <View style={[styles.clock, { borderColor: color }]}>
      <View style={[styles.clockHandV, { backgroundColor: color }]} />
      <View style={[styles.clockHandH, { backgroundColor: color }]} />
    </View>
  );
}

export function HomeHeroCard({ score, raidStatus, result, onStart }: Props) {
  const devCanStart = __DEV__ && raidStatus.status !== 'completed' && raidStatus.status !== 'failed';
  const active = raidStatus.canStart || devCanStart;
  const fill = Math.max(6, Math.min(100, score));
  const scoreColor = dopamineScoreColor(score);

  const buttonLabel = raidStatus.canStart ? 'レイドに参加' : devCanStart ? 'レイド開始（確認用）' : '集合を待つ';

  return (
    <View style={styles.card}>
      <PastelWash borderRadius={radius.xl} variant="home" />

      <Text style={styles.scoreLabel}>ドパガキ度</Text>
      <View style={styles.scoreRow}>
        <Text style={[styles.score, { color: scoreColor }]}>{score}</Text>
        <Text style={[styles.percent, { color: scoreColor }]}>%</Text>
      </View>

      <View style={styles.barTrack}>
        <SoftGradient colors={gradientBar} direction="horizontal" borderRadius={radius.pill} style={{ width: `${fill}%`, height: '100%' }} />
      </View>

      <View style={styles.raidBox}>
        <ClockGlyph color={colors.textMuted} />
        <View style={styles.raidTextWrap}>
          <Text style={styles.raidLine}>
            今日のレイド <Text style={styles.raidTime}>{raidStatus.raidTime}</Text>
          </Text>
          <Text style={styles.raidSub}>{raidStatus.remainingText}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <PrimaryButton label={`${buttonLabel}   ›`} onPress={onStart} disabled={!active} style={styles.joinButton} />
        <ShareButton result={result} variant="icon" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.hero,
  },
  scoreLabel: {
    color: colors.textMuted,
    textAlign: 'center',
    ...typography.label,
    marginTop: spacing.xs,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  score: {
    color: colors.text,
    fontSize: 74,
    fontWeight: '800',
    letterSpacing: -3,
    lineHeight: 80,
  },
  percent: {
    color: colors.textMuted,
    fontSize: 26,
    fontWeight: '700',
    marginTop: 14,
    marginLeft: 4,
  },
  barTrack: {
    height: 7,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(46, 52, 80, 0.07)',
    overflow: 'hidden',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  raidBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  raidTextWrap: {
    flex: 1,
    gap: 2,
  },
  raidLine: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  raidTime: {
    fontSize: 16,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  raidSub: {
    color: colors.textSubtle,
    fontSize: 13,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  joinButton: {
    flex: 1,
  },
  clock: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockHandV: {
    position: 'absolute',
    width: 2,
    height: 7,
    borderRadius: 2,
    top: 4,
  },
  clockHandH: {
    position: 'absolute',
    width: 6,
    height: 2,
    borderRadius: 2,
    top: 9,
    left: 9,
  },
});
