
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

export function AdBanner(_: Props) {
  const ads = loadGoogleMobileAds();
  if (!ads) {
    return (
      <View style={styles.wrapper}>
        <Text style={styles.placeholder}>AD</Text>
      </View>
    );
  }

  const { BannerAd, BannerAdSize } = ads;

  return (
    <View style={styles.wrapper}>
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
    justifyContent: 'center',
    minHeight: 56,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSunken,
  },
  placeholder: {
    color: colors.textFaint,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
});
