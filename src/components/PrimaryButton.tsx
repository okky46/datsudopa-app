
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, fontFamily, gradientPlay, radius, shadows, spacing } from '../constants/theme';
import { SoftGradient } from './ui/SoftGradient';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger' | 'gradient';
  disabled?: boolean;
  style?: ViewStyle;
  icon?: ReactNode;
};

export function PrimaryButton({ label, onPress, variant = 'primary', disabled = false, style, icon }: Props) {
  const isGradient = variant === 'gradient';
  const labelColor =
    variant === 'ghost' ? colors.text : isGradient ? colors.onPrimary : variant === 'danger' ? colors.danger : colors.onPrimary;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'ghost' && styles.ghost,
        variant === 'danger' && styles.danger,
        isGradient && styles.gradient,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      {isGradient && (
        <SoftGradient colors={gradientPlay} direction="horizontal" borderRadius={radius.pill} style={StyleSheet.absoluteFill} />
      )}
      <View style={styles.content}>
        {icon}
        <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  primary: {
    backgroundColor: colors.primary,
    ...shadows.soft,
  },
  gradient: {
    backgroundColor: colors.primarySoft,
    ...shadows.soft,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  danger: {
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
  },
  disabled: {
    opacity: 0.46,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
    letterSpacing: 0.3,
  },
});
