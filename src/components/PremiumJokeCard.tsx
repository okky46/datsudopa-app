
import { StyleSheet, Text, View } from 'react-native';
import { englishLabels } from '../constants/copy';
import { colors, radius, spacing, typography } from '../constants/theme';
import { PremiumService } from '../services/PremiumService';
import { PrimaryButton } from './PrimaryButton';

export function PremiumJokeCard() {
  return (
    <View style={styles.card}>
      <Text style={styles.caption}>{englishLabels.premiumPreview}</Text>
      <Text style={styles.title}>プレミアム・広告増量プラン</Text>
      <Text style={styles.body}>課金するとさらに多くの広告が登場。広告を減らすのではなく、広告に向き合う。</Text>
      <PrimaryButton label="広告増量の未来を見る" variant="ghost" onPress={() => PremiumService.showPlaceholder()} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.warningBorder,
    backgroundColor: colors.warningSoft,
  },
  caption: {
    color: colors.warning,
    ...typography.englishLabel,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  body: {
    color: colors.textMuted,
    lineHeight: 22,
  },
});
