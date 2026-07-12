import type { TextStyle } from 'react-native';

// 脱ドパ デザイントークン ― 1b「上質・ダーク」
// 方向性: 深いインク × シャンパンゴールド。丸ゴシック、静かな高級ウェルネスのトーン。

export const colors = {
  // base surfaces ― 深いインク
  background: '#14161B',
  backgroundTop: '#1C2028', // 画面上部のごく淡いグラデーション用（radial風の疑似表現）
  backgroundSoft: '#191B20',
  card: 'rgba(255, 255, 255, 0.03)',
  cardStrong: 'rgba(255, 255, 255, 0.05)',
  surface: 'rgba(255, 255, 255, 0.03)',
  surfaceSunken: 'rgba(255, 255, 255, 0.02)',
  cardOpaque: '#1B1D22',

  // borders ― 白のごく薄いライン
  border: 'rgba(255, 255, 255, 0.07)',
  borderStrong: 'rgba(255, 255, 255, 0.13)',

  // text ― クリーム〜くすんだゴールドベージュ
  text: '#ECE7DD',
  textMuted: '#8A8578',
  textSubtle: '#6E6A5F',
  textFaint: '#54514A',

  // primary action ― シャンパンゴールド
  primary: '#C9A96A',
  primaryStrong: '#B8965A',
  primarySoft: 'rgba(201, 169, 106, 0.10)',
  primaryBorder: 'rgba(201, 169, 106, 0.28)',
  onPrimary: '#14161B',

  // accent ― 静かなセージグリーン（達成・ポジティブ）とゴールド系のブルー代替
  blue: '#C9A96A',
  blueDeep: 'rgba(201, 169, 106, 0.5)',
  accent: '#9FB79C',
  accentSoft: 'rgba(159, 183, 156, 0.12)',
  accentBorder: 'rgba(159, 183, 156, 0.30)',

  // semantic
  danger: '#CE9A8E',
  dangerSoft: 'rgba(206, 154, 142, 0.12)',
  dangerBorder: 'rgba(206, 154, 142, 0.24)',
  success: '#9FB79C',
  warning: '#D0935A',
  warningSoft: 'rgba(208, 147, 90, 0.12)',
  warningBorder: 'rgba(208, 147, 90, 0.24)',

  black: '#0B0C0E',
  onAccent: '#14161B',

  // pastel palette ― アバター選択や装飾ドットなど、ごく一部の彩り用
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

// 影は深いインクの上でごく控えめに。沈み込みよりも縁の光を優先。
export const shadows = {
  soft: {
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  hero: {
    shadowColor: '#000000',
    shadowOpacity: 0.4,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 16 },
    elevation: 5,
  },
} as const;

// 淡いパステルの虹（オンボーディングの装飾ドットなど、ごく一部のみ）
export const rainbowSoft = ['#F2C9D2', '#F6E4C0', '#CDEBD6', '#CFE2F2', '#DCD7F2', '#F2C9D2'] as const;

// ホームのスコアバーなど、主役の細いゴールドグラデーション帯
export const gradientBar = ['#C9A96A', '#E4CE9A'] as const;

// 「参加する」「再生する」など、画面唯一の華となるCTAのゴールドグラデーション
export const gradientPlay = ['#C9A96A', '#B8965A'] as const;

// 主役カードに敷く、深いインク×ゴールドの淡いウォッシュ
export const gradientWash = ['rgba(201, 169, 106, 0.10)', 'rgba(255, 255, 255, 0.02)'] as const;

// Zen Maru Gothic（丸ゴシック）。@expo-google-fonts/zen-maru-gothic で読み込む静的ウェイト。
export const fontFamily = {
  regular: 'ZenMaruGothic_400Regular',
  medium: 'ZenMaruGothic_500Medium',
  bold: 'ZenMaruGothic_700Bold',
  black: 'ZenMaruGothic_900Black',
} as const;

// fontWeight の指定から、対応する Zen Maru Gothic の静的ウェイトを選ぶ。
export function zenMaru(weight: TextStyle['fontWeight']): string {
  const w = typeof weight === 'string' ? parseInt(weight, 10) : weight ?? 400;
  if (Number.isNaN(w)) {
    return fontFamily.regular;
  }
  if (w >= 850) return fontFamily.black;
  if (w >= 600) return fontFamily.bold;
  if (w >= 450) return fontFamily.medium;
  return fontFamily.regular;
}

export const typography = {
  score: {
    fontSize: 74,
    fontWeight: '700' as const,
    fontFamily: fontFamily.bold,
    letterSpacing: -3,
  },
  display: {
    fontSize: 30,
    fontWeight: '800' as const,
    fontFamily: fontFamily.black,
    letterSpacing: -0.6,
  },
  h1: {
    fontSize: 26,
    fontWeight: '800' as const,
    fontFamily: fontFamily.black,
    letterSpacing: -0.4,
  },
  h2: {
    fontSize: 20,
    fontWeight: '700' as const,
    fontFamily: fontFamily.bold,
    letterSpacing: -0.2,
  },
  title: {
    fontSize: 17,
    fontWeight: '700' as const,
    fontFamily: fontFamily.bold,
  },
  body: {
    fontSize: 15,
    fontWeight: '500' as const,
    fontFamily: fontFamily.medium,
    lineHeight: 22,
  },
  caption: {
    fontSize: 13,
    fontWeight: '500' as const,
    fontFamily: fontFamily.medium,
    lineHeight: 19,
  },
  label: {
    fontSize: 12,
    fontWeight: '700' as const,
    fontFamily: fontFamily.bold,
    letterSpacing: 0.6,
  },
  // 既存互換（英字ラベルは使用箇所を絞る）
  englishLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    fontFamily: fontFamily.bold,
    letterSpacing: 1.6,
    textTransform: 'uppercase' as const,
  },
  englishKicker: {
    fontSize: 12,
    fontWeight: '700' as const,
    fontFamily: fontFamily.bold,
    letterSpacing: 2.2,
  },
  brandMark: {
    fontSize: 24,
    fontWeight: '900' as const,
    fontFamily: fontFamily.black,
    letterSpacing: 0.5,
  },
};
