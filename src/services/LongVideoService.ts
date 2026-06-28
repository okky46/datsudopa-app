
import { videoAssets } from '../constants/videos';
import { VideoAsset, VideoWatchRecord, WatchDurationOption, WatchMode } from '../types/video';

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

  static resolveDuration(option: WatchDurationOption): number {
    if (option === 'random') {
      const values = [60, 180, 300, 600, 1800];
      return values[Math.floor(Math.random() * values.length)];
    }
    return option;
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
