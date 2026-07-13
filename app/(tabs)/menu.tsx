
// 設定。公開ユーザーネーム / 通知 / 22時レイドの説明 / 動画キャッシュ削除 /
// オンボーディング再表示 / プレミアム・ヘビーモード予定 / 規約 / データ削除 / 広告。
// 公式レイド時刻の変更UIは置かない（毎日22:00固定）。

import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdBanner } from '../../src/components/AdBanner';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { LegalModal } from '../../src/components/menu/LegalModal';
import { PlansCard } from '../../src/components/menu/PlansCard';
import { Card } from '../../src/components/ui/Card';
import { Chip } from '../../src/components/ui/Chip';
import { EnterCard } from '../../src/components/ui/Motion';
import { menuCopy } from '../../src/constants/copy';
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from '../../src/constants/legal';
import { colors, fontFamily, spacing, typography } from '../../src/constants/theme';
import { UserSettings } from '../../src/types/settings';
import { NotificationService } from '../../src/services/NotificationService';
import { ProfileService } from '../../src/services/ProfileService';
import { StorageService } from '../../src/services/StorageService';
import { VideoDeliveryService } from '../../src/services/VideoDeliveryService';
import { generateNameCandidates, validatePublicName } from '../../src/utils/username';

type LegalDoc = { title: string; body: string };

export default function MenuScreen() {
  const [settings, setSettings] = useState<UserSettings>(StorageService.getDefaultSettings());
  const [draftName, setDraftName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [legalDoc, setLegalDoc] = useState<LegalDoc | null>(null);

  useFocusEffect(
    useCallback(() => {
      void StorageService.getSettings().then((next) => {
        setSettings(next);
        setDraftName(next.publicName);
        setNameError(null);
      });
    }, []),
  );

  const update = async (next: UserSettings) => {
    setSettings(next);
    await StorageService.saveSettings(next);
    await NotificationService.scheduleDailyRaid(next);
  };

  const commitName = () => {
    const validation = validatePublicName(draftName);
    if (!validation.ok) {
      setNameError(validation.reason);
      return;
    }
    setNameError(null);
    setDraftName(validation.normalized);
    if (validation.normalized === settings.publicName) {
      return;
    }
    const next = { ...settings, publicName: validation.normalized };
    setSettings(next);
    void StorageService.saveSettings(next);
    // Supabaseへの反映は非同期。失敗しても次回起動時に再同期される
    void ProfileService.syncPublicName(validation.normalized);
  };

  const regenerate = () => {
    setCandidates(generateNameCandidates(3));
  };

  const clearCache = () => {
    void VideoDeliveryService.clearCache().then(() => {
      Alert.alert(menuCopy.cacheSection, menuCopy.cacheCleared);
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>{menuCopy.title}</Text>

        <EnterCard index={0}>
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>{menuCopy.profileSection}</Text>
            <TextInput
              value={draftName}
              onChangeText={(value) => {
                setDraftName(value);
                setNameError(null);
              }}
              onBlur={commitName}
              onSubmitEditing={commitName}
              placeholder="夜更かしペンギン"
              placeholderTextColor={colors.textSubtle}
              maxLength={24}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.nameInput}
            />
            {nameError && <Text style={styles.nameError}>{nameError}</Text>}
            <Text style={styles.hint}>{menuCopy.nameHint}</Text>

            <View style={styles.candidateRow}>
              <Chip label={menuCopy.regenerate} onPress={regenerate} compact />
              {candidates.map((candidate) => (
                <Chip
                  key={candidate}
                  label={candidate}
                  compact
                  selected={draftName === candidate}
                  onPress={() => {
                    setDraftName(candidate);
                    setNameError(null);
                  }}
                />
              ))}
            </View>
          </Card>
        </EnterCard>

        <EnterCard index={1}>
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>{menuCopy.notificationSection}</Text>
            <View style={styles.switchRow}>
              <Text style={styles.rowLabel}>{menuCopy.notificationLabel}</Text>
              <Switch
                value={settings.notificationEnabled}
                onValueChange={(notificationEnabled) => void update({ ...settings, notificationEnabled })}
                thumbColor={settings.notificationEnabled ? colors.accent : colors.textSubtle}
                trackColor={{ false: 'rgba(255, 255, 255, 0.12)', true: colors.blueDeep }}
              />
            </View>
            <Text style={styles.hint}>{menuCopy.raidExplain}</Text>
          </Card>
        </EnterCard>

        <EnterCard index={2}>
          <PlansCard />
        </EnterCard>

        <View style={styles.footer}>
          <PrimaryButton label={menuCopy.cacheClear} variant="ghost" onPress={clearCache} />
          <PrimaryButton
            label={menuCopy.redoOnboarding}
            variant="ghost"
            onPress={() => router.push('/onboarding')}
          />
          <PrimaryButton
            label={menuCopy.deleteData}
            variant="danger"
            onPress={() => {
              Alert.alert(menuCopy.deleteConfirmTitle, menuCopy.deleteConfirmBody, [
                { text: 'キャンセル', style: 'cancel' },
                {
                  text: '削除',
                  style: 'destructive',
                  onPress: () => {
                    void StorageService.clearAll()
                      .then(() => VideoDeliveryService.clearCache())
                      .then(() => router.replace('/onboarding'));
                  },
                },
              ]);
            }}
          />

          <View style={styles.legalRow}>
            <Pressable accessibilityRole="button" onPress={() => setLegalDoc(PRIVACY_POLICY)}>
              <Text style={styles.legalLink}>{menuCopy.legalPrivacy}</Text>
            </Pressable>
            <Text style={styles.legalDivider}>・</Text>
            <Pressable accessibilityRole="button" onPress={() => setLegalDoc(TERMS_OF_SERVICE)}>
              <Text style={styles.legalLink}>{menuCopy.legalTerms}</Text>
            </Pressable>
          </View>
        </View>

        <AdBanner placement="menu" />
      </ScrollView>

      <LegalModal
        visible={legalDoc !== null}
        title={legalDoc?.title ?? ''}
        body={legalDoc?.body ?? ''}
        onClose={() => setLegalDoc(null)}
      />
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
  card: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    ...typography.h2,
  },
  nameInput: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  nameError: {
    color: colors.danger,
    ...typography.caption,
  },
  hint: {
    color: colors.textSubtle,
    ...typography.caption,
  },
  candidateRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLabel: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fontFamily.medium,
  },
  footer: {
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingTop: spacing.sm,
  },
  legalLink: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fontFamily.medium,
    textDecorationLine: 'underline',
  },
  legalDivider: {
    color: colors.textSubtle,
    fontSize: 12,
    fontFamily: fontFamily.regular,
  },
});
