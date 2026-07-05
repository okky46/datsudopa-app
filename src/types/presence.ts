
// 「今一緒に耐えている人たち」の気配（プレゼンス）。
// ユーザー名やプロフィールは一切持たず、位置と見た目だけの匿名な点。

export type PresenceCompanion = {
  id: string;
  x: number; // 画面幅に対する割合（0-100）
  y: number; // 画面高さに対する割合（0-100）
  size: number;
  hue: string;
  phase: number; // 明滅アニメーションの位相をずらすための値（0-1）
};

export type PresenceStats = {
  /** 今この瞬間、同じ枠で耐えている想定人数 */
  active: number;
  /** 今日すでに完走した想定人数 */
  completed: number;
  /** 今日離脱した想定人数 */
  escaped: number;
};
