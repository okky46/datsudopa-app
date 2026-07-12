
import { Platform, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';

type Props = {
  label?: string;
};

// react-native-google-mobile-ads はネイティブ専用のため、web ではプレースホルダーのみ表示する。
export function AdBanner(_: Props) {
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
