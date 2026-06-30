
import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';
import { colors, radius, shadows, spacing } from '../../constants/theme';

type Variant = 'default' | 'hero' | 'soft' | 'ghost';

type Props = ViewProps & {
  children: ReactNode;
  variant?: Variant;
  style?: ViewStyle | ViewStyle[];
};

export function Card({ children, variant = 'default', style, ...rest }: Props) {
  return (
    <View style={[styles.base, variantStyles[variant], style]} {...rest}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    padding: spacing.lg,
    borderRadius: radius.xl,
  },
});

const variantStyles: Record<Variant, ViewStyle> = {
  default: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  hero: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.hero,
  },
  soft: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
};
