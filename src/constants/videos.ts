
import { VideoAsset } from '../types/video';

export const videoAssets: VideoAsset[] = [
  {
    id: 'generated-empty-station',
    title: '誰もいない駅の明かり',
    sourceType: 'generated_placeholder',
    uri: 'generated://empty-station',
    durationSeconds: 45,
    mood: 'station',
    creatorName: 'Datsudopa Lab',
  },
  {
    id: 'generated-rain-road',
    title: '雨上がりの道路',
    sourceType: 'generated_placeholder',
    uri: 'generated://rain-road',
    durationSeconds: 50,
    mood: 'rain',
    creatorName: 'Datsudopa Lab',
  },
  {
    id: 'generated-corridor',
    title: '蛍光灯の廊下',
    sourceType: 'generated_placeholder',
    uri: 'generated://corridor',
    durationSeconds: 40,
    mood: 'corridor',
    creatorName: 'Datsudopa Lab',
  },
  {
    id: 'remote-sample-night-walk',
    title: 'リモート動画placeholder',
    sourceType: 'remote',
    uri: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    durationSeconds: 15,
    mood: 'walk',
    creatorName: 'Sample CDN',
  },
];
