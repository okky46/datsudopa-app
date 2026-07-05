
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows, spacing, typography } from '../constants/theme';
import { DailyResult } from '../types/result';
import { formatSeconds } from '../utils/date';
import { resultStatusLabel } from '../utils/resultLabels';

type Props = {
  results: DailyResult[];
};

type StatusKind = 'completed' | 'interrupted' | 'missed';

function statusKind(result: DailyResult): StatusKind {
  if (result.status === 'completed') return 'completed';
  if (result.status === 'missed') return 'missed';
  return 'interrupted';
}

function historyLabel(result: DailyResult): string {
  if (result.status === 'completed') return '完走';
  if (result.status === 'missed') return '未参加';
  return result.mode === 'normal' ? '中断' : resultStatusLabel(result);
}

function StatusIcon({ kind }: { kind: StatusKind }) {
  if (kind === 'completed') {
    return (
      <View style={[styles.iconCircle, { borderColor: colors.accent }]}>
        <View style={styles.checkShort} />
        <View style={styles.checkLong} />
      </View>
    );
  }
  if (kind === 'interrupted') {
    return (
      <View style={[styles.iconCircle, { borderColor: colors.warning }]}>
        <View style={[styles.dot, { backgroundColor: colors.warning }]} />
      </View>
    );
  }
  return <View style={[styles.iconCircle, { borderColor: colors.textFaint }]} />;
}

export function HistoryList({ results }: Props) {
  const latest = results.slice(0, 5);

  return (
    <View style={styles.wrap}>
      <View style={styles.headRow}>
        <Text style={styles.heading}>最近の記録</Text>
      </View>

      <View style={styles.card}>
        {latest.length === 0 ? (
          <Text style={styles.empty}>まだ記録はない。</Text>
        ) : (
          latest.map((result, index) => {
            const kind = statusKind(result);
            const timeText =
              result.status === 'missed' ? '—' : formatSeconds(result.status === 'completed' ? result.targetSeconds : result.watchedSeconds);
            return (
              <View key={result.date + result.mode} style={[styles.row, index === latest.length - 1 && styles.rowLast]}>
                <Text style={styles.date}>{result.date.slice(5).replace('-', '/')}</Text>
                <View style={styles.statusCell}>
                  <StatusIcon kind={kind} />
                  <Text style={[styles.statusLabel, kind === 'completed' && { color: colors.accent }]}>{historyLabel(result)}</Text>
                </View>
                <Text style={styles.time}>{timeText}</Text>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  heading: {
    color: colors.textMuted,
    ...typography.label,
  },
  card: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  empty: {
    color: colors.textSubtle,
    ...typography.caption,
    paddingVertical: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  date: {
    width: 42,
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  statusCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusLabel: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  time: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  iconCircle: {
    width: 20,
    height: 20,
    borderRadius: 999,
    borderWidth: 1.6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  checkShort: {
    position: 'absolute',
    left: 4.5,
    bottom: 7,
    width: 4,
    height: 1.8,
    borderRadius: 2,
    backgroundColor: colors.accent,
    transform: [{ rotate: '45deg' }],
  },
  checkLong: {
    position: 'absolute',
    right: 3.5,
    bottom: 8,
    width: 8,
    height: 1.8,
    borderRadius: 2,
    backgroundColor: colors.accent,
    transform: [{ rotate: '-50deg' }],
  },
});
