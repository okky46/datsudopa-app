
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../constants/theme';
import { PremiumService } from '../services/PremiumService';

export function PremiumJokeCard() {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => PremiumService.showPlaceholder()}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.badge}>
        <Text style={styles.badgeText}>PREMIUM</Text>
      </View>
      <Text style={styles.title}>課金すると、広告が増えます</Text>
      <Text style={styles.body}>減らすのではなく、向き合う。</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.warningBorder,
    backgroundColor: colors.warningSoft,
  },
  pressed: {
    opacity: 0.85,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(169, 142, 69, 0.16)',
  },
  badgeText: {
    color: colors.warning,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  title: {
    color: colors.text,
    ...typography.h2,
  },
  body: {
    color: colors.textMuted,
    ...typography.body,
  },
});
