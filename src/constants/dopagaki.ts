
// ドパガキ度（0〜100）の増減ルール。医学的指標ではなくアプリ内のエンタメ指標。
// 数値を調整するときはこのファイルだけを変更する。

export const DOPAGAKI_MIN = 0;
export const DOPAGAKI_MAX = 100;

/** オンボーディングの自己申告時間 → 初期値 */
export const DOPAGAKI_INITIAL_BY_USAGE: Record<string, number> = {
  under30: 35,
  m30to60: 55,
  h1to2: 75,
  over2: 90,
};

/** オンボーディング未完了時のフォールバック初期値 */
export const DOPAGAKI_DEFAULT_INITIAL = 75;

/** 公式レイド完走 */
export const DOPAGAKI_RAID_COMPLETED_DELTA = -3;

/** 公式レイド途中離脱 */
export const DOPAGAKI_RAID_EXITED_DELTA = 1;

/** 当日の公式レイド未参加（日付単位で1回だけ） */
export const DOPAGAKI_RAID_MISSED_DELTA = 1;

/** 通常ロング（追い脱ドパ含む）この秒数ごとに-1 */
export const DOPAGAKI_LONG_STEP_SECONDS = 180;
export const DOPAGAKI_LONG_STEP_DELTA = -1;

/** 通常ロングによる減少の1日あたり上限（絶対値） */
export const DOPAGAKI_LONG_DAILY_CAP = 3;

/** 長期間未起動でも、未参加ペナルティを一括適用するのは直近この日数まで */
export const DOPAGAKI_MISSED_BACKFILL_MAX_DAYS = 3;

/** ドパガキ度から導く称号（SNS共有画像用）。上から順に評価する */
export const DOPAGAKI_TITLES: Array<{ maxLevel: number; title: string }> = [
  { maxLevel: 20, title: '虚無の民' },
  { maxLevel: 40, title: 'ショートの外の人' },
  { maxLevel: 60, title: '準・虚無耐久者' },
  { maxLevel: 80, title: 'ドパガキ見習い' },
  { maxLevel: 100, title: 'ドパガキ' },
];

export function dopagakiTitle(level: number): string {
  const found = DOPAGAKI_TITLES.find((entry) => level <= entry.maxLevel);
  return found ? found.title : DOPAGAKI_TITLES[DOPAGAKI_TITLES.length - 1].title;
}
