
export type SocialTimeSlot = 'early_morning' | 'morning' | 'noon' | 'evening' | 'night' | 'late_night';

export type AvatarColorId = 'mint' | 'lavender' | 'pink' | 'blue' | 'yellow';

export type UserSettings = {
  onboardingCompleted: boolean;
  nickname: string;
  avatarColorId: AvatarColorId;
  socialTimeSlot: SocialTimeSlot;
  customSocialTimeLabel?: string;
  raidTime: string;
  customTimeStart?: string;
  customTimeEnd?: string;
  notificationEnabled: boolean;
  raidDurationSeconds: number;
  // 共有時に見せるドパガキ称号（メニューで選択）
  selectedTitleId?: string;
};

export type PremiumStatus = {
  isPremium: boolean;
  planName: string;
  jokeAdsMultiplier: number;
};
