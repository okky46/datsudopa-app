
// 画面上の文言はすべてここに集約する。トーンは「静かなウェルネス × 脱力系ユーモア」。
// 説教・医学的断言・説明過多を避ける。

export const APP_NAME = '脱ドパ';

export const APP_CATCHPHRASE = 'ショートの真逆を、みんなで3分だけやる。';

export const APP_INTRO = 'ショート中毒者が、毎晩同じ時間に集まって、3分間何も起きない映像を見るアプリ。';

export const RAID_NOTIFICATION_TITLE = '22時になった';
export const RAID_NOTIFICATION_BODY = '3分虚無チャレンジ、開始。3分以内に入れば間に合う。';

// オンボーディング（5画面）
export const onboardingCopy = {
  problem: {
    title: '気づいたら、またショートを開いている。',
    body: 'いわゆる、ドパガキへ。\n脱ドパは、ショートに消えていた時間を少しずつあなたに返すアプリです。',
    cta: '次へ',
  },
  usage: {
    title: '1日にどれくらいショート動画を見ていますか？',
  },
  loss: {
    monthlyPrefix: '月に約',
    yearlyPrefix: '1年で約',
    hoursUnit: '時間',
    body: '今、その時間がショートに消えています。',
    recover: '脱ドパで、その時間を少しずつ取り戻そう。',
    disclaimer: '自己申告した利用時間をもとにした概算です',
    cta: '次へ',
  },
  raid: {
    title: '毎日22時、みんなでやる3分虚無チャレンジ。',
    body: '知らない人たちと同じ時間に集まり、3分間、何も起きない映像を見る。\n通知が来たら、3分以内に脱ドパを始めよう。',
    nameLabel: 'あなたの公開ネーム',
    nameHint: 'レイド後の「今日一緒だった人」に表示される名前。あとで変更できます。',
    regenerate: '別の候補を出す',
    cta: '次へ',
  },
  firstLong: {
    title: 'さっそく、ショートの真逆をやってみよう。',
    body: '3分間、何も起きない映像を見る。それだけ。',
    cta: '3分ロングをはじめる',
  },
  back: '戻る',
} as const;

// ホーム
export const homeCopy = {
  raidLabel: '今日の公式レイド',
  raidTime: '22:00',
  raidCountdownPrefix: 'あと',
  raidOpenLabel: '集合中',
  raidOpenSub: '参加猶予',
  raidJoin: '参加する',
  raidClosed: '今日の公式レイドは終了',
  raidDoneCompleted: '今日の3分、完走',
  raidDoneExited: '今日は途中まで。それも記録',
  catchupLabel: '追い脱ドパ',
  catchupSub: '同じ映像を、いまから3分',
  totalLabel: '累計脱ドパ時間',
  totalSub: 'ショートの外で過ごした時間',
  dopagakiLabel: 'ドパガキ度',
  dopagakiNote: 'アプリ内のエンタメ指標です',
  streakLabel: '連続脱ドパ日数',
  streakUnit: '日',
  streakNone: '今日から連続記録をはじめよう',
  weekLabel: '今週の履歴',
  weekLegendRaid: 'レイド完走',
  weekLegendExited: '途中離脱',
  weekLegendLong: 'ロングのみ',
} as const;

// ロング（今日の1本）
export const longCopy = {
  title: '今日の1本',
  tagline: '何も起きない映像で、スクロール脳をクールダウン。',
  durationLabel: '視聴時間',
  play: '再生する',
  lockNote: 'スキップ不可・倍速なし・次の動画もなし',
  selectionComingSoon: '動画を選べるのは、今後のプレミアムで。',
} as const;

// レイド・視聴中
export const playerCopy = {
  raidLabel: '3分虚無チャレンジ',
  longLabel: '脱ドパロング',
  exit: '中断する',
  exitConfirmTitle: '中断する？',
  exitConfirmMessage: 'ここまでの時間は、ちゃんと記録に残ります。',
  exitConfirmContinue: '続ける',
  exitConfirmQuit: '中断する',
} as const;

// リザルト
export const resultCopy = {
  titleCompleted: '今日も、ショートの外に出た。',
  titleExited: '途中まで。それでも外に出た。',
  raidKindLabel: '公式レイド',
  longKindLabel: '脱ドパロング',
  catchupKindLabel: '追い脱ドパ',
  watchedLabel: '今回の視聴時間',
  gainedLabel: '増えた脱ドパ時間',
  totalLabel: '累計脱ドパ時間',
  dopagakiLabel: 'ドパガキ度',
  streakLabel: '連続脱ドパ日数',
  companionsLabel: '今日一緒だった人',
  companionSuffix: 'さん',
  companionsEmpty: '今日も3分、ショートの外に出ました。',
  share: '共有画像を作る',
  nextRaid: '次の集合は、明日の22:00。',
  home: 'ホームへ戻る',
} as const;

// SNS共有画像（差し込み項目のみ。長文コピーは足さない）
export const shareCopy = {
  hashtag: '#脱ドパ',
  kindRaid: '公式レイド',
  kindLong: 'ロング',
  completed: '完走',
  exited: '途中離脱',
  totalLabel: '累計脱ドパ時間',
  dopagakiLabel: 'ドパガキ度',
  streakSuffix: '日連続',
  fallbackShareTitle: '脱ドパ',
} as const;

// 設定
export const menuCopy = {
  title: '設定',
  profileSection: '公開ユーザーネーム',
  nameHint: 'レイド後の「今日一緒だった人」に表示されます。',
  regenerate: '候補を出す',
  notificationSection: '通知',
  notificationLabel: '毎日22:00の通知',
  raidExplain: '毎日22:00に公式レイド。通知から3分以内だけ参加できます。時刻は変更できません。',
  cacheSection: '動画キャッシュ',
  cacheClear: 'キャッシュを削除',
  cacheCleared: '動画キャッシュを削除しました。',
  plansSection: '今後の予定',
  premiumTitle: '脱ドパ プレミアム（準備中）',
  premiumBody: '広告非表示、動画選択、過去動画アーカイブ、お気に入り、長時間動画、限定動画。',
  heavyTitle: 'ヘビーモード（準備中）',
  heavyBody: 'プレミアム特典に加えて、自主的な広告増量、限定称号とバッジ、限定共有デザイン。より一層スマホから離れたい人へ。',
  comingSoon: '今後提供予定',
  redoOnboarding: 'オンボーディングをやり直す',
  deleteData: '端末内データを削除',
  deleteConfirmTitle: '端末内データを削除',
  deleteConfirmBody: '端末内の記録・設定・通知・動画キャッシュを削除します。サーバー上の匿名データは対象外です。',
  legalPrivacy: 'プライバシーポリシー',
  legalTerms: '利用規約',
} as const;

// ユーザーネームのバリデーションメッセージ
export const nameErrorCopy = {
  tooShort: '2文字以上にしてください',
  tooLong: '16文字以内にしてください',
  invalid: 'この名前は使えません',
} as const;
