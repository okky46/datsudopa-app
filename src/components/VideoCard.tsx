
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LONG_VIDEO_META_LABEL } from '../constants/copy';
import { colors, radius, shadows, spacing, typography } from '../constants/theme';
import { VideoAsset, VideoMood } from '../types/video';
import { SoftGradient } from './ui/SoftGradient';

type Props = {
  video: VideoAsset;
  selected?: boolean;
  onPress?: () => void;
  // hero: ロング画面の大きな主役カード / default: リスト用の小さめカード
  variant?: 'default' | 'hero';
  interactive?: boolean;
  compact?: boolean;
  heroHeight?: number;
};

// ムードごとに、夕暮れ・雨・夜などのチルで美しい色調をグラデーションで表現する。
const moodTone: Record<VideoMood, { sky: string[]; ground: string; label: string }> = {
  chill: { sky: ['#3A4A6B', '#5E6E8C', '#9AA6BE'], ground: '#2A3242', label: 'chill' },
  liminal: { sky: ['#3B4156', '#5A6276', '#8B92A6'], ground: '#272C3A', label: 'liminal' },
  walk: { sky: ['#46405A', '#6E6480', '#A89BB0'], ground: '#2E2A38', label: 'night walk' },
  night: { sky: ['#232A45', '#3A4366', '#6E7799'], ground: '#1C2236', label: 'night' },
  rain: { sky: ['#34465A', '#566A80', '#8FA2B4'], ground: '#26323E', label: 'rain' },
  station: { sky: ['#4A4E68', '#6E708A', '#A7A3B4'], ground: '#33343F', label: 'station' },
  empty_city: { sky: ['#3C3E52', '#5C5E74', '#9496A8'], ground: '#2A2C36', label: 'empty city' },
  corridor: { sky: ['#3A4448', '#5C6A6E', '#94A2A4'], ground: '#2A3234', label: 'corridor' },
  parking: { sky: ['#363B48', '#565C6E', '#8E94A4'], ground: '#272B34', label: 'parking' },
};


export function VideoCard({
  video,
  selected = false,
  onPress,
  variant = 'default',
  interactive = true,
  compact = false,
  heroHeight,
}: Props) {
  const tone = moodTone[video.mood] ?? moodTone.chill;
  const isHero = variant === 'hero';
  const canPress = interactive && !!onPress;

  const thumb = (
    <View
      style={[
        styles.thumb,
        isHero
          ? { height: heroHeight ?? (compact ? 148 : 252) }
          : styles.thumbDefault,
      ]}
    >
      <SoftGradient colors={tone.sky} direction="vertical" style={StyleSheet.absoluteFill} steps={24} />
      <View style={[styles.ground, { backgroundColor: tone.ground }]} />
      <View style={styles.horizonGlow} />
      {!isHero && (
        <>
          <View style={styles.moodTag}>
            <Text style={styles.moodTagText}>{tone.label}</Text>
          </View>
          {selected && (
            <View style={styles.check}>
              <View style={styles.checkDot} />
            </View>
          )}
        </>
      )}
    </View>
  );

  return (
    <Pressable
      onPress={canPress ? onPress : undefined}
      disabled={!canPress}
      style={({ pressed }) => [
        styles.card,
        isHero && styles.cardHero,
        selected && !isHero && styles.selected,
        canPress && pressed && styles.pressed,
      ]}
    >
      {thumb}
      {!isHero && (
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1}>
            {video.title}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {(video.creatorName || 'unknown') + ' ・ ' + LONG_VIDEO_META_LABEL}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardHero: {
    borderRadius: radius.lg,
    ...shadows.hero,
  },
  selected: {
    borderColor: colors.accentBorder,
  },
  pressed: {
    opacity: 0.9,
  },
  thumb: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbDefault: {
    height: 150,
  },
  ground: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '34%',
    opacity: 0.92,
  },
  horizonGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '60%',
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  moodTag: {
    position: 'absolute',
    left: spacing.md,
    bottom: spacing.md,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(12, 16, 14, 0.42)',
  },
  moodTagText: {
    color: 'rgba(244, 247, 251, 0.92)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  check: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDot: {
    width: 9,
    height: 9,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  body: {
    gap: 2,
    padding: spacing.md,
  },
  title: {
    color: colors.text,
    ...typography.title,
  },
  meta: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '500',
  },
});
