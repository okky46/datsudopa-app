
// リザルト。完走/途中離脱・今回の視聴時間・増えた脱ドパ時間・累計・ドパガキ度と増減・
// 連続日数・同行者名（実在のみ最大3人）・SNS共有・次回22時案内。広告なし。派手な演出なし。

import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { ShareCard, ShareCardData } from '../../src/components/share/ShareCard';
import { EnterCard } from '../../src/components/ui/Motion';
import { Card } from '../../src/components/ui/Card';
import { resultCopy } from '../../src/constants/copy';
import { dopagakiTitle } from '../../src/constants/dopagaki';
import { colors, fontFamily, radius, spacing, typography } from '../../src/constants/theme';
import { WatchSession } from '../../src/types/session';
import { formatDurationJa } from '../../src/utils/date';
import { AnalyticsService } from '../../src/services/AnalyticsService';
import { CompanionService } from '../../src/services/CompanionService';
import { SessionService } from '../../src/services/SessionService';
import { ShareCardService, getInviteUrl } from '../../src/services/ShareCardService';
import { StorageService } from '../../src/services/StorageService';

function kindLabel(session: WatchSession): string {
  if (session.kind === 'raid') {
    return resultCopy.raidKindLabel;
  }
  return session.longSource === 'catchup' ? resultCopy.catchupKindLabel : resultCopy.longKindLabel;
}

function StatRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, accent && styles.statValueAccent]}>{value}</Text>
    </View>
  );
}

export default function ResultScreen() {
  const params = useLocalSearchParams<{
    sessionId?: string;
    total?: string;
    level?: string;
    delta?: string;
    streak?: string;
  }>();
  const [session, setSession] = useState<WatchSession | null>(null);
  const [companions, setCompanions] = useState<string[]>([]);
  const [sharing, setSharing] = useState(false);
  const [shareName, setShareName] = useState('名無しのドパガキ');
  const shareCardRef = useRef<View>(null);

  const total = Number(params.total) || 0;
  const level = Number(params.level) || 0;
  const delta = Number(params.delta) || 0;
  const streak = Number(params.streak) || 0;

  useEffect(() => {
    const load = async () => {
      if (!params.sessionId) {
        return;
      }
      const found = await SessionService.findSession(params.sessionId);
      setSession(found);
      const settings = await StorageService.getSettings();
      setShareName(settings.publicName || '名無しのドパガキ');
      // 同行者名はレイド後のリザルトのみ。取得失敗・0人なら代替文言（架空名は出さない）
      if (found?.kind === 'raid' && found.raidId) {
        const names = await CompanionService.getCompanions(found.raidId);
        setCompanions(names);
      }
      void AnalyticsService.flush();
    };
    void load();
  }, [params.sessionId]);

  const shareData: ShareCardData | null = session
    ? {
        publicName: shareName,
        dateKey: session.dateKey,
        kindLabel: kindLabel(session),
        completed: session.status === 'completed',
        watchedSeconds: session.watchedSeconds,
        totalDetoxSeconds: total,
        dopagakiLevel: level,
        title: dopagakiTitle(level),
        streakDays: streak,
        inviteUrl: getInviteUrl(),
      }
    : null;

  const share = useCallback(async () => {
    if (!shareData || sharing) {
      return;
    }
    setSharing(true);
    try {
      await ShareCardService.shareFromRef(shareCardRef, shareData);
    } finally {
      setSharing(false);
    }
  }, [shareData, sharing]);

  const completed = session?.status === 'completed';
  const deltaText = delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : '±0';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {session ? (
          <>
            <Text style={styles.title}>{completed ? resultCopy.titleCompleted : resultCopy.titleExited}</Text>
            <Text style={styles.kind}>{kindLabel(session)}</Text>

            <EnterCard index={0}>
              <Card variant="hero" style={styles.card}>
                <Text style={styles.watchedLabel}>{resultCopy.watchedLabel}</Text>
                <Text style={styles.watched}>{formatDurationJa(session.watchedSeconds)}</Text>

                <View style={styles.divider} />

                <StatRow label={resultCopy.gainedLabel} value={`+${formatDurationJa(session.watchedSeconds)}`} accent />
                <StatRow label={resultCopy.totalLabel} value={formatDurationJa(total)} />
                <StatRow label={resultCopy.dopagakiLabel} value={`${level}（${deltaText}）`} />
                {streak > 0 && <StatRow label={resultCopy.streakLabel} value={`${streak}日`} />}
              </Card>
            </EnterCard>

            {session.kind === 'raid' && (
              <EnterCard index={1}>
                <Card style={styles.companionCard}>
                  <Text style={styles.companionLabel}>{resultCopy.companionsLabel}</Text>
                  {companions.length > 0 ? (
                    companions.map((name) => (
                      <Text key={name} style={styles.companionName}>
                        {name}
                        {resultCopy.companionSuffix}
                      </Text>
                    ))
                  ) : (
                    <Text style={styles.companionEmpty}>{resultCopy.companionsEmpty}</Text>
                  )}
                </Card>
              </EnterCard>
            )}

            <EnterCard index={2} style={styles.actions}>
              <PrimaryButton label={resultCopy.share} variant="gradient" disabled={sharing} onPress={() => void share()} />
              <Text style={styles.nextRaid}>{resultCopy.nextRaid}</Text>
              <PrimaryButton label={resultCopy.home} variant="ghost" onPress={() => router.replace('/(tabs)')} />
            </EnterCard>
          </>
        ) : (
          <>
            <Text style={styles.empty}>記録が見つかりませんでした。</Text>
            <PrimaryButton label={resultCopy.home} variant="ghost" onPress={() => router.replace('/(tabs)')} />
          </>
        )}
      </ScrollView>

      {/* キャプチャ用の共有カード（画面外に描画しておく） */}
      {shareData && (
        <View style={styles.shareCardHolder} pointerEvents="none">
          <ShareCard ref={shareCardRef} data={shareData} />
        </View>
      )}
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  title: {
    color: colors.text,
    textAlign: 'center',
    ...typography.h1,
  },
  kind: {
    color: colors.textMuted,
    textAlign: 'center',
    ...typography.caption,
    marginTop: -spacing.xs,
  },
  card: {
    gap: spacing.sm,
    alignItems: 'stretch',
  },
  watchedLabel: {
    color: colors.textMuted,
    textAlign: 'center',
    ...typography.label,
  },
  watched: {
    color: colors.text,
    textAlign: 'center',
    fontSize: 46,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
    letterSpacing: -1.5,
    textShadowColor: 'rgba(201, 169, 106, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statLabel: {
    color: colors.textMuted,
    ...typography.caption,
  },
  statValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
    fontVariant: ['tabular-nums'],
  },
  statValueAccent: {
    color: colors.accent,
  },
  companionCard: {
    gap: spacing.xs,
  },
  companionLabel: {
    color: colors.textMuted,
    ...typography.label,
    marginBottom: 2,
  },
  companionName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
  },
  companionEmpty: {
    color: colors.textMuted,
    ...typography.body,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  nextRaid: {
    color: colors.textSubtle,
    textAlign: 'center',
    ...typography.caption,
  },
  empty: {
    color: colors.textMuted,
    ...typography.body,
    textAlign: 'center',
  },
  shareCardHolder: {
    position: 'absolute',
    left: -9999,
    top: 0,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
});
