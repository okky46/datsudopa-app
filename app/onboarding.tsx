
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../src/components/PrimaryButton';
import { Card } from '../src/components/ui/Card';
import { Chip } from '../src/components/ui/Chip';
import { APP_CATCHPHRASE } from '../src/constants/copy';
import { DEFAULT_RAID_DURATION_SECONDS, SOCIAL_TIME_OPTIONS } from '../src/constants/raid';
import { colors, radius, spacing, typography } from '../src/constants/theme';
import { NotificationService } from '../src/services/NotificationService';
import { StorageService } from '../src/services/StorageService';
import { SocialTimeSlot } from '../src/types/settings';

const onboardingSteps = [
  { label: '1 時間を選ぶ', text: 'ショートを見がちな時間。' },
  { label: '2 通知で集合', text: '毎日一回、低刺激ロングのレイド開始。' },
  { label: '3 3分以内に参加', text: '遅れると未参加。' },
  { label: '4 結果を共有', text: '完走も中断も、今日の記録。' },
];

export default function OnboardingScreen() {
  const [nickname, setNickname] = useState('');
  const [slot, setSlot] = useState<SocialTimeSlot>('night');

  const complete = async () => {
    const granted = await NotificationService.requestPermission();
    const option = SOCIAL_TIME_OPTIONS.find((item) => item.value === slot);
    const settings = {
      onboardingCompleted: true,
      nickname: nickname.trim() || StorageService.getDefaultSettings().nickname,
      frameColorId: StorageService.getDefaultSettings().frameColorId,
      socialTimeSlot: slot,
      raidTime: option?.defaultTime || '23:00',
      notificationEnabled: granted,
      raidDurationSeconds: DEFAULT_RAID_DURATION_SECONDS,
    };
    await StorageService.saveSettings(settings);
    await NotificationService.scheduleDailyRaid(settings);
    if (!granted) {
      Alert.alert(
        NotificationService.isAvailable() ? '集合の合図はOFFのままです' : 'Expo Goでは通知不可',
        NotificationService.isAvailable()
          ? 'あとからメニューで有効にできます。'
          : 'development buildで確認してください。',
      );
    }
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.brand}>脱ドパ</Text>
          <Text style={styles.title}>ショートの真逆、はじめます。</Text>
          <Text style={styles.subtitle}>毎日一回、余白のあるロングに集合。</Text>
          <Text style={styles.catchphrase}>{APP_CATCHPHRASE}</Text>
        </View>

        <Card style={styles.card}>
          {onboardingSteps.map((step) => (
            <View key={step.label} style={styles.stepRow}>
              <Text style={styles.stepLabel}>{step.label}</Text>
              <Text style={styles.stepText}>{step.text}</Text>
            </View>
          ))}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>レイド名</Text>
          <TextInput
            value={nickname}
            onChangeText={setNickname}
            placeholder="駅前のドパガキ"
            placeholderTextColor={colors.textSubtle}
            maxLength={24}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.input}
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>よくショートを見る時間帯</Text>
          <View style={styles.chips}>
            {SOCIAL_TIME_OPTIONS.map((option) => (
              <Chip key={option.value} label={option.label} selected={slot === option.value} onPress={() => setSlot(option.value)} />
            ))}
          </View>
          <Text style={styles.hint}>同じ時間帯の人と、ある程度そろって集合します。</Text>
        </Card>

        <PrimaryButton label="レイド通知を受け取る" onPress={complete} />
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  hero: {
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  brand: {
    color: colors.textSubtle,
    ...typography.brandMark,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.text,
    ...typography.display,
  },
  subtitle: {
    color: colors.textMuted,
    ...typography.body,
  },
  catchphrase: {
    color: colors.textSubtle,
    ...typography.caption,
  },
  card: {
    gap: spacing.md,
  },
  stepRow: {
    gap: 2,
    paddingVertical: spacing.xs,
  },
  stepLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  stepText: {
    color: colors.textMuted,
    ...typography.caption,
  },
  sectionTitle: {
    color: colors.text,
    ...typography.h2,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  label: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  hint: {
    color: colors.textSubtle,
    ...typography.caption,
  },
  input: {
    minHeight: 50,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: colors.surface,
  },
});
