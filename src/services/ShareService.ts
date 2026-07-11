
import { Share } from 'react-native';
import { DailyResult } from '../types/result';
import { DopamineService } from './DopamineService';
import { ResultService } from './ResultService';
import { StatsService } from './StatsService';
import { StorageService } from './StorageService';
import { TitleService } from './TitleService';

export class ShareService {
  static async shareResult(result: DailyResult): Promise<void> {
    const settings = await StorageService.getSettings();
    const results = await StorageService.getDailyResults();
    const stats = await TitleService.getUnlockStats(results);
    const title = TitleService.displayTitle(stats, settings);
    await Share.share({
      message: ResultService.createShareText(result, settings.nickname, title.name),
      title: '脱ドパレポート',
    });
    await StorageService.markResultShared(result.date, result.mode);
    // 共有はドパるので微増
    await DopamineService.bumpForShare();
  }

  // ホーム/メニューからの「ドパるけど共有する」
  static async shareStatus(): Promise<void> {
    const settings = await StorageService.getSettings();
    const results = await StorageService.getDailyResults();
    const stats = await TitleService.getUnlockStats(results);
    const title = TitleService.displayTitle(stats, settings);
    const level = await DopamineService.getLevel();
    const streak = StatsService.getStreakDays(results);
    const displayName = settings.nickname.trim() || '名無しのドパガキ';

    const lines = [
      `${displayName}のドパガキ度：${level}%`,
      `称号：${title.name}`,
      streak > 0 ? `${streak}日連続で脱ドパ中` : 'これから脱ドパはじめます',
      '',
      'ショートの真逆を、みんなでやる。',
      '#脱ドパ',
    ];

    await Share.share({ message: lines.join('\n'), title: '脱ドパ' });
    await DopamineService.bumpForShare();
  }
}
