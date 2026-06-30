
export type SocialTimeSlot = 'early_morning' | 'morning' | 'noon' | 'evening' | 'night' | 'late_night';
export type FrameColorId = 'moss' | 'sage' | 'sand' | 'mist' | 'dusk';

export type UserSettings = {
  onboardingCompleted: boolean;
  nickname: string;
  frameColorId: FrameColorId;
  socialTimeSlot: SocialTimeSlot;
  customSocialTimeLabel?: string;
  raidTime: string;
  customTimeStart?: string;
  customTimeEnd?: string;
  notificationEnabled: boolean;
  raidDurationSeconds: number;
};

export type PremiumStatus = {
  isPremium: boolean;
  planName: string;
  jokeAdsMultiplier: number;
};
