
import { AdMode, Entitlements, FeatureKey, MVP_ENTITLEMENTS } from '../constants/entitlements';

// プラン名（プレミアム / ヘビーモード）を画面内で直接判定しないための機能権限ゲート。
// ヘビーモードは将来、買い切り・月額・上位サブスクのどれにでも変更できるよう、
// ここで entitlements へ変換する層だけを差し替える。

export class FeatureGateService {
  static getEntitlements(): Entitlements {
    return MVP_ENTITLEMENTS;
  }

  static hasFeature(key: FeatureKey): boolean {
    return FeatureGateService.getEntitlements()[key];
  }

  /** 広告表示モード。heavy_mode > ad_free > normal の優先順 */
  static getAdMode(): AdMode {
    const entitlements = FeatureGateService.getEntitlements();
    if (entitlements.heavy_mode) {
      return 'heavy';
    }
    if (entitlements.ad_free) {
      return 'hidden';
    }
    return 'normal';
  }
}
