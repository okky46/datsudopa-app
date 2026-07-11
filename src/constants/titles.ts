
// ドパガキ称号の定義。ドパガキ度・ロング視聴履歴・連続記録に応じてアンロックされる。
// 名称は後々調整する前提の例。トーンは脱力系で統一する。

export type TitleUnlockStats = {
  level: number;
  completedLongCount: number;
  streakDays: number;
  temptationTotal: number;
};

export type TitleDef = {
  id: string;
  name: string;
  // アンロック条件の短い説明（未取得時に見せる）
  hint: string;
  unlocked: (stats: TitleUnlockStats) => boolean;
};

export const TITLE_DEFS: TitleDef[] = [
  {
    id: 'rookie',
    name: 'ドパガキ見習い',
    hint: 'はじめから持っている',
    unlocked: () => true,
  },
  {
    id: 'first-void',
    name: '虚無デビュー',
    hint: 'ロングを1本完走する',
    unlocked: (stats) => stats.completedLongCount >= 1,
  },
  {
    id: 'void-regular',
    name: '静寂の常連',
    hint: 'ロングを5本完走する',
    unlocked: (stats) => stats.completedLongCount >= 5,
  },
  {
    id: 'void-meister',
    name: '虚無マイスター',
    hint: 'ロングを15本完走する',
    unlocked: (stats) => stats.completedLongCount >= 15,
  },
  {
    id: 'three-days',
    name: '三日坊主じゃない人',
    hint: '3日連続で脱ドパする',
    unlocked: (stats) => stats.streakDays >= 3,
  },
  {
    id: 'seven-days',
    name: '七日間の虚無行',
    hint: '7日連続で脱ドパする',
    unlocked: (stats) => stats.streakDays >= 7,
  },
  {
    id: 'half-detox',
    name: 'ドパ抜け初段',
    hint: 'ドパガキ度を50%以下にする',
    unlocked: (stats) => stats.level <= 50,
  },
  {
    id: 'almost-monk',
    name: '悟りかけ',
    hint: 'ドパガキ度を30%以下にする',
    unlocked: (stats) => stats.level <= 30,
  },
  {
    id: 'tempted-soul',
    name: '誘惑に触れし者',
    hint: '視聴中に10回ドパりかける',
    unlocked: (stats) => stats.temptationTotal >= 10,
  },
];

export const DEFAULT_TITLE_ID = 'rookie';

export function findTitleById(id?: string): TitleDef | undefined {
  return TITLE_DEFS.find((title) => title.id === id);
}
