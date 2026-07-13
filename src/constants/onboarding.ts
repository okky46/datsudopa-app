
// オンボーディングの「1日にどれくらいショートを見るか」の選択肢。
// 代表値（分/日）から月間・年間の損失概算を出す。自己申告ベースの概算であることを画面に明記する。

export type ShortsUsageOption = {
  id: string;
  label: string;
  /** 計算用代表値（分/日） */
  dailyMinutes: number;
};

export const SHORTS_USAGE_OPTIONS: ShortsUsageOption[] = [
  { id: 'under30', label: '30分未満', dailyMinutes: 15 },
  { id: 'm30to60', label: '30分〜1時間', dailyMinutes: 45 },
  { id: 'h1to2', label: '1〜2時間', dailyMinutes: 90 },
  { id: 'over2', label: '2時間以上', dailyMinutes: 150 },
];

export const DEFAULT_SHORTS_USAGE_ID = 'h1to2';

export function findUsageOption(id?: string): ShortsUsageOption {
  return SHORTS_USAGE_OPTIONS.find((option) => option.id === id)
    ?? SHORTS_USAGE_OPTIONS.find((option) => option.id === DEFAULT_SHORTS_USAGE_ID)
    ?? SHORTS_USAGE_OPTIONS[0];
}

/** 月間損失（時間、四捨五入） */
export function monthlyLossHours(option: ShortsUsageOption): number {
  return Math.round((option.dailyMinutes * 30) / 60);
}

/** 年間損失（時間、四捨五入） */
export function yearlyLossHours(option: ShortsUsageOption): number {
  return Math.round((option.dailyMinutes * 365) / 60);
}
