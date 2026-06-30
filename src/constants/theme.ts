
// 脱ドパ デザイントークン
// 方向性: 明るいオフホワイト、濃いネイビーの文字、淡いパステルのアクセント。
// 静かなウェルネスアプリのような、清潔で柔らかく軽い高級感のあるトーン。

export const colors = {
  // base surfaces ― 明るいオフホワイト（ほんのり暖かみ）
  background: '#F6F4EF',
  backgroundSoft: '#F1EEE7',
  card: '#FFFFFF',
  cardStrong: '#FBFAF7',
  surface: '#F4F2EC',
  surfaceSunken: '#EEEBE3',

  // borders ― 繊細に
  border: 'rgba(46, 52, 80, 0.07)',
  borderStrong: 'rgba(46, 52, 80, 0.13)',

  // text ― 濃いネイビー〜チャコール、補助はグレー寄り
  text: '#2E3450',
  textMuted: '#6B7185',
  textSubtle: '#9AA0B2',
  textFaint: '#BCC0CC',

  // primary action ― 落ち着いた濃いネイビー
  primary: '#3B4263',
  primaryStrong: '#333A59',
  primarySoft: 'rgba(59, 66, 99, 0.10)',
  primaryBorder: 'rgba(59, 66, 99, 0.22)',
  onPrimary: '#FFFFFF',

  // accent ― 静かなセージ/ミントグリーン（達成・ポジティブ）
  blue: '#7CA6C2',
  blueDeep: '#CFE2F2',
  accent: '#5F8A6E',
  accentSoft: 'rgba(95, 138, 110, 0.12)',
  accentBorder: 'rgba(95, 138, 110, 0.30)',

  // semantic
  danger: '#C2796E',
  dangerSoft: 'rgba(194, 121, 110, 0.10)',
  dangerBorder: 'rgba(194, 121, 110, 0.22)',
  success: '#5F8A6E',
  warning: '#C8A24A',
  warningSoft: 'rgba(200, 162, 74, 0.12)',
  warningBorder: 'rgba(200, 162, 74, 0.24)',

  black: '#2E3450',
  onAccent: '#FFFFFF',

  // pastel palette ― 淡いミント / ラベンダー / ピンク / ブルー / イエロー
  pastelMint: '#C9E9D6',
  pastelLavender: '#DCD7F2',
  pastelPink: '#F6D9E3',
  pastelBlue: '#D2E3F3',
  pastelYellow: '#F6EFCF',
} as const;

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

// 影は柔らかく自然に。フラットすぎず、軽く浮かぶ程度。
export const shadows = {
  soft: {
    shadowColor: '#2E3450',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  hero: {
    shadowColor: '#2E3450',
    shadowOpacity: 0.09,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 },
    elevation: 5,
  },
} as const;

// 淡いパステルの虹。光る演出はここに限定して控えめに。
export const rainbowSoft = ['#F2C9D2', '#F6E4C0', '#CDEBD6', '#CFE2F2', '#DCD7F2', '#F2C9D2'] as const;

// ホームのスコアバー / 主役の細いグラデーション帯
export const gradientBar = ['#C9E9D6', '#CFE2F2', '#DCD7F2'] as const;

// ロングの「再生する」ボタンなど大きめのパステルグラデーション
export const gradientPlay = ['#C9E9D6', '#D6DEF3', '#F4D9E4'] as const;

// 主役カードの淡いウォッシュ（オーロラ）
export const gradientWash = ['#EAF3FB', '#F2EEFB', '#FBEFF4'] as const;

export const typography = {
  score: {
    fontSize: 76,
    fontWeight: '800' as const,
    letterSpacing: -3,
  },
  display: {
    fontSize: 30,
    fontWeight: '800' as const,
    letterSpacing: -0.6,
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
    fontSize: 24,
    fontWeight: '900' as const,
    letterSpacing: 0.5,
  },
};
