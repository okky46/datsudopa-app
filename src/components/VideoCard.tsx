
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../constants/theme';
import { VideoAsset, VideoMood } from '../types/video';

type Props = {
  video: VideoAsset;
  selected?: boolean;
  onPress: () => void;
};

// ムードごとに静かなトーンを与える（夜・雨・廊下…のリミナルな空気感）
const moodTone: Record<VideoMood, { base: string; glow: string; line: string; label: string }> = {
  chill: { base: '#2A3A33', glow: 'rgba(143,175,138,0.30)', line: 'rgba(244,247,251,0.16)', label: 'chill' },
  liminal: { base: '#2E3340', glow: 'rgba(159,196,214,0.28)', line: 'rgba(244,247,251,0.16)', label: 'liminal' },
  walk: { base: '#33302A', glow: 'rgba(201,184,138,0.26)', line: 'rgba(244,247,251,0.14)', label: 'night walk' },
  night: { base: '#23283A', glow: 'rgba(159,196,214,0.24)', line: 'rgba(244,247,251,0.14)', label: 'night' },
  rain: { base: '#28323A', glow: 'rgba(159,196,214,0.30)', line: 'rgba(244,247,251,0.18)', label: 'rain' },
  station: { base: '#2C3330', glow: 'rgba(201,184,138,0.24)', line: 'rgba(244,247,251,0.18)', label: 'station' },
  empty_city: { base: '#2A2E33', glow: 'rgba(183,168,216,0.22)', line: 'rgba(244,247,251,0.14)', label: 'empty city' },
  corridor: { base: '#2E3330', glow: 'rgba(143,175,138,0.22)', line: 'rgba(244,247,251,0.20)', label: 'corridor' },
  parking: { base: '#2B2F36', glow: 'rgba(159,196,214,0.20)', line: 'rgba(244,247,251,0.14)', label: 'parking' },
};

export function VideoCard({ video, selected = false, onPress }: Props) {
  const tone = moodTone[video.mood] ?? moodTone.chill;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, selected && styles.selected, pressed && styles.pressed]}>
      <View style={[styles.thumb, { backgroundColor: tone.base }]}>
        <View style={[styles.glow, { backgroundColor: tone.glow }]} />
        <View style={[styles.horizon, { backgroundColor: tone.line }]} />
        <View style={styles.moodTag}>
          <Text style={styles.moodTagText}>{tone.label}</Text>
        </View>
        {selected && (
          <View style={styles.check}>
            <View style={styles.checkDot} />
          </View>
        )}
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {video.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {(video.creatorName || 'unknown') + ' ・ 何も起きない映像'}
        </Text>
      </View>
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
  selected: {
    borderColor: colors.accentBorder,
  },
  pressed: {
    opacity: 0.85,
  },
  thumb: {
    height: 150,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 999,
    transform: [{ scaleX: 1.6 }],
    opacity: 0.9,
  },
  horizon: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '60%',
    height: 1,
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
