
import { NotificationTone, SocialTimeSlot } from '../types/settings';

export const RAID_START_WINDOW_SECONDS = 180;
export const DEFAULT_RAID_DURATION_SECONDS = 180;

export const SOCIAL_TIME_OPTIONS: Array<{ value: SocialTimeSlot; label: string; defaultTime: string }> = [
  { value: 'morning', label: '朝起きた直後', defaultTime: '07:30' },
  { value: 'lunch', label: '昼休み', defaultTime: '12:20' },
  { value: 'evening', label: '帰宅後', defaultTime: '19:30' },
  { value: 'before_bed', label: '寝る前', defaultTime: '23:00' },
  { value: 'late_night', label: '深夜', defaultTime: '01:00' },
  { value: 'custom', label: '自分で指定', defaultTime: '21:00' },
];

export const NOTIFICATION_TONE_OPTIONS: Array<{ value: NotificationTone; label: string }> = [
  { value: 'gentle', label: 'やさしめ' },
  { value: 'normal', label: '普通' },
  { value: 'strong', label: '強め' },
];
