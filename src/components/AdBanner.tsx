
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';
import { AdsService } from '../services/AdsService';

type Props = {
  label?: string;
};

type GoogleMobileAdsModule = typeof import('react-native-google-mobile-ads');

function loadGoogleMobileAds(): GoogleMobileAdsModule | null {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    return null;
  }

  try {
    return require('react-native-google-mobile-ads') as GoogleMobileAdsModule;
  } catch {
    return null;
  }
}

export function AdBanner({ label = '静かな広告枠' }: Props) {
  const ads = loadGoogleMobileAds();
  if (!ads) {
    return (
      <View style={styles.wrapper}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.placeholder}>AdMob banner placeholder / development buildで実広告</Text>
      </View>
    );
  }

  const { BannerAd, BannerAdSize } = ads;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <BannerAd
        unitId={AdsService.getBannerAdUnitId()}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  label: {
    color: colors.textSubtle,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  placeholder: {
    color: colors.textMuted,
    fontSize: 12,
    paddingVertical: spacing.md,
  },
});
