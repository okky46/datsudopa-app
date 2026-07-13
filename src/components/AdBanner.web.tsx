
import { Platform, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';
import { FeatureGateService } from '../services/FeatureGateService';

type Props = {
  placement: string;
};

// react-native-google-mobile-ads はネイティブ専用のため、web ではプレースホルダーのみ表示する。
export function AdBanner(_: Props) {
  if (FeatureGateService.getAdMode() === 'hidden') {
    return null;
  }
  return (
    <View style={styles.wrapper}>
      <Text style={styles.placeholder}>AD BANNER</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSunken,
    borderWidth: 1,
    borderColor: colors.border,
  },
  placeholder: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.select({ default: 'ui-monospace, Menlo, monospace' }),
    letterSpacing: 2,
  },
});
