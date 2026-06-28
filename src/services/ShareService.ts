
import { Share } from 'react-native';
import { DailyResult } from '../types/result';
import { ResultService } from './ResultService';
import { StorageService } from './StorageService';

export class ShareService {
  static async shareResult(result: DailyResult): Promise<void> {
    await Share.share({
      message: ResultService.createShareText(result),
      title: '本日のドパガキ報告書',
    });
    await StorageService.markResultShared(result.date, result.mode);
  }
}
