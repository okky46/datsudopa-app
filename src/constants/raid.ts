
import { SocialTimeSlot } from '../types/settings';

export const RAID_START_WINDOW_SECONDS = 180;
export const DEFAULT_RAID_DURATION_SECONDS = 180;
export const RAID_NOTIFICATION_SCHEDULE_DAYS = 7;

/** 同じ時間帯を選んだユーザーが揃いやすいよう、日付で候補スロットを選ぶ */
export const RAID_TIME_SLOT_CANDIDATES: Record<SocialTimeSlot, string[]> = {
  early_morning: ['05:10', '05:35', '06:00', '06:25', '06:50', '07:10', '07:30'],
  morning: ['07:15', '07:40', '08:05', '08:30', '08:55', '09:15', '09:40'],
  noon: ['11:35', '11:55', '12:15', '12:35', '12:55', '13:10', '13:25'],
  evening: ['17:05', '17:35', '18:05', '18:35', '19:05', '19:35', '20:05'],
  night: ['21:05', '21:35', '22:05', '22:25', '22:45', '23:00', '23:30'],
  late_night: ['00:10', '00:35', '01:00', '01:25', '01:50', '02:10', '02:30'],
};

export const SOCIAL_TIME_OPTIONS: Array<{ value: SocialTimeSlot; label: string; defaultTime: string }> = [
  { value: 'early_morning', label: '早朝', defaultTime: '06:30' },
  { value: 'morning', label: '朝', defaultTime: '08:00' },
  { value: 'noon', label: '昼', defaultTime: '12:20' },
  { value: 'evening', label: '夕方', defaultTime: '19:00' },
  { value: 'night', label: '夜', defaultTime: '23:00' },
  { value: 'late_night', label: '深夜', defaultTime: '01:00' },
];
