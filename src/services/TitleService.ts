
import { DEFAULT_TITLE_ID, TITLE_DEFS, TitleDef, TitleUnlockStats, findTitleById } from '../constants/titles';
import { DailyResult } from '../types/result';
import { UserSettings } from '../types/settings';
import { DopamineService } from './DopamineService';
import { StatsService } from './StatsService';
import { StorageService } from './StorageService';

export type TitleEntry = TitleDef & { unlockedNow: boolean };

export class TitleService {
  static async getUnlockStats(results: DailyResult[]): Promise<TitleUnlockStats> {
    const level = await DopamineService.getLevel();
    const temptationTotal = await StorageService.getTemptationTotal();
    return {
      level,
      completedLongCount: StatsService.getCompletedLongCount(results),
      streakDays: StatsService.getStreakDays(results),
      temptationTotal,
    };
  }

  static listTitles(stats: TitleUnlockStats): TitleEntry[] {
    return TITLE_DEFS.map((title) => ({ ...title, unlockedNow: title.unlocked(stats) }));
  }

  // 表示する称号: 選択済みかつアンロック済みならそれ、なければ自動（アンロック済みの一番下位＝新しいもの）
  static displayTitle(stats: TitleUnlockStats, settings: Pick<UserSettings, 'selectedTitleId'>): TitleDef {
    const selected = findTitleById(settings.selectedTitleId);
    if (selected && selected.unlocked(stats)) {
      return selected;
    }
    const unlocked = TITLE_DEFS.filter((title) => title.unlocked(stats));
    return unlocked[unlocked.length - 1] ?? findTitleById(DEFAULT_TITLE_ID) ?? TITLE_DEFS[0];
  }
}
