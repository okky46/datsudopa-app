
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';

type Props = {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: ReactNode;
  compact?: boolean;
};

export function Chip({ label, selected = false, onPress, icon, compact = false }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, compact && styles.chipCompact, selected && styles.selected, pressed && styles.pressed]}
    >
      {icon}
      <Text style={[styles.text, compact && styles.textCompact, selected && styles.textSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.card,
  },
  chipCompact: {
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  pressed: {
    opacity: 0.7,
  },
  text: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  textCompact: {
    fontSize: 13,
  },
  textSelected: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
});
