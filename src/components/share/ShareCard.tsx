
// SNS共有用の縦長カード。view-shot でキャプチャして画像として共有する。
// 文言は data と shareCopy の差し込みのみ。レイアウト・背景・コピーは後から差し替える前提で、
// このコンポーネント1ファイルに閉じる。

import { forwardRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { APP_NAME, shareCopy } from '../../constants/copy';
import { colors, fontFamily, gradientBar, gradientWash, radius, spacing } from '../../constants/theme';
import { formatDateForShare, formatDurationJa } from '../../utils/date';
import { SoftGradient } from '../ui/SoftGradient';

export type ShareCardData = {
  publicName: string;
  dateKey: string;
  /** 'raid' | 'long' の表示ラベル（resultCopy側で解決済みの文字列） */
  kindLabel: string;
  completed: boolean;
  watchedSeconds: number;
  totalDetoxSeconds: number;
  dopagakiLevel: number;
  title: string;
  streakDays: number;
  inviteUrl?: string;
};

// 9:16の縦長。キャプチャ時に pixelRatio を上げて高解像度化する
export const SHARE_CARD_WIDTH = 360;
export const SHARE_CARD_HEIGHT = 640;

export const ShareCard = forwardRef<View, { data: ShareCardData }>(function ShareCard({ data }, ref) {
  return (
    <View ref={ref} collapsable={false} style={styles.card}>
      <SoftGradient colors={gradientWash} direction="vertical" style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Text style={styles.brand}>{APP_NAME}</Text>
        <Text style={styles.date}>{formatDateForShare(data.dateKey)}</Text>
      </View>

      <View style={styles.middle}>
        <Text style={styles.name} numberOfLines={1}>{data.publicName}</Text>
        <Text style={styles.kind}>
          {data.kindLabel}・{data.completed ? shareCopy.completed : shareCopy.exited}
        </Text>
        <Text style={styles.watched}>{formatDurationJa(data.watchedSeconds)}</Text>

        <View style={styles.divider} />

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>{shareCopy.totalLabel}</Text>
          <Text style={styles.statValue}>{formatDurationJa(data.totalDetoxSeconds)}</Text>
        </View>
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>{shareCopy.dopagakiLabel}</Text>
          <Text style={styles.statValue}>{data.dopagakiLevel}</Text>
        </View>
        <View style={styles.barTrack}>
          <SoftGradient
            colors={gradientBar}
            direction="horizontal"
            borderRadius={radius.pill}
            style={{ width: `${Math.max(4, Math.min(100, data.dopagakiLevel))}%`, height: '100%' }}
          />
        </View>

        <View style={styles.titleCapsule}>
          <Text style={styles.titleText} numberOfLines={1}>「{data.title}」</Text>
        </View>
        {data.streakDays > 0 && (
          <Text style={styles.streak}>{data.streakDays}{shareCopy.streakSuffix}</Text>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.hashtag}>{shareCopy.hashtag}</Text>
        {data.inviteUrl ? <Text style={styles.invite}>{data.inviteUrl}</Text> : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: SHARE_CARD_WIDTH,
    height: SHARE_CARD_HEIGHT,
    backgroundColor: colors.background,
    borderRadius: 0,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '900',
    fontFamily: fontFamily.black,
    letterSpacing: 1,
  },
  date: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
    fontFamily: fontFamily.medium,
    fontVariant: ['tabular-nums'],
  },
  middle: {
    gap: spacing.sm,
    alignItems: 'center',
  },
  name: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    fontFamily: fontFamily.black,
  },
  kind: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: fontFamily.medium,
    letterSpacing: 0.6,
  },
  watched: {
    color: colors.text,
    fontSize: 52,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
    letterSpacing: -2,
    textShadowColor: 'rgba(201, 169, 106, 0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 22,
  },
  divider: {
    alignSelf: 'stretch',
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  statRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: fontFamily.medium,
  },
  statValue: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
    fontVariant: ['tabular-nums'],
  },
  barTrack: {
    alignSelf: 'stretch',
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
    marginTop: 2,
  },
  titleCapsule: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  titleText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
  },
  streak: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
  },
  footer: {
    alignItems: 'center',
    gap: 2,
  },
  hashtag: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
    letterSpacing: 0.5,
  },
  invite: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: '500',
    fontFamily: fontFamily.medium,
  },
});
