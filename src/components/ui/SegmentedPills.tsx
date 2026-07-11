
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows, spacing } from '../../constants/theme';

export type SegmentOption = {
  key: string;
  label: string;
  icon?: ReactNode;
  accessibilityLabel?: string;
};

type Props = {
  options: SegmentOption[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
};

// surfaceのpillの中を白いpillが移動するセグメント選択。
// Chipの流儀(pill・控えめな枠・選択で強調)を1本のレールにまとめた形。
export function SegmentedPills({ options, selectedKey, onSelect }: Props) {
  return (
    <View style={styles.rail}>
      {options.map((option) => {
        const selected = option.key === selectedKey;
        return (
          <Pressable
            key={option.key}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={option.accessibilityLabel ?? option.label}
            onPress={() => onSelect(option.key)}
            style={({ pressed }) => [styles.segment, selected && styles.segmentSelected, pressed && styles.pressed]}
          >
            {option.icon}
            {option.label !== '' && (
              <Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
                {option.label}
              </Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 38,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.pill,
  },
  segmentSelected: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  labelSelected: {
    color: colors.text,
  },
});
