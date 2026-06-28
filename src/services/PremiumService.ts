
import { Alert } from 'react-native';
import { PremiumStatus } from '../types/settings';
import { StorageService } from './StorageService';

export class PremiumService {
  static async getStatus(): Promise<PremiumStatus> {
    return StorageService.getPremiumStatus();
  }

  static showPlaceholder(): void {
    Alert.alert(
      '未実装です',
      'プレミアム・広告増量プランはまだplaceholderです。広告を減らすのではなく、広告に向き合う未来だけがあります。',
    );
  }
}
