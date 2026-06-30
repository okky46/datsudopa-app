import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../constants/theme';
import { RaidStatusView } from '../types/raid';
import { Card } from './ui/Card';
import { PrimaryButton } from './PrimaryButton';

type Props = {
  raidStatus: RaidStatusView;
  onStart: () => void;
};

export function RaidStatusCard({ raidStatus, onStart }: Props) {
  const devCanStart = __DEV__ && raidStatus.status !== 'completed' && raidStatus.status !== 'failed';
  const active = raidStatus.canStart || devCanStart;
  const urgent = raidStatus.status === 'available';
  const statusHint = urgent
    ? 'みんなもう、余白のあるロングを見ています。'
    : raidStatus.status === 'not_started'
      ? '同じ時間帯の人と、ある程度そろって集合します。'
      : '今日の耐久結果として、レイド記録に残ります。';

  return (
    <Card style={[styles.card, urgent && styles.cardUrgent]}>
      <View style={styles.top}>
        <View style={styles.left}>
          <Text style={styles.label}>今日のレイド</Text>
          <Text style={styles.time}>{raidStatus.raidTime}</Text>
          <Text style={styles.concept}>毎日一回、余白のあるロングに集合。</Text>
          {urgent ? (
            <>
              <Text style={styles.urgentLabel}>3分以内に参加</Text>
              <Text style={styles.remainingUrgent}>{raidStatus.remainingText}</Text>
              <Text style={styles.hint}>過ぎると未参加になります</Text>
            </>
          ) : (
            <Text style={styles.remaining}>{raidStatus.remainingText}</Text>
          )}
        </View>
        <View style={[styles.badge, active && styles.badgeActive, urgent && styles.badgeUrgent]}>
          <View style={[styles.dot, active && styles.dotActive, urgent && styles.dotUrgent]} />
          <Text style={[styles.badgeText, active && styles.badgeTextActive, urgent && styles.badgeTextUrgent]}>
            {raidStatus.label}
          </Text>
        </View>
      </View>
      <View style={styles.raidMeta}>
        <View style={styles.metaItem}>
          <Text style={styles.metaValue}>{urgent ? '集合中' : '--'}</Text>
          <Text style={styles.metaLabel}>同時参加中</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaValue}>--</Text>
          <Text style={styles.metaLabel}>完走者</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaValue}>--</Text>
          <Text style={styles.metaLabel}>未完了者</Text>
        </View>
      </View>
      <Text style={styles.statusHint}>{statusHint}</Text>
      <PrimaryButton
        label={raidStatus.canStart ? 'レイドに参加' : devCanStart ? 'レイド開始（確認用）' : '集合を待つ'}
        onPress={onStart}
        disabled={!active}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    backgroundColor: colors.cardStrong,
    borderColor: colors.border,
    borderWidth: 1.5,
  },
  cardUrgent: {
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentSoft,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  left: {
    gap: 2,
    flex: 1,
    paddingRight: spacing.sm,
  },
  label: {
    color: colors.textSubtle,
    ...typography.label,
  },
  time: {
    color: colors.text,
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  concept: {
    color: colors.textMuted,
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  urgentLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  remainingUrgent: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  hint: {
    color: colors.textMuted,
    ...typography.caption,
  },
  remaining: {
    color: colors.textMuted,
    ...typography.caption,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentBorder,
  },
  badgeUrgent: {
    backgroundColor: colors.surface,
    borderColor: colors.accent,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: colors.textSubtle,
  },
  dotActive: {
    backgroundColor: colors.accent,
  },
  dotUrgent: {
    backgroundColor: colors.danger,
  },
  badgeText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  badgeTextActive: {
    color: colors.text,
  },
  badgeTextUrgent: {
    color: colors.text,
  },
  raidMeta: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  metaItem: {
    flex: 1,
    gap: 2,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metaValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  metaLabel: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '700',
  },
  statusHint: {
    color: colors.textMuted,
    ...typography.caption,
    marginTop: -spacing.sm,
  },
});
