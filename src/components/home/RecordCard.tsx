
import { StyleSheet, Text, View } from 'react-native';
import { homeCopy } from '../../constants/copy';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { CalendarDay } from '../../services/StatsService';
import { Card } from '../ui/Card';

const WEEKDAY_LABELS = ['月', '火', '水', '木', '金', '土', '日'];

type Props = {
  streakDays: number;
  calendarLabel: string;
  weeks: (CalendarDay | null)[][];
};

function StampMark() {
  return (
    <View style={styles.stamp}>
      <View style={styles.stampCheckShort} />
      <View style={styles.stampCheckLong} />
    </View>
  );
}

export function RecordCard({ streakDays, calendarLabel, weeks }: Props) {
  return (
    <Card style={styles.card}>
      <Text style={styles.heading}>{homeCopy.recordTitle}</Text>

      <View style={styles.streakRow}>
        {streakDays > 0 ? (
          <Text style={styles.streakText}>
            <Text style={styles.streakNumber}>{streakDays}</Text>
            {homeCopy.streakSuffix}
          </Text>
        ) : (
          <Text style={styles.streakEmpty}>{homeCopy.streakNone}</Text>
        )}
      </View>

      <View style={styles.calendarHead}>
        <Text style={styles.monthLabel}>{calendarLabel}</Text>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAY_LABELS.map((label) => (
          <Text key={label} style={styles.weekdayLabel}>
            {label}
          </Text>
        ))}
      </View>

      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.weekRow}>
          {week.map((day, dayIndex) =>
            day ? (
              <View key={day.dateKey} style={[styles.dayCell, day.isToday && styles.dayCellToday]}>
                {day.stamped ? <StampMark /> : <Text style={styles.dayNumber}>{day.day}</Text>}
              </View>
            ) : (
              <View key={`blank-${weekIndex}-${dayIndex}`} style={styles.dayCell} />
            ),
          )}
        </View>
      ))}

      <Text style={styles.hint}>{homeCopy.calendarHint}</Text>
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
  },
  hint: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  streakRow: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
  },
  streakText: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '700',
  },
  streakNumber: {
    fontSize: 22,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  streakEmpty: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  calendarHead: {
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  monthLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
    paddingVertical: 2,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    maxHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    borderRadius: radius.pill,
  },
  dayNumber: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  stamp: {
    width: 26,
    height: 26,
    borderRadius: 999,
    backgroundColor: colors.pastelMint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampCheckShort: {
    position: 'absolute',
    left: 6.5,
    bottom: 10,
    width: 6,
    height: 2.4,
    borderRadius: 2,
    backgroundColor: colors.accent,
    transform: [{ rotate: '45deg' }],
  },
  stampCheckLong: {
    position: 'absolute',
    right: 5,
    bottom: 11,
    width: 11,
    height: 2.4,
    borderRadius: 2,
    backgroundColor: colors.accent,
    transform: [{ rotate: '-50deg' }],
  },
});
