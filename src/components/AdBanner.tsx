
import { useEffect } from 'react';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';
import { AdsService } from '../services/AdsService';
import { AnalyticsService } from '../services/AnalyticsService';
import { FeatureGateService } from '../services/FeatureGateService';

type Props = {
  /** 分析用の設置場所（home / long_setup / menu） */
  placement: string;
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

export function AdBanner({ placement }: Props) {
  const adMode = FeatureGateService.getAdMode();
  const hidden = adMode === 'hidden';

  useEffect(() => {
    if (!hidden) {
      void AnalyticsService.track('ad_impression', { placement });
    }
  }, [hidden, placement]);

  if (hidden) {
    return null;
  }

  const ads = loadGoogleMobileAds();
  if (!ads) {
    return (
      <View style={styles.wrapper}>
        <Text style={styles.placeholder}>AD BANNER</Text>
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
    borderWidth: 1,
    borderColor: colors.border,
  },
  placeholder: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'ui-monospace, Menlo, monospace' }),
    letterSpacing: 2,
  },
});
