
// 脱ドパ デザイントークン
// 方向性: 静かでチルい、少しリミナル。自然に近い落ち着いた色。余白広め、境界は繊細に。

export const colors = {
  // base surfaces ― 紙のような、少し緑みのある余白
  background: '#F5F7F1',
  backgroundSoft: '#EDF1E8',
  card: '#FFFFFF',
  cardStrong: '#ECF1E6',
  surface: '#F1F4ED',
  surfaceSunken: '#E9EEE3',

  // borders ― 繊細に
  border: 'rgba(54, 70, 52, 0.08)',
  borderStrong: 'rgba(54, 70, 52, 0.14)',

  // text ― 黒すぎない墨色〜霞
  text: '#222B23',
  textMuted: '#5E6C5A',
  textSubtle: '#94A18D',
  textFaint: '#B3BDAC',

  // accent ― 苔・セージのグリーン
  blue: '#7E9E78',
  blueDeep: '#D8E5D3',
  accent: '#7E9E78',
  accentSoft: 'rgba(126, 158, 120, 0.14)',
  accentBorder: 'rgba(126, 158, 120, 0.42)',

  // semantic
  danger: '#B96B62',
  dangerSoft: 'rgba(185, 107, 98, 0.10)',
  dangerBorder: 'rgba(185, 107, 98, 0.24)',
  success: '#6FA084',
  warning: '#A98E45',
  warningSoft: 'rgba(169, 142, 69, 0.10)',
  warningBorder: 'rgba(169, 142, 69, 0.22)',

  black: '#1C2620',
  onAccent: '#1C2620',
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 32,
  xxl: 44,
};

export const radius = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  pill: 999,
};

// 影は控えめ。フラットすぎず少しだけ奥行きを出す。
export const shadows = {
  soft: {
    shadowColor: '#2A3A28',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  hero: {
    shadowColor: '#2A3A28',
    shadowOpacity: 0.08,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
} as const;

// 安っぽいネオンではなく、少し霞んだパステルの虹。光る演出はここに限定。
export const rainbowSoft = ['#E6A6A0', '#E7C79A', '#A9CBA2', '#9FC4D6', '#B7A8D8', '#E2A8C6'] as const;

export const typography = {
  score: {
    fontSize: 76,
    fontWeight: '800' as const,
    letterSpacing: -3,
  },
  display: {
    fontSize: 34,
    fontWeight: '800' as const,
    letterSpacing: -0.8,
  },
  h1: {
    fontSize: 26,
    fontWeight: '800' as const,
    letterSpacing: -0.4,
  },
  h2: {
    fontSize: 20,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
  },
  title: {
    fontSize: 17,
    fontWeight: '700' as const,
  },
  body: {
    fontSize: 15,
    fontWeight: '500' as const,
    lineHeight: 22,
  },
  caption: {
    fontSize: 13,
    fontWeight: '500' as const,
    lineHeight: 19,
  },
  label: {
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 0.6,
  },
  // 既存互換（英字ラベルは使用箇所を絞る）
  englishLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 1.6,
    textTransform: 'uppercase' as const,
  },
  englishKicker: {
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 2.2,
  },
  brandMark: {
    fontSize: 26,
    fontWeight: '900' as const,
    letterSpacing: 3,
  },
};
