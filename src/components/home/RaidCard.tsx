
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, gradientPlay, radius, spacing } from '../../constants/theme';
import { RaidStatusView } from '../../types/raid';
import { SoftGradient } from '../ui/SoftGradient';

type Props = {
  raidStatus: RaidStatusView;
  onStart: () => void;
};

export function RaidCard({ raidStatus, onStart }: Props) {
  const devCanStart = __DEV__ && raidStatus.status !== 'completed' && raidStatus.status !== 'failed';
  const active = raidStatus.canStart || devCanStart;
  const buttonLabel = raidStatus.canStart ? '参加' : devCanStart ? '確認用' : '参加';

  return (
    <View style={styles.card}>
      <View style={styles.textWrap}>
        <Text style={styles.label}>今日のレイド</Text>
        <Text style={styles.line}>
          {raidStatus.raidTime} <Text style={styles.sub}>{raidStatus.remainingText}</Text>
        </Text>
      </View>

      {active && (
        <Pressable accessibilityRole="button" onPress={onStart} style={({ pressed }) => [styles.joinButton, pressed && styles.pressed]}>
          <SoftGradient colors={gradientPlay} direction="horizontal" borderRadius={radius.pill} style={StyleSheet.absoluteFill} />
          <Text style={styles.joinLabel}>{buttonLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fontFamily.medium,
  },
  line: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
    letterSpacing: 0.5,
  },
  sub: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
    fontFamily: fontFamily.medium,
  },
  joinButton: {
    minHeight: 40,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.85,
  },
  joinLabel: {
    color: colors.onPrimary,
    fontSize: 13,
    fontWeight: '800',
    fontFamily: fontFamily.black,
  },
});
