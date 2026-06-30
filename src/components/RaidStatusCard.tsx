
import { StyleSheet, Text, View } from 'react-native';
import { englishLabels } from '../constants/copy';
import { colors, radius, spacing, typography } from '../constants/theme';
import { RaidStatusView } from '../types/raid';
import { PrimaryButton } from './PrimaryButton';

type Props = {
  raidStatus: RaidStatusView;
  raidTime: string;
  onStart: () => void;
};

export function RaidStatusCard({ raidStatus, raidTime, onStart }: Props) {
  const devCanStart = __DEV__ && raidStatus.status !== 'completed' && raidStatus.status !== 'failed';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.caption}>{englishLabels.dailyRaid}</Text>
        <Text style={styles.badge}>{raidStatus.label}</Text>
      </View>
      <Text style={styles.time}>{raidTime}</Text>
      <Text style={styles.body}>{raidStatus.remainingText}</Text>
      <PrimaryButton
        label={raidStatus.canStart ? '脱ドパレイド開始' : devCanStart ? 'MVP確認用にレイド開始' : '開始時間を待つ'}
        onPress={onStart}
        disabled={!raidStatus.canStart && !devCanStart}
      />
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
    backgroundColor: colors.cardStrong,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  caption: {
    color: colors.textSubtle,
    ...typography.englishLabel,
  },
  badge: {
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    color: colors.text,
    backgroundColor: colors.accentSoft,
  },
  time: {
    color: colors.text,
    fontSize: 38,
    fontWeight: '800',
    letterSpacing: -1,
  },
  body: {
    color: colors.textMuted,
  },
});
