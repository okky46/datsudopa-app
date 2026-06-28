
import Constants from 'expo-constants';
import { Platform } from 'react-native';

type ExtraConfig = {
  admobBannerAndroid?: string;
  admobBannerIos?: string;
};

const testBannerIds = {
  android: 'ca-app-pub-3940256099942544/6300978111',
  ios: 'ca-app-pub-3940256099942544/2934735716',
};

export class AdsService {
  static getBannerAdUnitId(): string {
    if (__DEV__) {
      return Platform.OS === 'ios' ? testBannerIds.ios : testBannerIds.android;
    }

    const extra = (Constants.expoConfig?.extra || {}) as ExtraConfig;
    if (Platform.OS === 'ios') {
      return process.env.EXPO_PUBLIC_ADMOB_BANNER_IOS || extra.admobBannerIos || testBannerIds.ios;
    }
    return process.env.EXPO_PUBLIC_ADMOB_BANNER_ANDROID || extra.admobBannerAndroid || testBannerIds.android;
  }

  static getInterstitialPlaceholder(): null {
    return null;
  }

  static getRewardedPlaceholder(): null {
    return null;
  }
}
