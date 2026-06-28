
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdBanner } from '../../src/components/AdBanner';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { VideoCard } from '../../src/components/VideoCard';
import { colors, radius, spacing } from '../../src/constants/theme';
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

  const start = () => {
    const seconds = LongVideoService.resolveDuration(duration);
    router.push({ pathname: '/raid/active', params: { mode: 'normal', videoId: selectedVideo.id, duration: String(seconds) } });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>DATSUDOPA LONG</Text>
          <Text style={styles.title}>静かな映像に逃げる</Text>
          <Text style={styles.subtitle}>通常視聴はいつでも可能。レイド扱いにはならないが、ドパガキ度を少しだけ冷ます。</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>今日のおすすめ</Text>
          <VideoCard video={recommended} selected={selectedVideo.id === recommended.id} onPress={() => setSelectedVideo(recommended)} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>視聴時間</Text>
          <View style={styles.chips}>
            {durationOptions.map((option) => (
              <Pressable
                key={option.label}
                onPress={() => setDuration(option.value)}
                style={[styles.chip, duration === option.value && styles.chipSelected]}
              >
                <Text style={[styles.chipText, duration === option.value && styles.chipTextSelected]}>{option.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <PrimaryButton label="脱ドパロングを開始" onPress={start} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>動画一覧</Text>
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} selected={selectedVideo.id === video.id} onPress={() => setSelectedVideo(video)} />
          ))}
        </View>

        <View style={styles.placeholder}>
          <Text style={styles.placeholderTitle}>投稿機能 placeholder</Text>
          <Text style={styles.placeholderBody}>将来は自分で撮影した無人駅、雨上がりの道路、蛍光灯の廊下を投稿できる構造にします。動画本体はStorage/CDN、DBにはメタデータのみ。</Text>
        </View>

        <AdBanner label="通常視聴 AdMob バナー" />
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
    padding: spacing.lg,
    paddingBottom: 110,
  },
  hero: {
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  kicker: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2.5,
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textMuted,
    lineHeight: 22,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  chipSelected: {
    borderColor: colors.blue,
    backgroundColor: 'rgba(123, 167, 215, 0.14)',
  },
  chipText: {
    color: colors.textMuted,
  },
  chipTextSelected: {
    color: colors.text,
    fontWeight: '700',
  },
  placeholder: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radius.lg,
  },
  placeholderTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  placeholderBody: {
    color: colors.textMuted,
    lineHeight: 22,
  },
});
