
export type SocialTimeSlot = 'morning' | 'lunch' | 'evening' | 'before_bed' | 'late_night' | 'custom';
export type NotificationTone = 'gentle' | 'normal' | 'strong';

export type UserSettings = {
  onboardingCompleted: boolean;
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
