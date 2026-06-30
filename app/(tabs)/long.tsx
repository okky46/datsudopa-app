
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdBanner } from '../../src/components/AdBanner';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { VideoCard } from '../../src/components/VideoCard';
import { Chip } from '../../src/components/ui/Chip';
import { colors, spacing, typography } from '../../src/constants/theme';
import { screenCopy } from '../../src/constants/copy';
import { LongVideoService } from '../../src/services/LongVideoService';
import { VideoAsset, WatchDurationOption } from '../../src/types/video';

const durationOptions: Array<{ label: string; value: WatchDurationOption }> = [
  { label: 'ランダム', value: 'random' },
  { label: '1分', value: 60 },
  { label: '3分', value: 180 },
  { label: '5分', value: 300 },
  { label: '10分', value: 600 },
  { label: '30分', value: 1800 },
];

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
          <Text style={styles.title}>{screenCopy.longTitle}</Text>
          <Text style={styles.tagline}>{screenCopy.longTagline}</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.kicker}>ここは自主練</Text>
          <Text style={styles.infoTitle}>レイドは通知から参加</Text>
          <Text style={styles.infoText}>通常視聴はいつでも入れる練習。今日の結果に残る本番は、毎日一回の集合レイド。</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.kicker}>今日のロング</Text>
          <VideoCard
            video={recommended}
            selected={selectedVideo.id === recommended.id}
            onPress={() => setSelectedVideo(recommended)}
          />
        </View>

        <Text style={styles.kicker}>耐える時間</Text>
        <View style={styles.durationRow}>
          {durationOptions.map((option) => (
            <Chip
              key={option.label}
              label={option.label}
              selected={duration === option.value}
              onPress={() => setDuration(option.value)}
            />
          ))}
        </View>

        <PrimaryButton label="自主練として入る" onPress={start} />

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
    gap: 4,
    paddingHorizontal: spacing.xs,
  },
  title: {
    color: colors.text,
    ...typography.display,
  },
  tagline: {
    color: colors.textMuted,
    ...typography.body,
  },
  section: {
    gap: spacing.sm,
  },
  infoCard: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardStrong,
  },
  infoTitle: {
    color: colors.text,
    ...typography.h2,
  },
  infoText: {
    color: colors.textMuted,
    ...typography.caption,
  },
  kicker: {
    color: colors.textSubtle,
    ...typography.label,
    paddingHorizontal: spacing.xs,
  },
  durationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  list: {
    gap: spacing.md,
  },
});
