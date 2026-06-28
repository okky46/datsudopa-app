
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../src/components/PrimaryButton';
import { DEFAULT_RAID_DURATION_SECONDS, NOTIFICATION_TONE_OPTIONS, SOCIAL_TIME_OPTIONS } from '../src/constants/raid';
import { colors, radius, spacing } from '../src/constants/theme';
import { NotificationService } from '../src/services/NotificationService';
import { StorageService } from '../src/services/StorageService';
import { NotificationTone, SocialTimeSlot } from '../src/types/settings';

export default function OnboardingScreen() {
  const [slot, setSlot] = useState<SocialTimeSlot>('before_bed');
  const [tone, setTone] = useState<NotificationTone>('normal');
  const defaultTime = useMemo(() => SOCIAL_TIME_OPTIONS.find((option) => option.value === slot)?.defaultTime || '23:00', [slot]);
  const [raidTime, setRaidTime] = useState(defaultTime);

  const selectSlot = (nextSlot: SocialTimeSlot) => {
    setSlot(nextSlot);
    const next = SOCIAL_TIME_OPTIONS.find((option) => option.value === nextSlot);
    setRaidTime(next?.defaultTime || raidTime);
  };

  const complete = async () => {
    const granted = await NotificationService.requestPermission();
    const settings = {
      onboardingCompleted: true,
      socialTimeSlot: slot,
      raidTime,
      notificationEnabled: granted,
      notificationTone: tone,
      raidDurationSeconds: DEFAULT_RAID_DURATION_SECONDS,
    };
    await StorageService.saveSettings(settings);
    await NotificationService.scheduleDailyRaid(settings);
    if (!granted) {
      Alert.alert('通知はOFFです', 'メニューからいつでも通知を有効にできます。');
    }
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>FIRST RAID SETUP</Text>
          <Text style={styles.title}>あなたが一番ドパる時間は？</Text>
          <Text style={styles.subtitle}>その時間に、毎日1回だけ静かなレイド通知を出します。</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>よくSNSを使ってしまう時間帯</Text>
          <View style={styles.chips}>
            {SOCIAL_TIME_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => selectSlot(option.value)}
                style={[styles.chip, slot === option.value && styles.chipSelected]}
              >
                <Text style={[styles.chipText, slot === option.value && styles.chipTextSelected]}>{option.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>レイド通知を受けたい時間</Text>
          <TextInput
            value={raidTime}
            onChangeText={setRaidTime}
            placeholder="23:00"
            placeholderTextColor={colors.textSubtle}
            style={styles.input}
          />
          <Text style={styles.description}>MVPではレイド時間は3分固定。通知後3分以内に開始しないと未参加扱いです。</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>どのくらい煽られたい？</Text>
          <View style={styles.chips}>
            {NOTIFICATION_TONE_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => setTone(option.value)}
                style={[styles.chip, tone === option.value && styles.chipSelected]}
              >
                <Text style={[styles.chipText, tone === option.value && styles.chipTextSelected]}>{option.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <PrimaryButton label="通知許可を確認して始める" onPress={complete} />
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
    paddingBottom: spacing.xl,
  },
  hero: {
    gap: spacing.sm,
    paddingTop: spacing.xl,
  },
  kicker: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2.5,
  },
  title: {
    color: colors.text,
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 42,
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
  input: {
    minHeight: 50,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    backgroundColor: colors.backgroundSoft,
  },
  description: {
    color: colors.textMuted,
    lineHeight: 20,
  },
});
