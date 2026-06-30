
export type SocialTimeSlot = 'morning' | 'lunch' | 'evening' | 'before_bed' | 'late_night' | 'custom';
export type NotificationTone = 'gentle' | 'normal' | 'strong';
export type FrameColorId = 'moss' | 'sage' | 'sand' | 'mist' | 'dusk';

export type UserSettings = {
  onboardingCompleted: boolean;
  nickname: string;
  frameColorId: FrameColorId;
  socialTimeSlot: SocialTimeSlot;
  customSocialTimeLabel?: string;
  raidTime: string;
  notificationEnabled: boolean;
  notificationTone: NotificationTone;
  raidDurationSeconds: number;
};

export type PremiumStatus = {
  isPremium: boolean;
  planName: string;
  jokeAdsMultiplier: number;
};
