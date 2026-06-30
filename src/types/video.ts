
export type VideoMood =
  | 'chill'
  | 'liminal'
  | 'walk'
  | 'night'
  | 'rain'
  | 'station'
  | 'empty_city'
  | 'corridor'
  | 'parking';

export type VideoAsset = {
  id: string;
  title: string;
  description?: string;
  sourceType: 'local' | 'remote' | 'generated_placeholder' | 'user_uploaded';
  uri: string;
  durationSeconds?: number;
  mood: VideoMood;
  isPremium?: boolean;
  creatorName?: string;
};

export type WatchMode = 'raid' | 'normal';

export type WatchDurationOption = 'random' | 60 | 180 | 300 | 600 | 1800;

export type VideoWatchRecord = {
  id: string;
  videoId: string;
  mode: WatchMode;
  watchedAt: string;
  targetSeconds: number;
  completed: boolean;
};
