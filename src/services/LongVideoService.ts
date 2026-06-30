
import { videoAssets } from '../constants/videos';
import { VideoAsset, VideoWatchRecord, WatchMode } from '../types/video';
import {
  LONG_DURATION_DEFAULT_MINUTES,
  LONG_DURATION_MAX_MINUTES,
  LONG_DURATION_MIN_MINUTES,
  randomDurationMinutes,
  snapToDurationStep,
} from '../utils/durationSteps';

export const LONG_DURATION_DEFAULT_SECONDS = LONG_DURATION_DEFAULT_MINUTES * 60;

export { LONG_DURATION_MAX_MINUTES, LONG_DURATION_MIN_MINUTES };

export class LongVideoService {
  static listVideos(): VideoAsset[] {
    return videoAssets;
  }

  static getRecommendedVideo(date = new Date()): VideoAsset {
    const index = date.getDate() % videoAssets.length;
    return videoAssets[index];
  }

  static findById(id?: string): VideoAsset {
    return videoAssets.find((video) => video.id === id) || LongVideoService.getRecommendedVideo();
  }

  static pickRandomVideo(): VideoAsset {
    return videoAssets[Math.floor(Math.random() * videoAssets.length)];
  }

  static randomDurationSeconds(): number {
    return randomDurationMinutes() * 60;
  }

  static clampDurationSeconds(seconds: number): number {
    const minutes = snapToDurationStep(Math.round(seconds / 60));
    return minutes * 60;
  }

  static minutesFromSeconds(seconds: number): number {
    return snapToDurationStep(Math.round(seconds / 60));
  }

  static createWatchRecord(input: {
    videoId: string;
    mode: WatchMode;
    targetSeconds: number;
    completed: boolean;
  }): VideoWatchRecord {
    return {
      id: input.mode + '-' + input.videoId + '-' + Date.now(),
      videoId: input.videoId,
      mode: input.mode,
      watchedAt: new Date().toISOString(),
      targetSeconds: input.targetSeconds,
      completed: input.completed,
    };
  }
}
