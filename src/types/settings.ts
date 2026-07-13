
export type UserSettings = {
  onboardingCompleted: boolean;
  /** 公開ユーザーネーム（同行者表示・SNS共有画像に使用） */
  publicName: string;
  notificationEnabled: boolean;
  /** オンボーディングで自己申告したショート利用時間のID */
  shortsUsageId: string;
};
