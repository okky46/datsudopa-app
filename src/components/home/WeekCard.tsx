
// 連続脱ドパ日数 + 今週の履歴。日ごとの状態は
// レイド完走（ゴールド）/ 途中離脱（ローズ）/ ロングのみ（セージ）/ なし（薄枠）で示す。

import { StyleSheet, Text, View } from 'react-native';
import { homeCopy } from '../../constants/copy';
import { colors, fontFamily, radius, spacing } from '../../constants/theme';
import { DayHistory } from '../../types/session';

type Props = {
  streakDays: number;
  week: DayHistory[];
};

const WEEKDAY_LABELS = ['月', '火', '水', '木', '金', '土', '日'];

function dayColor(status: DayHistory['status']): string | null {
  switch (status) {
    case 'raid_completed':
      return colors.primary;
    case 'raid_exited':
      return colors.danger;
    case 'long_only':
      return colors.accent;
    default:
      return null;
  }
}

export function WeekCard({ streakDays, week }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.streakRow}>
        <Text style={styles.label}>{homeCopy.streakLabel}</Text>
        {streakDays > 0 ? (
          <Text style={styles.streakValue}>
            {streakDays}
            <Text style={styles.streakUnit}>{homeCopy.streakUnit}</Text>
          </Text>
        ) : (
          <Text style={styles.streakNone}>{homeCopy.streakNone}</Text>
        )}
      </View>

      <View style={styles.weekRow}>
        {week.map((day, index) => {
          const color = dayColor(day.status);
          return (
            <View key={day.dateKey} style={styles.dayCell}>
              <View
                style={[
                  styles.dayDot,
                  color ? { backgroundColor: color, borderColor: color } : null,
                  day.isToday && styles.dayDotToday,
                  day.isFuture && styles.dayDotFuture,
                ]}
              />
              <Text style={[styles.dayLabel, day.isToday && styles.dayLabelToday]}>{WEEKDAY_LABELS[index]}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.legendRow}>
        <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
        <Text style={styles.legendText}>{homeCopy.weekLegendRaid}</Text>
        <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
        <Text style={styles.legendText}>{homeCopy.weekLegendExited}</Text>
        <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
        <Text style={styles.legendText}>{homeCopy.weekLegendLong}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fontFamily.medium,
  },
  streakValue: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  streakUnit: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: fontFamily.medium,
  },
  streakNone: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fontFamily.medium,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCell: {
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  dayDot: {
    width: 16,
    height: 16,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: 'transparent',
  },
  dayDotToday: {
    borderWidth: 2,
    borderColor: colors.primaryBorder,
  },
  dayDotFuture: {
    opacity: 0.35,
  },
  dayLabel: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '500',
    fontFamily: fontFamily.medium,
  },
  dayLabelToday: {
    color: colors.primary,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: radius.pill,
  },
  legendText: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: '500',
    fontFamily: fontFamily.medium,
    marginRight: spacing.xs,
  },
});
