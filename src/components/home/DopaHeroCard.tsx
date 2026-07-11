
import { StyleSheet, Text, View } from 'react-native';
import { homeCopy } from '../../constants/copy';
import { colors, gradientBar, radius, shadows, spacing, typography } from '../../constants/theme';
import { DopamineDeltas } from '../../types/dopamine';
import { RaidStatusView } from '../../types/raid';
import { dopamineScoreColor } from '../../utils/score';
import { PrimaryButton } from '../PrimaryButton';
import { ShareGlyph } from '../ShareButton';
import { PastelWash } from '../ui/PastelWash';
import { PressableScale } from '../ui/Motion';
import { SoftGradient } from '../ui/SoftGradient';

type Props = {
  level: number;
  deltas: DopamineDeltas;
  titleName: string;
  raidStatus: RaidStatusView;
  onStart: () => void;
  onShare: () => void;
};

function ClockGlyph({ color }: { color: string }) {
  return (
    <View style={[styles.clock, { borderColor: color }]}>
      <View style={[styles.clockHandV, { backgroundColor: color }]} />
      <View style={[styles.clockHandH, { backgroundColor: color }]} />
    </View>
  );
}

function deltaText(value: number | null): string {
  if (value === null) {
    return '—';
  }
  if (value > 0) {
    return `+${value}%`;
  }
  if (value < 0) {
    return `${value}%`;
  }
  return '±0%';
}

function deltaColor(value: number | null): string {
  if (value === null || value === 0) {
    return colors.textSubtle;
  }
  // ドパガキ度は下がるほど良い
  return value < 0 ? colors.accent : colors.danger;
}

function DeltaCell({ label, value }: { label: string; value: number | null }) {
  return (
    <Text style={styles.deltaCell}>
      {label} <Text style={[styles.deltaValue, { color: deltaColor(value) }]}>{deltaText(value)}</Text>
    </Text>
  );
}

export function DopaHeroCard({ level, deltas, titleName, raidStatus, onStart, onShare }: Props) {
  const devCanStart = __DEV__ && raidStatus.status !== 'completed' && raidStatus.status !== 'failed';
  const active = raidStatus.canStart || devCanStart;
  const completed = raidStatus.status === 'completed';
  const fill = Math.max(6, Math.min(100, level));
  const scoreColor = dopamineScoreColor(level);
  const buttonLabel = raidStatus.canStart ? '参加する' : 'レイド開始（確認用）';

  return (
    <View style={styles.card}>
      <PastelWash borderRadius={radius.xl} variant="home" />

      <Text style={styles.scoreLabel}>{homeCopy.scoreLabel}</Text>
      <View style={styles.scoreRow}>
        <Text style={[styles.score, { color: scoreColor }]}>{level}</Text>
        <Text style={[styles.percent, { color: scoreColor }]}>%</Text>
      </View>

      <View style={styles.barTrack}>
        <SoftGradient
          colors={gradientBar}
          direction="horizontal"
          borderRadius={radius.pill}
          style={{ width: `${fill}%`, height: '100%' }}
        />
      </View>

      <View style={styles.deltaRow}>
        <DeltaCell label={homeCopy.deltaYesterday} value={deltas.vsYesterday} />
        <DeltaCell label={homeCopy.deltaLastWeek} value={deltas.vsLastWeek} />
        <DeltaCell label={homeCopy.deltaLastMonth} value={deltas.vsLastMonth} />
      </View>

      <View style={styles.titleRow}>
        <View style={styles.titleCapsule}>
          <Text style={styles.titleText} numberOfLines={1}>
            「{titleName}」
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.raidRow}>
        <ClockGlyph color={completed ? colors.accent : colors.textMuted} />
        <View style={styles.raidTextWrap}>
          <Text style={styles.raidLine}>
            今日のレイド <Text style={styles.raidTime}>{raidStatus.raidTime}</Text>
          </Text>
          <Text style={[styles.raidSub, completed && styles.raidSubCompleted]}>{raidStatus.remainingText}</Text>
        </View>
        {active && <PrimaryButton label={buttonLabel} onPress={onStart} style={styles.joinButton} />}
      </View>

      <PressableScale accessibilityRole="button" accessibilityLabel={homeCopy.shareLabel} onPress={onShare} style={styles.shareLink}>
        <ShareGlyph color={colors.textMuted} size={14} />
        <Text style={styles.shareLabel}>{homeCopy.shareLabel}</Text>
      </PressableScale>
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
    ...typography.score,
    lineHeight: 82,
  },
  percent: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 14,
    marginLeft: 4,
  },
  barTrack: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(46, 52, 80, 0.07)',
    overflow: 'hidden',
    marginTop: spacing.sm,
    marginHorizontal: spacing.xs,
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  deltaCell: {
    color: colors.textSubtle,
    fontSize: 12.5,
    fontWeight: '600',
  },
  deltaValue: {
    fontSize: 14,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  titleRow: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  titleCapsule: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    maxWidth: '92%',
  },
  titleText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderStrong,
    marginTop: spacing.md,
    marginHorizontal: -spacing.lg,
  },
  raidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  raidTextWrap: {
    flex: 1,
    gap: 2,
  },
  raidLine: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
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
  raidSubCompleted: {
    color: colors.accent,
    fontWeight: '600',
  },
  joinButton: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
  },
  shareLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    minHeight: 40,
    paddingHorizontal: spacing.sm,
  },
  shareLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
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
