import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card } from '../src/components/ui/Card';
import { screenCopy } from '../src/constants/copy';
import { colors, spacing, typography } from '../src/constants/theme';

function BackGlyph() {
  return (
    <View style={styles.backGlyph}>
      <View style={styles.backBar} />
      <View style={styles.backTip} />
    </View>
  );
}

export default function HowToScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="戻る"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <BackGlyph />
          <Text style={styles.backLabel}>戻る</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{screenCopy.howToTitle}</Text>
        <Text style={styles.tagline}>{screenCopy.howToTagline}</Text>

        <Card style={styles.card}>
          {screenCopy.howToSteps.map((step, index) => (
            <View key={step} style={[styles.stepRow, index > 0 && styles.stepDivider]}>
              <Text style={styles.stepIndex}>{index + 1}</Text>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  backGlyph: {
    width: 18,
    height: 18,
    justifyContent: 'center',
  },
  backBar: {
    width: 12,
    height: 2,
    borderRadius: 2,
    backgroundColor: colors.text,
    marginLeft: 4,
  },
  backTip: {
    position: 'absolute',
    left: 0,
    width: 8,
    height: 8,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: colors.text,
    transform: [{ rotate: '45deg' }],
  },
  backLabel: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 80,
  },
  title: {
    color: colors.text,
    ...typography.display,
    paddingHorizontal: spacing.xs,
  },
  tagline: {
    color: colors.textMuted,
    ...typography.body,
    paddingHorizontal: spacing.xs,
    marginTop: -spacing.sm,
  },
  card: {
    gap: 0,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  stepDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  stepIndex: {
    color: colors.textSubtle,
    fontSize: 15,
    fontWeight: '800',
    width: 20,
    textAlign: 'center',
    marginTop: 1,
  },
  stepText: {
    flex: 1,
    color: colors.text,
    ...typography.body,
  },
});
