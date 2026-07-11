
export const APP_CATCHPHRASE = 'ショートの真逆を、みんなでやる。';

export const HOME_CATCHPHRASE = 'ショートで過熱した脳を、3分だけ冷ます。';

export const RAID_NOTIFICATION_BODY =
  '⚠️ 脱ドパの時間です。3分以内にロングを視聴開始しないとあなたはドパガキのままです。';

// 画面ごとの短いコピー（説明ではなく世界観として置く）
export const screenCopy = {
  longTitle: '脱ドパロング',
  longTagline: 'ショートで過熱した脳を冷ます、余白のあるロング映像。',
  longDescription:
    '何かが起きそうで、何も起きない。\n洗練された空間にただ浸り、スクロール脳をクールダウンする。',
  longSectionOthers: 'ほかの静かな没入映像',
  longVideoSectionLabel: '今日の映像',
  longDurationSectionLabel: '視聴時間',
  longDurationSectionHint: '1分〜120分。スライダーか下のボタンで指定できます。',
  menuTitle: '設定',
  menuProfileTitle: 'ユーザープロフィール',
  menuNicknameLabel: 'ニックネーム',
  menuNotificationTitle: '通知設定',
  menuNotificationLabel: '通知',
  menuTimeSlotLabel: '一番よくショートなどを見てしまう時間帯',
  menuTimeSlotHint: 'この時間帯のどこかで、通知が届くかもしれません。',
  menuPremiumTitle: '脱ドパ　プレミアム',
  menuPremiumBody:
    'プレミアムプランに加入すると、さらに多くの広告が登場！　自主的により多くの広告を表示できるハードモードでより一層スマホから離れられます',
  menuRedoOnboarding: 'オンボーディングをやり直す',
  menuHowTo: '使い方を見る',
  menuDeleteData: 'データを削除',
  menuLegal: 'プライバシーポリシー ・ 利用規約',
  howToTitle: '使い方',
  howToTagline: 'ショートの真逆を、静かにやる。',
  howToSteps: [
    '通知が来たら、3分以内に脱ドパをはじめる。',
    'スキップせず、ロング映像を最後まで見る。',
    'それ以外の時間も、ショートの代わりにロングへ。',
  ],
  raidResultTitle: '本日の脱ドパ記録',
  raidResultLine: '虚無に耐えた時間だけ、少し戻ってくる。',
  longResultTitle: '本日の脱ドパ記録',
  longResultLine: '虚無に耐えた時間だけ、少し戻ってくる。',
} as const;

export const englishLabels = {
  stimulationMeter: 'Stimulation Meter',
  dailyRaid: 'Daily Raid',
  latestResult: 'Latest Result',
  lastSevenDays: 'Last 7 Days',
  longWatch: 'Long Watch',
  settings: 'Settings',
  gettingStarted: 'Getting Started',
  premiumPreview: 'Premium Preview',
  sessionResult: 'Session Result',
  longSessionResult: 'Long Session Result',
} as const;

// オンボーディング（初回起動時のみ）。説明ではなく、自分ごと化の導線。
export const onboardingCopy = {
  start: {
    title: 'さっそく、ドパ中毒から離れよう',
    subtitle: 'ショートの逆をやるアプリです。',
    cta: 'はじめる',
  },
  problem: {
    title: '気づいたら、またショートを開いている。',
    subtitle: '短い刺激は、思っているより静かに時間を奪います。',
    cta: '次へ',
  },
  usage: {
    title: '1日にどれくらいショート動画を見ていますか？',
  },
  loss: {
    monthlyPrefix: '今、月に約',
    monthlyBody: 'ショートに消えています。',
    lifetimeBefore: 'このままでは、人生で',
    lifetimeAfter: 'の自発的な時間を失うかもしれません。',
    recover: '脱ドパを使えば、その時間を少しずつ取り返せます。',
    cta: '次へ',
  },
  motto: {
    title: '脱ドパは、ショートの逆をやるアプリ。',
    subtitle: 'スマホの刺激から離れるアプリです。',
    principles: ['長い映像を見る', 'スキップしない', 'スマホから離れる', '同じ時間にみんなで見る'],
    cta: '次へ',
  },
  firstLong: {
    title: 'まずは、脱ドパロングを視聴しよう。',
    subtitle: '短い刺激から離れて、静かな映像に切り替えます。',
    cta: '脱ドパロングをはじめる',
  },
  raid: {
    title: '毎日、ドーパミンが出ない映像をみんなで見て、スマホから離れよう。',
    subtitle: '同じ時間に、同じ映像を見るだけ。',
    cta: '次へ',
  },
  done: {
    title: '準備完了。',
    subtitle: 'まずは1本、ショートの逆を見てみよう。',
    cta: '最初の脱ドパロングを視聴する',
  },
  back: '戻る',
} as const;

