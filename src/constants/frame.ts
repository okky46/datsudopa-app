
import { Platform } from 'react-native';
import { FrameColorId } from '../types/settings';

export const FRAME_BORDER_WIDTH = 5;

export const SCREEN_CORNER_RADIUS = Platform.select({
  ios: 39,
  android: 28,
  default: 32,
}) ?? 32;

export const FRAME_COLOR_OPTIONS: Array<{ id: FrameColorId; label: string; color: string }> = [
  { id: 'moss', label: '苔緑', color: '#8FAF8A' },
  { id: 'sage', label: 'さざれ草', color: '#A8C5A0' },
  { id: 'sand', label: '砂色', color: '#C9B88A' },
  { id: 'mist', label: '靄ブルー', color: '#9BB8C9' },
  { id: 'dusk', label: '夕暮れ', color: '#C9A0A8' },
];

export const DEFAULT_FRAME_COLOR_ID: FrameColorId = 'moss';

export const RAINBOW_SEGMENTS = ['#FF6B6B', '#FFD166', '#06D6A0', '#4CC9F0', '#9B5DE5', '#FF8CC8', '#FF6B6B'] as const;

export function getFrameColor(id: FrameColorId): string {
  return FRAME_COLOR_OPTIONS.find((option) => option.id === id)?.color ?? FRAME_COLOR_OPTIONS[0].color;
}
