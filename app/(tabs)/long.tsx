
// 通常ロング。無料ユーザーには「今日の1本」だけを提示する（動画選択なし）。
// 視聴時間は 3/10/30/60分 のプリセットから選択。広告はこの画面の最下部のみ。

import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdBanner } from '../../src/components/AdBanner';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { Chip } from '../../src/components/ui/Chip';
import { longCopy } from '../../src/constants/copy';
import { colors, fontFamily, radius, spacing, typography } from '../../src/constants/theme';
import { ResolvedVideo } from '../../src/types/video';
import { FeatureGateService } from '../../src/services/FeatureGateService';
import { VideoDeliveryService } from '../../src/services/VideoDeliveryService';

const DURATION_PRESETS = [
  { label: '3分', seconds: 180 },
  { label: '10分', seconds: 600 },
  { label: '30分', seconds: 1800 },
  { label: '60分', seconds: 3600 },
] as const;

function LockGlyph() {
  return (
    <View style={styles.lock}>
      <View style={styles.lockShackle} />
      <View style={styles.lockBody} />
    </View>
  );
}

function PlayTriangle() {
  return <View style={styles.playTriangle} />;
}

export default function LongScreen() {
  const [video, setVideo] = useState<ResolvedVideo | null>(null);
  const [durationSeconds, setDurationSeconds] = useState<number>(DURATION_PRESETS[0].seconds);
  const canSelectVideo = FeatureGateService.hasFeature('video_selection');

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const load = async () => {
        const manifest = await VideoDeliveryService.getLocalManifest();
        const videoId = VideoDeliveryService.getLongVideoId(manifest);
        const resolved = await VideoDeliveryService.resolveVideo(videoId, manifest);
        if (!cancelled) {
          setVideo(resolved);
        }
      };
      void load();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const play = () => {
    router.push({ pathname: '/raid/active', params: { mode: 'long', duration: String(durationSeconds) } });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{longCopy.title}</Text>
          <Text style={styles.tagline}>{longCopy.tagline}</Text>
        </View>

        <Pressable onPress={play} style={({ pressed }) => [styles.videoCard, pressed && styles.videoCardPressed]}>
          <View style={styles.videoArt}>
            <View style={styles.videoHorizon} />
            <View style={styles.playBadge}>
              <PlayTriangle />
            </View>
          </View>
          <Text style={styles.videoTitle}>{video?.title ?? ''}</Text>
        </Pressable>

        <View style={styles.durationBlock}>
          <Text style={styles.durationLabel}>{longCopy.durationLabel}</Text>
          <View style={styles.presetRow}>
            {DURATION_PRESETS.map((preset) => (
              <Chip
                key={preset.label}
                label={preset.label}
                selected={durationSeconds === preset.seconds}
                onPress={() => setDurationSeconds(preset.seconds)}
              />
            ))}
          </View>
        </View>

        <PrimaryButton label={longCopy.play} variant="gradient" icon={<PlayTriangle />} onPress={play} />

        <View style={styles.lockRow}>
          <LockGlyph />
          <Text style={styles.lockText}>{longCopy.lockNote}</Text>
        </View>

        {!canSelectVideo && <Text style={styles.comingSoon}>{longCopy.selectionComingSoon}</Text>}

        <AdBanner placement="long_setup" />
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
    paddingTop: spacing.sm,
    paddingBottom: 120,
  },
  header: {
    gap: 4,
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    fontFamily: fontFamily.black,
    letterSpacing: -0.3,
  },
  tagline: {
    color: colors.textMuted,
    ...typography.caption,
  },
  videoCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  videoCardPressed: {
    opacity: 0.85,
  },
  videoArt: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.black,
  },
  videoHorizon: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '58%',
    height: 1,
    backgroundColor: 'rgba(244, 247, 251, 0.16)',
  },
  playBadge: {
    width: 52,
    height: 52,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(244, 247, 251, 0.25)',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
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
  videoTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  durationBlock: {
    gap: spacing.sm,
  },
  durationLabel: {
    color: colors.textMuted,
    ...typography.label,
    paddingHorizontal: spacing.xs,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  comingSoon: {
    color: colors.textSubtle,
    ...typography.caption,
    textAlign: 'center',
  },
});
