
import { StyleSheet, Text, View } from 'react-native';
import { homeCopy } from '../../constants/copy';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { WeeklyBalance } from '../../services/StatsService';
import { Card } from '../ui/Card';

type Props = {
  balance: WeeklyBalance;
};

function BalanceRow({ label, minutes, color }: { label: string; minutes: number; color: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, { color }]}>
        {minutes}
        <Text style={styles.rowUnit}>分</Text>
      </Text>
    </View>
  );
}

export function WeeklyBalanceCard({ balance }: Props) {
  return (
    <Card style={styles.card}>
      <Text style={styles.heading}>{homeCopy.weeklyTitle}</Text>

      <BalanceRow label={homeCopy.weeklyFailedLabel} minutes={balance.failedMinutes} color={colors.danger} />
      <View style={styles.divider} />
      <BalanceRow label={homeCopy.weeklyReclaimedLabel} minutes={balance.reclaimedMinutes} color={colors.accent} />

      <View style={styles.projection}>
        <Text style={styles.projectionText}>
          {homeCopy.weeklyProjectionPrefix}
          <Text style={styles.projectionStrong}>{balance.projectionLabel}</Text>
          {homeCopy.weeklyProjectionSuffix}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  heading: {
    color: colors.textMuted,
    ...typography.label,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  rowLabel: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  rowValue: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.6,
    fontVariant: ['tabular-nums'],
  },
  rowUnit: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  projection: {
    marginTop: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
  },
  projectionText: {
    color: colors.textMuted,
    ...typography.caption,
    textAlign: 'center',
  },
  projectionStrong: {
    color: colors.accent,
    fontWeight: '800',
  },
});
