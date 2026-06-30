
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdBanner } from '../../src/components/AdBanner';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { VideoCard } from '../../src/components/VideoCard';
import { Chip } from '../../src/components/ui/Chip';
import { DurationSlider } from '../../src/components/ui/DurationSlider';
import { screenCopy } from '../../src/constants/copy';
import { colors, radius, spacing, typography } from '../../src/constants/theme';
import { LONG_DURATION_DEFAULT_SECONDS, LongVideoService } from '../../src/services/LongVideoService';
import { VideoAsset } from '../../src/types/video';

const DURATION_PRESETS = [
  { label: '3分', seconds: 180 },
  { label: '10分', seconds: 600 },
  { label: '30分', seconds: 1800 },
] as const;

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

type SectionHeadingProps = {
  label: string;
  value?: string;
  hint?: string;
};

function SectionHeading({ label, value, hint }: SectionHeadingProps) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {value ? (
        <Text style={styles.sectionValue} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
    </View>
  );
}

export default function LongScreen() {
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const videos = useMemo(() => LongVideoService.listVideos(), []);
  const recommended = useMemo(() => LongVideoService.getRecommendedVideo(), []);
  const [selectedVideo, setSelectedVideo] = useState<VideoAsset>(recommended);
  const [durationSeconds, setDurationSeconds] = useState(LONG_DURATION_DEFAULT_SECONDS);
  const others = videos.filter((video) => video.id !== recommended.id);

  const heroHeight = useMemo(() => {
    const available = windowHeight - insets.top - 88 - 300;
    if (available < 120) {
      return 120;
    }
    return Math.min(168, Math.max(132, Math.round(available)));
  }, [insets.top, windowHeight]);

  const durationMinutes = LongVideoService.minutesFromSeconds(durationSeconds);

  const setDurationMinutes = (minutes: number) => {
    setDurationSeconds(minutes * 60);
  };

  const start = () => {
    router.push({
      pathname: '/raid/active',
      params: { mode: 'normal', videoId: selectedVideo.id, duration: String(durationSeconds) },
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.setupPanel}>
        <View style={styles.header}>
          <Text style={styles.title}>{screenCopy.longTitle}</Text>
          <Text style={styles.tagline} numberOfLines={1}>
            {screenCopy.longTagline}
          </Text>
        </View>

        <VideoCard video={selectedVideo} variant="hero" selected interactive={false} compact heroHeight={heroHeight} />

        <SectionHeading label={screenCopy.longVideoSectionLabel} value={selectedVideo.title} />

        <SectionHeading label={screenCopy.longDurationSectionLabel} hint={screenCopy.longDurationSectionHint} />

        <DurationSlider valueMinutes={durationMinutes} onChange={setDurationMinutes} compact />

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

        <PrimaryButton
          label="再生する"
          variant="gradient"
          onPress={start}
          icon={<PlayTriangle />}
          style={styles.playButton}
        />

        <View style={styles.lockRow}>
          <LockGlyph />
          <Text style={styles.lockText}>スキップ不可</Text>
        </View>
      </View>

      <ScrollView
        style={styles.extraScroll}
        contentContainerStyle={styles.extraContent}
        showsVerticalScrollIndicator={false}
      >
        {others.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{screenCopy.longSectionOthers}</Text>
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
  setupPanel: {
    flexShrink: 0,
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  header: {
    gap: 2,
    alignItems: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  tagline: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  sectionHeading: {
    gap: 2,
    paddingHorizontal: spacing.xs,
  },
  sectionLabel: {
    color: colors.textMuted,
    ...typography.label,
  },
  sectionValue: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  sectionHint: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  playButton: {
    minHeight: 50,
    marginTop: 2,
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
    marginTop: -2,
  },
  lockText: {
    color: colors.textSubtle,
    fontSize: 11,
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
  extraScroll: {
    flex: 1,
  },
  extraContent: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: 120,
  },
  section: {
    gap: spacing.sm,
  },
  list: {
    gap: spacing.md,
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
});
