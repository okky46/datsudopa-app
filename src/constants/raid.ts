
// 公式レイドの時刻・時間パラメータ。MVPでは毎日22:00 JST固定。

export const RAID_HOUR_JST = 22;

/** 通知から開始できる猶予（22:00:00〜22:02:59） */
export const RAID_START_WINDOW_SECONDS = 180;

/** 公式レイドの視聴時間 */
export const RAID_DURATION_SECONDS = 180;

/** ローカル通知を先行スケジュールする日数 */
export const RAID_NOTIFICATION_SCHEDULE_DAYS = 7;

/** 連続脱ドパ日数としてカウントする1日の最低視聴秒数 */
export const STREAK_MIN_SECONDS_PER_DAY = 180;
