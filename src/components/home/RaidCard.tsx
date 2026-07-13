
// ホーム最上部のレイドカード。次回22:00までのカウントダウン / 開始ボタン /
// 終了表示 / 追い脱ドパ導線を出す。参加予定・人数は表示しない。

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { homeCopy } from '../../constants/copy';
import { colors, fontFamily, gradientPlay, radius, spacing } from '../../constants/theme';
import { RaidHomeState } from '../../services/RaidService';
import { formatRemainingTo, formatSeconds } from '../../utils/date';
import { SoftGradient } from '../ui/SoftGradient';

type Props = {
  state: RaidHomeState;
  onStart: () => void;
  onCatchup: () => void;
};

function GoldButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <SoftGradient colors={gradientPlay} direction="horizontal" borderRadius={radius.pill} style={StyleSheet.absoluteFill} />
      <Text style={styles.buttonLabel}>{label}</Text>
    </Pressable>
  );
}

export function RaidCard({ state, onStart, onCatchup }: Props) {
  return (
    <View style={[styles.card, state.phase === 'open' && styles.cardOpen]}>
      <View style={styles.textWrap}>
        <Text style={styles.label}>{homeCopy.raidLabel}</Text>
        {state.phase === 'countdown' && (
          <Text style={styles.line}>
            {homeCopy.raidTime} <Text style={styles.sub}>{formatRemainingTo(state.startAt)}</Text>
          </Text>
        )}
        {state.phase === 'open' && (
          <Text style={styles.line}>
            {homeCopy.raidOpenLabel}{' '}
            <Text style={styles.subOpen}>
              {homeCopy.raidOpenSub} {formatSeconds(state.secondsLeft)}
            </Text>
          </Text>
        )}
        {state.phase === 'done' && (
          <Text style={styles.line}>
            <Text style={state.raidStatus === 'completed' ? styles.done : styles.sub}>
              {state.raidStatus === 'completed' ? homeCopy.raidDoneCompleted : homeCopy.raidDoneExited}
            </Text>
          </Text>
        )}
        {state.phase === 'catchup' && (
          <>
            <Text style={styles.line}>{homeCopy.raidClosed}</Text>
            <Text style={styles.sub}>{homeCopy.catchupSub}</Text>
          </>
        )}
      </View>

      {state.phase === 'open' && <GoldButton label={homeCopy.raidJoin} onPress={onStart} />}
      {state.phase === 'catchup' && <GoldButton label={homeCopy.catchupLabel} onPress={onCatchup} />}
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
  cardOpen: {
    borderColor: 'rgba(201, 169, 106, 0.35)',
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
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fontFamily.medium,
  },
  subOpen: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
    fontVariant: ['tabular-nums'],
  },
  done: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
  },
  button: {
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
  buttonLabel: {
    color: colors.onPrimary,
    fontSize: 13,
    fontWeight: '800',
    fontFamily: fontFamily.black,
  },
});
