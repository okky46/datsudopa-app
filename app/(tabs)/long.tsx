
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdBanner } from '../../src/components/AdBanner';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { moodTone } from '../../src/components/VideoCard';
import { VideoFeedCard } from '../../src/components/VideoFeedCard';
import { DurationSlider } from '../../src/components/ui/DurationSlider';
import { EnterCard, PressableScale } from '../../src/components/ui/Motion';
import { SegmentedPills } from '../../src/components/ui/SegmentedPills';
import { SoftGradient } from '../../src/components/ui/SoftGradient';
import { LONG_VIDEO_META_LABEL, screenCopy } from '../../src/constants/copy';
import { colors, radius, spacing, typography } from '../../src/constants/theme';
import { LONG_DURATION_DEFAULT_SECONDS, LongVideoService } from '../../src/services/LongVideoService';
import { VideoAsset } from '../../src/types/video';

const DURATION_PRESETS = [
  { label: '3分', seconds: 180 },
  { label: '10分', seconds: 600 },
  { label: '30分', seconds: 1800 },
  { label: '60分', seconds: 3600 },
] as const;

const RANDOM_KEY = 'random';

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

function PlayGlyph() {
  return <View style={styles.playTriangle} />;
}

function OtherVideoRow({ video, onPress }: { video: VideoAsset; onPress: () => void }) {
  const tone = moodTone[video.mood] ?? moodTone.chill;

  return (
    <PressableScale accessibilityRole="button" accessibilityLabel={`${video.title}を再生`} onPress={onPress} style={styles.otherRow}>
      <View style={styles.otherThumb}>
        <SoftGradient colors={tone.sky} direction="vertical" style={StyleSheet.absoluteFill} steps={12} />
        <View style={[styles.otherGround, { backgroundColor: tone.ground }]} />
      </View>
      <View style={styles.otherText}>
        <Text style={styles.otherTitle} numberOfLines={1}>
          {video.title}
        </Text>
        <Text style={styles.otherMeta} numberOfLines={1}>
          {LONG_VIDEO_META_LABEL}
        </Text>
      </View>
    </PressableScale>
  );
}

export default function LongScreen() {
  const videos = useMemo(() => LongVideoService.listVideos(), []);
  const recommended = useMemo(() => LongVideoService.getRecommendedVideo(), []);
  const [durationSeconds, setDurationSeconds] = useState(LONG_DURATION_DEFAULT_SECONDS);

  const durationMinutes = LongVideoService.minutesFromSeconds(durationSeconds);
  const durationLabel = `${durationMinutes}分`;

  const others = useMemo(() => videos.filter((video) => video.id !== recommended.id), [recommended, videos]);

  const selectedPresetKey =
    DURATION_PRESETS.find((preset) => preset.seconds === durationSeconds)?.label ?? null;

  const segmentOptions = [
    ...DURATION_PRESETS.map((preset) => ({ key: preset.label, label: preset.label })),
    { key: RANDOM_KEY, label: '', icon: <ShuffleGlyph />, accessibilityLabel: '視聴時間をランダムに決める' },
  ];

  const onSelectSegment = (key: string) => {
    if (key === RANDOM_KEY) {
      setDurationSeconds(LongVideoService.randomDurationSeconds());
      return;
    }
    const preset = DURATION_PRESETS.find((item) => item.label === key);
    if (preset) {
      setDurationSeconds(preset.seconds);
    }
  };

  const play = (video: VideoAsset) => {
    router.push({
      pathname: '/raid/active',
      params: { mode: 'normal', videoId: video.id, duration: String(durationSeconds) },
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{screenCopy.longTitle}</Text>
          <View style={styles.lockRow}>
            <LockGlyph />
            <Text style={styles.lockText}>スキップ不可・倍速なし・次の動画もなし</Text>
          </View>
        </View>

        <EnterCard index={0}>
          <VideoFeedCard video={recommended} durationLabel={durationLabel} recommended onPress={() => play(recommended)} />
        </EnterCard>

        <EnterCard index={1} style={styles.durationSection}>
          <View style={styles.durationHead}>
            <Text style={styles.sectionLabel}>{screenCopy.longDurationSectionLabel}</Text>
            <Text style={styles.durationValue}>{durationLabel}</Text>
          </View>
          <SegmentedPills options={segmentOptions} selectedKey={selectedPresetKey} onSelect={onSelectSegment} />
          <DurationSlider
            valueMinutes={durationMinutes}
            onChange={(minutes) => setDurationSeconds(minutes * 60)}
            compact
            showValue={false}
          />
        </EnterCard>

        <EnterCard index={2}>
          <PrimaryButton label="再生する" variant="gradient" icon={<PlayGlyph />} onPress={() => play(recommended)} />
        </EnterCard>

        <View style={styles.othersSection}>
          <Text style={styles.sectionLabel}>{screenCopy.longSectionOthers}</Text>
          {others.map((video) => (
            <OtherVideoRow key={video.id} video={video} onPress={() => play(video)} />
          ))}
        </View>

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
  content: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: 120,
  },
  header: {
    gap: 4,
    paddingBottom: spacing.xs,
    alignItems: 'center',
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
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
  durationSection: {
    gap: spacing.sm,
  },
  durationHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  durationValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    paddingHorizontal: spacing.xs,
  },
  sectionLabel: {
    color: colors.textMuted,
    ...typography.label,
    paddingHorizontal: spacing.xs,
  },
  othersSection: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  otherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  otherThumb: {
    width: 74,
    height: 48,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  otherGround: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '34%',
    opacity: 0.92,
  },
  otherText: {
    flex: 1,
    gap: 2,
  },
  otherTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  otherMeta: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '500',
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
  playTriangle: {
    width: 0,
    height: 0,
    borderTopWidth: 7,
    borderBottomWidth: 7,
    borderLeftWidth: 11,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: colors.text,
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
