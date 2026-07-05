
// 「気配」演出のチューニング値。
// 動画の中央・上部の集合バッジ・下部のテキストにはかからない、余白側の座標だけを候補にする。

export const PRESENCE_MIN_COMPANIONS = 3;
export const PRESENCE_MAX_COMPANIONS = 8;

export const PRESENCE_JOIN_INTERVAL_MS: [number, number] = [5000, 11000];
export const PRESENCE_LEAVE_FADE_MS = 2200;
export const PRESENCE_ENTER_FADE_MS = 1800;

export const PRESENCE_DOT_HUES = [
  'rgba(201, 233, 214, 0.85)', // pastelMint
  'rgba(220, 215, 242, 0.85)', // pastelLavender
  'rgba(246, 217, 227, 0.85)', // pastelPink
  'rgba(210, 227, 243, 0.85)', // pastelBlue
  'rgba(246, 239, 207, 0.85)', // pastelYellow
];

// x, y は画面サイズに対する割合（%）。中央や上下のテキスト帯を避けた余白に配置。
export const PRESENCE_POSITION_POOL: Array<{ x: number; y: number }> = [
  { x: 6, y: 16 },
  { x: 93, y: 14 },
  { x: 5, y: 30 },
  { x: 94, y: 32 },
  { x: 8, y: 46 },
  { x: 91, y: 46 },
  { x: 5, y: 60 },
  { x: 94, y: 58 },
  { x: 10, y: 25 },
  { x: 88, y: 24 },
  { x: 14, y: 38 },
  { x: 85, y: 40 },
];
