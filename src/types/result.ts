
export type DailyResultStatus = 'completed' | 'escaped' | 'missed';
export type DailyResultMode = 'raid' | 'normal';
export type FailureReason =
  | 'late'
  | 'emergency_exit'
  | 'backgrounded'
  | 'closed'
  | 'manual_exit'
  | 'none';

export type DailyResult = {
  date: string;
  status: DailyResultStatus;
  mode: DailyResultMode;
  raidStartedAt?: string;
  raidEndedAt?: string;
  scheduledRaidTime?: string;
  targetSeconds: number;
  watchedSeconds: number;
  videoId?: string;
  failureReason?: FailureReason;
  dopamineScore: number;
  title: string;
  comment: string;
  shared: boolean;
};
