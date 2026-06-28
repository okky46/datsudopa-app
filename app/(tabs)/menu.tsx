
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PremiumJokeCard } from '../../src/components/PremiumJokeCard';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { NOTIFICATION_TONE_OPTIONS, SOCIAL_TIME_OPTIONS } from '../../src/constants/raid';
import { colors, radius, spacing } from '../../src/constants/theme';
import { NotificationService } from '../../src/services/NotificationService';
import { StorageService } from '../../src/services/StorageService';
import { NotificationTone, SocialTimeSlot, UserSettings } from '../../src/types/settings';

export default function MenuScreen() {
  const [settings, setSettings] = useState<UserSettings>(StorageService.getDefaultSettings());

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
    void update({ ...settings, socialTimeSlot: slot, raidTime: option?.defaultTime || settings.raidTime });
  };

  const selectTone = (tone: NotificationTone) => {
    void update({ ...settings, notificationTone: tone });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>MENU</Text>
          <Text style={styles.title}>設定と広告増量</Text>
          <Text style={styles.subtitle}>レイド通知の時刻、煽りの強さ、まだ存在しないプレミアムの気配。</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>よくSNSを使う時間帯</Text>
          <View style={styles.chips}>
            {SOCIAL_TIME_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => selectSlot(option.value)}
                style={[styles.chip, settings.socialTimeSlot === option.value && styles.chipSelected]}
              >
                <Text style={[styles.chipText, settings.socialTimeSlot === option.value && styles.chipTextSelected]}>{option.label}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.label}>レイド通知時刻</Text>
          <TextInput
            value={settings.raidTime}
            onChangeText={(raidTime) => setSettings({ ...settings, raidTime })}
            onBlur={() => void update(settings)}
            placeholder="23:00"
            placeholderTextColor={colors.textSubtle}
            style={styles.input}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.sectionTitle}>通知</Text>
              <Text style={styles.description}>毎日1回、指定時刻にローカル通知を出します。</Text>
            </View>
            <Switch
              value={settings.notificationEnabled}
              onValueChange={(notificationEnabled) => void update({ ...settings, notificationEnabled })}
              thumbColor={settings.notificationEnabled ? colors.blue : colors.textSubtle}
              trackColor={{ false: colors.cardStrong, true: colors.blueDeep }}
            />
          </View>
          <Text style={styles.label}>通知文言の強さ</Text>
          <View style={styles.chips}>
            {NOTIFICATION_TONE_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => selectTone(option.value)}
                style={[styles.chip, settings.notificationTone === option.value && styles.chipSelected]}
              >
                <Text style={[styles.chipText, settings.notificationTone === option.value && styles.chipTextSelected]}>{option.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <PremiumJokeCard />

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>その他</Text>
          <PrimaryButton label="オンボーディングをやり直す" variant="ghost" onPress={() => router.push('/onboarding')} />
          <PrimaryButton
            label="データ削除"
            variant="danger"
            onPress={() => {
              Alert.alert('データ削除', 'オンボーディング、履歴、placeholder課金状態を削除します。', [
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
          <Text style={styles.legal}>プライバシーポリシー placeholder / 利用規約 placeholder</Text>
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
  card: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
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
  label: {
    color: colors.textSubtle,
    fontSize: 12,
    letterSpacing: 1.2,
  },
  input: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    backgroundColor: colors.backgroundSoft,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  rowText: {
    flex: 1,
    gap: spacing.xs,
  },
  description: {
    color: colors.textMuted,
    lineHeight: 20,
  },
  legal: {
    color: colors.textSubtle,
    lineHeight: 20,
  },
});
