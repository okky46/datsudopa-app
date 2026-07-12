
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdBanner } from '../../src/components/AdBanner';
import { VideoFeedCard } from '../../src/components/VideoFeedCard';
import { Chip } from '../../src/components/ui/Chip';
import { DurationSlider } from '../../src/components/ui/DurationSlider';
import { EnterCard } from '../../src/components/ui/Motion';
import { screenCopy } from '../../src/constants/copy';
import { colors, fontFamily, radius, spacing, typography } from '../../src/constants/theme';
import { LONG_DURATION_DEFAULT_SECONDS, LongVideoService } from '../../src/services/LongVideoService';
import { VideoAsset } from '../../src/types/video';

const DURATION_PRESETS = [
  { label: '3分', seconds: 180 },
  { label: '10分', seconds: 600 },
  { label: '30分', seconds: 1800 },
  { label: '60分', seconds: 3600 },
] as const;

function ShuffleGlyph() {
  return (
    <View style={styles.shuffle}>
      <View style={styles.shuffleLine} />
      <View style={[styles.shuffleLine, styles.shuffleLine2]} />
    </View>
  );
}

function LockGlyph() {
  return (
    <View style={styles.lock}>
      <View style={styles.lockShackle} />
      <View style={styles.lockBody} />
    </View>
  );
}

export default function LongScreen() {
  const videos = useMemo(() => LongVideoService.listVideos(), []);
  const recommended = useMemo(() => LongVideoService.getRecommendedVideo(), []);
  const [durationSeconds, setDurationSeconds] = useState(LONG_DURATION_DEFAULT_SECONDS);

  const durationMinutes = LongVideoService.minutesFromSeconds(durationSeconds);
  const durationLabel = `${durationMinutes}分`;

  const ordered = useMemo(
    () => [recommended, ...videos.filter((video) => video.id !== recommended.id)],
    [recommended, videos],
  );

  const play = (video: VideoAsset) => {
    router.push({
      pathname: '/raid/active',
      params: { mode: 'normal', videoId: video.id, duration: String(durationSeconds) },
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>{screenCopy.longTitle}</Text>
        <View style={styles.lockRow}>
          <LockGlyph />
          <Text style={styles.lockText}>スキップ不可・倍速なし・次の動画もなし</Text>
        </View>
      </View>

      <View style={styles.durationPanel}>
        <View style={styles.durationHead}>
          <Text style={styles.durationLabel}>{screenCopy.longDurationSectionLabel}</Text>
          <View style={styles.presetRow}>
            <Chip
              label="ランダム"
              compact
              icon={<ShuffleGlyph />}
              onPress={() => setDurationSeconds(LongVideoService.randomDurationSeconds())}
            />
            {DURATION_PRESETS.map((preset) => (
              <Chip
                key={preset.label}
                label={preset.label}
                compact
                selected={durationSeconds === preset.seconds}
                onPress={() => setDurationSeconds(preset.seconds)}
              />
            ))}
          </View>
        </View>
        <DurationSlider valueMinutes={durationMinutes} onChange={(minutes) => setDurationSeconds(minutes * 60)} compact />
      </View>

      <ScrollView style={styles.feed} contentContainerStyle={styles.feedContent} showsVerticalScrollIndicator={false}>
        {ordered.map((video, index) => (
          <EnterCard key={video.id} index={index}>
            <VideoFeedCard
              video={video}
              durationLabel={durationLabel}
              recommended={video.id === recommended.id}
              onPress={() => play(video)}
            />
          </EnterCard>
        ))}

        <Text style={styles.description}>{screenCopy.longDescription}</Text>
        <AdBanner />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    gap: 4,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    alignItems: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    fontFamily: fontFamily.black,
    letterSpacing: -0.3,
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  lockText: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: fontFamily.medium,
  },
  lock: {
    width: 12,
    alignItems: 'center',
  },
  lockShackle: {
    width: 7,
    height: 6,
    borderWidth: 1.4,
    borderBottomWidth: 0,
    borderColor: colors.textSubtle,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  lockBody: {
    width: 11,
    height: 8,
    borderRadius: 2,
    marginTop: -1,
    backgroundColor: colors.textSubtle,
  },
  durationPanel: {
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  durationHead: {
    gap: spacing.xs,
  },
  durationLabel: {
    color: colors.textMuted,
    ...typography.label,
    paddingHorizontal: spacing.xs,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  feed: {
    flex: 1,
  },
  feedContent: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: 120,
  },
  description: {
    color: colors.textSubtle,
    ...typography.caption,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  shuffle: {
    width: 13,
    height: 10,
    justifyContent: 'space-between',
  },
  shuffleLine: {
    width: 13,
    height: 1.6,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
    transform: [{ rotate: '-8deg' }],
  },
  shuffleLine2: {
    transform: [{ rotate: '8deg' }],
  },
});
