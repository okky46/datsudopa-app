
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PremiumJokeCard } from '../../src/components/PremiumJokeCard';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { Card } from '../../src/components/ui/Card';
import { Chip } from '../../src/components/ui/Chip';
import { SOCIAL_TIME_OPTIONS } from '../../src/constants/raid';
import { FRAME_COLOR_OPTIONS, getFrameColor } from '../../src/constants/frame';
import { colors, radius, spacing, typography } from '../../src/constants/theme';
import { screenCopy } from '../../src/constants/copy';
import { useScreenFrame } from '../../src/contexts/ScreenFrameContext';
import { NotificationService } from '../../src/services/NotificationService';
import { RaidScheduleService } from '../../src/services/RaidScheduleService';
import { StorageService } from '../../src/services/StorageService';
import { FrameColorId, SocialTimeSlot, UserSettings } from '../../src/types/settings';

export default function MenuScreen() {
  const [settings, setSettings] = useState<UserSettings>(StorageService.getDefaultSettings());
  const { setFrameColorId } = useScreenFrame();

  const load = useCallback(async () => {
    setSettings(await StorageService.getSettings());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const update = async (next: UserSettings) => {
    setSettings(next);
    await StorageService.saveSettings(next);
    await NotificationService.scheduleDailyRaid(next);
  };

  const selectSlot = (slot: SocialTimeSlot) => {
    const option = SOCIAL_TIME_OPTIONS.find((item) => item.value === slot);
    void update({
      ...settings,
      socialTimeSlot: slot,
      raidTime: option?.defaultTime || settings.raidTime,
    });
  };

  const selectFrameColor = (frameColorId: FrameColorId) => {
    setFrameColorId(frameColorId);
    void update({ ...settings, frameColorId });
  };

  const displayName = (settings.nickname ?? '').trim() || '名無しのドパガキ';
  const todayRaidTime = RaidScheduleService.resolveRaidTimeForDate(settings).raidTime;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>{screenCopy.menuTitle}</Text>

        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { borderColor: getFrameColor(settings.frameColorId) }]}>
              <Text style={styles.avatarText}>{displayName.slice(0, 1)}</Text>
            </View>
            <View style={styles.profileText}>
              <Text style={styles.profileLabel}>ニックネーム</Text>
              <TextInput
                value={settings.nickname}
                onChangeText={(nickname) => setSettings({ ...settings, nickname })}
                onBlur={() => void update({ ...settings, nickname: settings.nickname.trim() || StorageService.getDefaultSettings().nickname })}
                placeholder="駅前のドパガキ"
                placeholderTextColor={colors.textSubtle}
                maxLength={24}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.nameInput}
              />
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.rowLabel}>光る縁の色</Text>
          <View style={styles.colorRow}>
            {FRAME_COLOR_OPTIONS.map((option) => (
              <Pressable
                key={option.id}
                accessibilityRole="button"
                accessibilityLabel={option.label}
                onPress={() => selectFrameColor(option.id)}
                style={[styles.colorSwatch, settings.frameColorId === option.id && styles.colorSwatchSelected]}
              >
                <View style={[styles.colorFill, { backgroundColor: option.color }]} />
              </Pressable>
            ))}
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>集合の合図</Text>

          <View style={styles.switchRow}>
            <Text style={styles.rowLabel}>毎日1回、レイド開始</Text>
            <Switch
              value={settings.notificationEnabled}
              onValueChange={(notificationEnabled) => void update({ ...settings, notificationEnabled })}
              thumbColor={settings.notificationEnabled ? colors.accent : colors.textSubtle}
              trackColor={{ false: colors.surfaceSunken, true: colors.blueDeep }}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.rowLabel}>時間帯</Text>
            <View style={styles.chips}>
              {SOCIAL_TIME_OPTIONS.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  selected={settings.socialTimeSlot === option.value}
                  onPress={() => selectSlot(option.value)}
                />
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.rowLabel}>今日の集合予定</Text>
            <Text style={styles.timePreview}>{todayRaidTime}</Text>
            <Text style={styles.timeHint}>選んだ時間帯のどこかで、毎日レイドの合図が届きます。</Text>
          </View>
        </Card>

        <PremiumJokeCard />

        <View style={styles.footer}>
          <PrimaryButton label="オンボーディングをやり直す" variant="ghost" onPress={() => router.push('/onboarding')} />
          <PrimaryButton
            label="データを削除"
            variant="danger"
            onPress={() => {
              Alert.alert('データ削除', '記録と設定をすべて消します。', [
                { text: 'キャンセル', style: 'cancel' },
                {
                  text: '削除',
                  style: 'destructive',
                  onPress: () => {
                    void StorageService.clearAll().then(() => router.replace('/onboarding'));
                  },
                },
              ]);
            }}
          />
          <Text style={styles.legal}>プライバシーポリシー ・ 利用規約</Text>
        </View>
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
  screenTitle: {
    color: colors.text,
    ...typography.display,
    paddingHorizontal: spacing.xs,
  },
  profileCard: {
    gap: spacing.md,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  avatarText: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  profileText: {
    flex: 1,
    gap: 2,
  },
  profileLabel: {
    color: colors.textSubtle,
    ...typography.label,
  },
  nameInput: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    paddingVertical: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  card: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    ...typography.h2,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  field: {
    gap: spacing.sm,
  },
  rowLabel: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  timeInput: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: colors.surface,
  },
  timePreview: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  timeHint: {
    color: colors.textSubtle,
    ...typography.caption,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  colorSwatch: {
    width: 48,
    height: 48,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorSwatchSelected: {
    borderColor: colors.accent,
  },
  colorFill: {
    width: 34,
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(28, 38, 32, 0.10)',
  },
  footer: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  legal: {
    color: colors.textSubtle,
    fontSize: 12,
    textAlign: 'center',
    paddingTop: spacing.sm,
  },
});
