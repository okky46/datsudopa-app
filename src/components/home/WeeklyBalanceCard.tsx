
import { StyleSheet, Text, View } from 'react-native';
import { homeCopy } from '../../constants/copy';
import { colors, fontFamily, radius, spacing, typography } from '../../constants/theme';
import { WeeklyBalance } from '../../services/StatsService';
import { Card } from '../ui/Card';

type Props = {
  balance: WeeklyBalance;
};

function HourglassGlyph({ color }: { color: string }) {
  return (
    <View style={styles.hourglass}>
      <View style={[styles.hourglassCap, { backgroundColor: color }]} />
      <View style={[styles.hourglassTop, { borderTopColor: color }]} />
      <View style={[styles.hourglassBottom, { borderBottomColor: color }]} />
      <View style={[styles.hourglassCap, { backgroundColor: color }]} />
    </View>
  );
}

function LeafGlyph({ color }: { color: string }) {
  return (
    <View style={styles.leafWrap}>
      <View style={[styles.leaf, { backgroundColor: color }]} />
      <View style={[styles.leafStem, { backgroundColor: color }]} />
    </View>
  );
}

export function WeeklyBalanceCard({ balance }: Props) {
  return (
    <Card style={styles.card}>
      <Text style={styles.heading}>{homeCopy.weeklyTitle}</Text>

      <View style={styles.row}>
        <View style={[styles.iconBadge, { backgroundColor: colors.dangerSoft }]}>
          <HourglassGlyph color={colors.danger} />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowLabel}>{homeCopy.weeklyFailedLabel}</Text>
          <Text style={[styles.rowValue, { color: colors.danger }]}>
            {balance.failedMinutes}
            <Text style={styles.rowUnit}>分</Text>
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.row}>
        <View style={[styles.iconBadge, { backgroundColor: colors.accentSoft }]}>
          <LeafGlyph color={colors.accent} />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowLabel}>{homeCopy.weeklyReclaimedLabel}</Text>
          <Text style={[styles.rowValue, { color: colors.accent }]}>
            {balance.reclaimedMinutes}
            <Text style={styles.rowUnit}>分</Text>
          </Text>
        </View>
      </View>

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
    gap: spacing.md,
  },
  heading: {
    color: colors.textMuted,
    ...typography.label,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: fontFamily.bold,
  },
  rowValue: {
    fontSize: 30,
    fontWeight: '800',
    fontFamily: fontFamily.black,
    letterSpacing: -0.6,
    fontVariant: ['tabular-nums'],
  },
  rowUnit: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
    letterSpacing: 0,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  projection: {
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
    fontFamily: fontFamily.black,
  },
  hourglass: {
    width: 16,
    alignItems: 'center',
    gap: 1,
  },
  hourglassCap: {
    width: 14,
    height: 2,
    borderRadius: 2,
  },
  hourglassTop: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  hourglassBottom: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  leafWrap: {
    alignItems: 'center',
  },
  leaf: {
    width: 12,
    height: 16,
    borderTopLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderTopRightRadius: 3,
    borderBottomLeftRadius: 3,
  },
  leafStem: {
    width: 2,
    height: 4,
    borderRadius: 2,
    marginTop: 1,
  },
});
