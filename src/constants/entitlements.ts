
// 将来課金の権限モデル。画面はプラン名ではなく機能権限（FeatureKey）で分岐する。
// MVPでは実課金がないため、すべて無効の固定値。

export type FeatureKey =
  | 'ad_free'
  | 'video_selection'
  | 'video_archive'
  | 'long_duration'
  | 'premium_videos'
  | 'heavy_mode';

export type AdMode = 'normal' | 'hidden' | 'heavy';

export type Entitlements = Record<FeatureKey, boolean>;

/** MVPの固定権限。課金導入時はストア購入情報からこの形へ変換する */
export const MVP_ENTITLEMENTS: Entitlements = {
  ad_free: false,
  video_selection: false,
  video_archive: false,
  long_duration: false,
  premium_videos: false,
  heavy_mode: false,
};
