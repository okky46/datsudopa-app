
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdBanner } from '../../src/components/AdBanner';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { VideoCard } from '../../src/components/VideoCard';
import { Chip } from '../../src/components/ui/Chip';
import { colors, spacing, typography } from '../../src/constants/theme';
import { LongVideoService } from '../../src/services/LongVideoService';
import { VideoAsset, WatchDurationOption } from '../../src/types/video';

const durationOptions: Array<{ label: string; value: WatchDurationOption; shuffle?: boolean }> = [
  { label: 'ランダム', value: 'random', shuffle: true },
  { label: '3分', value: 180 },
  { label: '10分', value: 600 },
  { label: '30分', value: 1800 },
];

function durationMinutes(value: WatchDurationOption): string {
  if (value === 'random') return '3分';
  return `${Math.round(value / 60)}分`;
}

function ShuffleGlyph() {
  return (
    <View style={styles.shuffle}>
      <View style={styles.shuffleLine} />
      <View style={[styles.shuffleLine, styles.shuffleLine2]} />
    </View>
  );
}

function PlayTriangle() {
  return <View style={styles.playTriangle} />;
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
  const [selectedVideo, setSelectedVideo] = useState<VideoAsset>(recommended);
  const [duration, setDuration] = useState<WatchDurationOption>(180);
  const others = videos.filter((video) => video.id !== recommended.id);

  const start = () => {
    const seconds = LongVideoService.resolveDuration(duration);
    router.push({ pathname: '/raid/active', params: { mode: 'normal', videoId: selectedVideo.id, duration: String(seconds) } });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>今日のロング ✨</Text>
          <Text style={styles.subtitle}>
            {selectedVideo.title} / {durationMinutes(duration)}
          </Text>
        </View>

        <VideoCard
          video={selectedVideo}
          variant="hero"
          selected
          onPress={() => router.push({ pathname: '/raid/active', params: { mode: 'normal', videoId: selectedVideo.id, duration: String(LongVideoService.resolveDuration(duration)) } })}
        />

        <Text style={styles.kicker}>時間を選ぶ</Text>
        <View style={styles.durationRow}>
          {durationOptions.map((option) => (
            <Chip
              key={option.label}
              label={option.label}
              selected={duration === option.value}
              icon={option.shuffle ? <ShuffleGlyph /> : undefined}
              onPress={() => setDuration(option.value)}
            />
          ))}
        </View>

        <PrimaryButton label="再生する" variant="gradient" onPress={start} icon={<PlayTriangle />} style={styles.playButton} />
        <View style={styles.lockRow}>
          <LockGlyph />
          <Text style={styles.lockText}>スキップ不可</Text>
        </View>

        {others.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.kicker}>ほかの虚無</Text>
            <View style={styles.list}>
              {others.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  selected={selectedVideo.id === video.id}
                  onPress={() => setSelectedVideo(video)}
                />
              ))}
            </View>
          </View>
        )}

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
  content: {
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 120,
  },
  header: {
    gap: 6,
    alignItems: 'center',
  },
  title: {
    color: colors.text,
    ...typography.h1,
  },
  subtitle: {
    color: colors.textSubtle,
    ...typography.caption,
  },
  section: {
    gap: spacing.sm,
  },
  kicker: {
    color: colors.textMuted,
    ...typography.label,
    paddingHorizontal: spacing.xs,
  },
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  playButton: {
    marginTop: spacing.xs,
  },
  playTriangle: {
    width: 0,
    height: 0,
    borderTopWidth: 7,
    borderBottomWidth: 7,
    borderLeftWidth: 12,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: colors.text,
    marginLeft: 2,
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: -spacing.sm,
  },
  lockText: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '600',
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
  list: {
    gap: spacing.md,
  },
});
