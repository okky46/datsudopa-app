
import { StyleSheet, Text } from 'react-native';
import { colors, fontFamily, radius, spacing } from '../../constants/theme';
import { PressableScale } from '../ui/Motion';

type Props = {
  label: string;
  onPress: () => void;
};

export function SharePill({ label, onPress }: Props) {
  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.pill}>
      <Text style={styles.label}>{label}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
  },
});
