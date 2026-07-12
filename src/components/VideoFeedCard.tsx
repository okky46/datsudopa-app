
import { StyleSheet, Text, View } from 'react-native';
import { LONG_VIDEO_META_LABEL } from '../constants/copy';
import { colors, fontFamily, radius, shadows, spacing, typography } from '../constants/theme';
import { VideoAsset } from '../types/video';
import { PressableScale } from './ui/Motion';
import { SoftGradient } from './ui/SoftGradient';
import { moodTone } from './VideoCard';

type Props = {
  video: VideoAsset;
  durationLabel: string;
  recommended?: boolean;
  onPress: () => void;
};

function PlayTriangle() {
  return <View style={styles.playTriangle} />;
}

// YouTubeのフィードを思わせる大きなサムネイル+情報行のカード。
// ただし中身はアンチテーゼ: 再生回数もいいねもなく、「スキップ不可」だけが書いてある。
export function VideoFeedCard({ video, durationLabel, recommended = false, onPress }: Props) {
  const tone = moodTone[video.mood] ?? moodTone.chill;

  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={`${video.title}を再生`} onPress={onPress} style={styles.card}>
      <View style={styles.thumb}>
        <SoftGradient colors={tone.sky} direction="vertical" style={StyleSheet.absoluteFill} steps={24} />
        <View style={[styles.ground, { backgroundColor: tone.ground }]} />
        <View style={styles.horizonGlow} />

        <View style={styles.playBadge}>
          <PlayTriangle />
        </View>

        {recommended && (
          <View style={styles.recommendTag}>
            <Text style={styles.recommendTagText}>今日の映像</Text>
          </View>
        )}

        <View style={styles.durationTag}>
          <Text style={styles.durationTagText}>{durationLabel}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {video.title}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta} numberOfLines={1}>
            {(video.creatorName || 'unknown') + ' ・ ' + LONG_VIDEO_META_LABEL}
          </Text>
          <Text style={styles.noSkip}>スキップ不可</Text>
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.soft,
  },
  thumb: {
    height: 176,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
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
  playBadge: {
    width: 52,
    height: 52,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.82)',
  },
  playTriangle: {
    width: 0,
    height: 0,
    borderTopWidth: 9,
    borderBottomWidth: 9,
    borderLeftWidth: 15,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: colors.onPrimary,
    marginLeft: 4,
  },
  recommendTag: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.88)',
  },
  recommendTagText: {
    color: colors.onPrimary,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
  },
  durationTag: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(12, 16, 14, 0.66)',
  },
  durationTagText: {
    color: 'rgba(244, 247, 251, 0.95)',
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  body: {
    gap: 4,
    padding: spacing.md,
  },
  title: {
    color: colors.text,
    ...typography.title,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  meta: {
    flex: 1,
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fontFamily.medium,
  },
  noSkip: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
    letterSpacing: 0.4,
  },
});
