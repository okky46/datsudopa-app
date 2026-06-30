
import { NotificationTone } from '../types/settings';

export const APP_CATCHPHRASE = '刺激から、静かへ。';

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

export const LONG_VIDEO_DEFAULT_NOTE = '刺激がないことに、少しだけ耐える時間。';

export const LONG_EXIT_CONFIRM = {
  title: '本当にやめますか？',
  message: 'やめたらドパガキのままだよ。今の静けさは、指先ひとつで消える。',
  continue: '続ける',
  quit: 'やめる',
} as const;

export const titles = [
  '脱ドパ修行僧',
  '通知だけ見た人',
  '42秒の逃亡者',
  '準・脱ドパ僧',
  'スクロールに魂を売った者',
  '本日のレイド完走者',
  '静寂に3分耐えた者',
  '虚無を見つめし者',
  '逃亡ログ保有者',
];

export const comments = [
  '3分、何もしない。それが一番むずい。',
  'スクロールは祈りではない。',
  '通知を見た時点で、もう始まっている。',
  '逃げても記録は残る。',
  '今日はまだ、取り返せる。',
  '虚無に耐えた時間だけ、少し戻ってくる。',
  '刺激がないことに、耐えられるか。',
];

export const notificationBodies: Record<NotificationTone, string[]> = {
  gentle: [
    'そろそろ静かな3分です。画面の奥に避難しましょう。',
    '今日の脱ドパレイドが来ました。無理なく、でも逃げずに。',
  ],
  normal: [
    '通知を見た時点で、もう始まっています。3分以内に集合。',
    '本日の脱ドパレイド。スクロールではなく、虚無へ。',
  ],
  strong: [
    '今逃げると記録に残ります。脱ドパレイド、3分以内。',
    'スクロールに魂を売る前に集合。今日のレイド開始です。',
  ],
};
