
// オンボーディングの「1日にどれくらいショートを見るか」の選択肢と、
// 損失可視化に使うざっくり換算値。厳密さより、直感に刺さる数字を優先する。

export type ShortsUsageOption = {
  id: string;
  label: string;
  monthlyHours: number;
  // 「時間」「時間以上」など、巨大数字の横に置く単位
  monthlyUnit: string;
  lifetimeLabel: string;
};

export const SHORTS_USAGE_OPTIONS: ShortsUsageOption[] = [
  { id: 'under30', label: '30分未満', monthlyHours: 15, monthlyUnit: '時間', lifetimeLabel: '約1年分' },
  { id: '30to60', label: '30分〜1時間', monthlyHours: 30, monthlyUnit: '時間', lifetimeLabel: '約2年分' },
  { id: '60to120', label: '1〜2時間', monthlyHours: 60, monthlyUnit: '時間', lifetimeLabel: '約4年分' },
  { id: 'over120', label: '2時間以上', monthlyHours: 90, monthlyUnit: '時間以上', lifetimeLabel: '約6年分' },
];

export const DEFAULT_SHORTS_USAGE_ID = '60to120';