export const LONG_VIDEO_META_LABEL = '余白のあるロング映像';

export const LONG_VIDEO_DEFAULT_NOTE = '低刺激ロング。静かな空間に浸り、脳に余白を戻す。';

export const RAID_PLAYER_NOTE = 'スキップ不可。何かが起きそうで、何も起きない3分。みんなでクールダウン。';

export const LONG_EXIT_CONFIRM = {
  title: '視聴をやめる？',
  message: '視聴をやめるとドパガキのままですがよろしいですか？',
  continue: '続ける',
  quit: 'はい、やめる',
} as const;

// ホームのカード群
export const homeCopy = {
  scoreLabel: 'あなたのドパガキ度',
  titleLabel: 'あなたのドパガキ称号',
  shareLabel: 'ドパるけど共有する',
  deltaYesterday: '昨日から',
  deltaLastWeek: '先週から',
  deltaLastMonth: '先月から',
  weeklyTitle: '今週のドパ収支',
  weeklyFailedLabel: '脱ドパに失敗した時間',
  weeklyReclaimedLabel: '取り戻した時間',
  weeklyProjectionPrefix: 'このままのペースでいくと',
  weeklyProjectionSuffix: 'の豊かな時間が生まれそう',
  recordTitle: '脱ドパ記録',
  streakSuffix: '日連続で脱ドパ中！',
  streakNone: '今日から連続記録をはじめよう。',
  calendarHint: 'ロングを完走した日にスタンプがつく。',
} as const;

// ドパガキ度が上がる操作をしたときの警告演出
export const dopaSpikeCopy = {
  scroll: 'スクロール脳が疼いた',
  skip: 'スキップは幻',
  speed: '倍速などない',
  share: 'ドパった',
} as const;

// 完走時のパチンコ風セレブレーション
export const celebrationCopy = {
  headline: '脱ドパ大当たり',
  sub: '完走おめでとう。脳に余白が戻った。',
} as const;

// リザルトの「管理人からのひとこと」
export const adminComments = {
  success: [
    '1時間も耐えてる間何してたん？',
    'その虚無、悪くなかったやろ。',
    'スクロールしなかった指、ちょっとかっこよかった。',
    '脳のシワに余白が戻ったのを確認しました。',
    '今日のきみ、ドパガキ卒業の見込みあり。',
    '何も起きない映像に勝った。実質優勝。',
  ],
  failure: [
    '指が先に動いたか。まだドパが濃いな。',
    'スキップして得た3秒で、何を得たん？',
    '途中でやめても、虚無は逃げないから安心して。',
    'また明日、虚無で待ってる。',
    '惜しい。ドパガキ度はしっかり上がっといたで。',
  ],
} as const;

export const resultCopy = {
  reclaimedLabel: '脱ドパできた時間',
  scoreLabel: 'ドパガキ度',
  adminLabel: '管理人からのひとこと',
  screenshotLabel: 'スクショ',
  homeLabel: 'ホームへ戻る',
  screenshotAlertTitle: 'スクショタイム',
  screenshotAlertBody: 'この画面はスクショOK。端末のスクリーンショットでどうぞ。ちなみにスクショではドパガキ度は上がりません。',
} as const;

export const menuCopy = {
  titlesSectionTitle: '称号コレクション',
  titlesHint: '共有時に見せる称号をひとつ選べる。ドパガキ度やロング視聴で増えていく。',
  titlesLockedLabel: '???',
  shareSectionLabel: '現状を共有する',
} as const;

export const titles = [
  '虚無レイド参加者',
  '通知だけ見た人',
  '42秒で離脱した者',
  '準・虚無耐久者',
  'スクロールに魂を売った者',
  '本日のレイド完走者',
  '静寂に3分耐えた者',
  '虚無を見つめし者',
  '途中離脱の達人',
];

export const comments = [
  'ショートの逆を、今日はどこまで続けたか。',
  'スクロールする代わりに、止まる。',
  '通知を見た時点で、レイドは始まっている。',
  '完走しても、中断しても、今日の記録。',
  '今日はまだ、取り返せる。',
  '虚無に耐えた時間だけ、少し戻ってくる。',
  '低刺激に、どれだけ浸れるか。',
];
