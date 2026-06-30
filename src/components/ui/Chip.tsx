
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';

type Props = {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: ReactNode;
};

export function Chip({ label, selected = false, onPress, icon }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}
    >
      {icon}
      <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
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
  textSelected: {
    color: colors.onPrimary,
    fontWeight: '700',
  },
});
