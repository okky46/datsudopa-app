
export type RaidHomeStatus = 'not_started' | 'available' | 'completed' | 'failed' | 'missed';

export type CurrentRaidState = {
  date: string;
  scheduledRaidTime: string;
  notificationSentAt?: string;
  startedAt?: string;
  status: RaidHomeStatus;
  targetSeconds: number;
  videoId?: string;
};

export type RaidStatusView = {
  status: RaidHomeStatus;
  label: string;
  canStart: boolean;
  remainingText: string;
  scheduledDate: Date;
  raidTime: string;
  windowSecondsLeft: number;
};
