import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdBanner } from '../../src/components/AdBanner';
import { PremiumJokeCard } from '../../src/components/PremiumJokeCard';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { ShareGlyph } from '../../src/components/ShareButton';
import { LegalModal } from '../../src/components/menu/LegalModal';
import { TitleCollectionCard } from '../../src/components/menu/TitleCollectionCard';
import { Card } from '../../src/components/ui/Card';
import { Chip } from '../../src/components/ui/Chip';
import { EnterCard, PressableScale } from '../../src/components/ui/Motion';
import { SOCIAL_TIME_OPTIONS } from '../../src/constants/raid';
import { colors, radius, spacing, typography } from '../../src/constants/theme';
import { homeCopy, menuCopy, screenCopy } from '../../src/constants/copy';
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from '../../src/constants/legal';
import { NotificationService } from '../../src/services/NotificationService';
import { ShareService } from '../../src/services/ShareService';
import { StorageService } from '../../src/services/StorageService';
import { TitleEntry, TitleService } from '../../src/services/TitleService';
import { AvatarColorId, SocialTimeSlot, UserSettings } from '../../src/types/settings';

const AVATAR_COLORS: Array<{ id: AvatarColorId; color: string }> = [
  { id: 'mint', color: colors.pastelMint },
  { id: 'lavender', color: colors.pastelLavender },
  { id: 'pink', color: colors.pastelPink },
  { id: 'blue', color: colors.pastelBlue },
  { id: 'yellow', color: colors.pastelYellow },
];

function avatarBackground(id: AvatarColorId) {
  return AVATAR_COLORS.find((item) => item.id === id)?.color ?? colors.pastelMint;
}

function PenGlyph() {
  return (
    <View style={styles.penGlyph}>
      <View style={styles.penBody} />
      <View style={styles.penTip} />
    </View>
  );
}

function CheckGlyph() {
  return (
    <View style={styles.checkGlyph}>
      <View style={styles.checkShort} />
      <View style={styles.checkLong} />
    </View>
  );
}

type LegalDoc = { title: string; body: string };

export default function MenuScreen() {
  const [settings, setSettings] = useState<UserSettings>(StorageService.getDefaultSettings());
  const [editingProfile, setEditingProfile] = useState(false);
  const [draftNickname, setDraftNickname] = useState(StorageService.getDefaultSettings().nickname);
  const [draftAvatarColorId, setDraftAvatarColorId] = useState<AvatarColorId>(
    StorageService.getDefaultSettings().avatarColorId,
  );
  const [titles, setTitles] = useState<TitleEntry[]>([]);
  const [displayTitleId, setDisplayTitleId] = useState('');
  const [legalDoc, setLegalDoc] = useState<LegalDoc | null>(null);

  const load = useCallback(async () => {
    const next = await StorageService.getSettings();
    setSettings(next);
    if (!editingProfile) {
      setDraftNickname(next.nickname);
      setDraftAvatarColorId(next.avatarColorId);
    }
    const results = await StorageService.getDailyResults();
    const unlockStats = await TitleService.getUnlockStats(results);
    setTitles(TitleService.listTitles(unlockStats));
    setDisplayTitleId(TitleService.displayTitle(unlockStats, next).id);
  }, [editingProfile]);

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

  const selectTitle = (id: string) => {
    const next = { ...settings, selectedTitleId: id };
    setSettings(next);
    setDisplayTitleId(id);
    void StorageService.saveSettings(next);
  };

  const beginEditProfile = () => {
    setDraftNickname(settings.nickname);
    setDraftAvatarColorId(settings.avatarColorId);
    setEditingProfile(true);
  };

  const commitEditProfile = () => {
    const nickname = draftNickname.trim() || StorageService.getDefaultSettings().nickname;
    void update({
      ...settings,
      nickname,
      avatarColorId: draftAvatarColorId,
    });
    setDraftNickname(nickname);
    setEditingProfile(false);
  };

  const displayName = (settings.nickname ?? '').trim() || '名無しのドパガキ';
  const activeName = editingProfile ? draftNickname : displayName;
  const activeAvatarId = editingProfile ? draftAvatarColorId : settings.avatarColorId;
  const selectedSlot = SOCIAL_TIME_OPTIONS.find((item) => item.value === settings.socialTimeSlot);
  const timeRangeLabel = selectedSlot ? `脱ドパタイム${selectedSlot.rangeLabel}` : '脱ドパタイム';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>{screenCopy.menuTitle}</Text>

        <EnterCard index={0}>
          <Card style={styles.profileCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.sectionTitle}>{screenCopy.menuProfileTitle}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={editingProfile ? 'プロフィールを保存' : 'プロフィールを編集'}
                onPress={() => (editingProfile ? commitEditProfile() : beginEditProfile())}
                style={({ pressed }) => [styles.editButton, pressed && styles.editButtonPressed]}
              >
                {editingProfile ? <CheckGlyph /> : <PenGlyph />}
              </Pressable>
            </View>

            <View style={styles.profileRow}>
              <Pressable
                disabled={!editingProfile}
                accessibilityRole={editingProfile ? 'button' : undefined}
                accessibilityLabel="アイコンの色を変更"
                onPress={() => {
                  const index = AVATAR_COLORS.findIndex((item) => item.id === draftAvatarColorId);
                  const next = AVATAR_COLORS[(index + 1) % AVATAR_COLORS.length];
                  setDraftAvatarColorId(next.id);
                }}
                style={[styles.avatar, { backgroundColor: avatarBackground(activeAvatarId) }]}
              >
                <Text style={styles.avatarText}>{(activeName.trim() || displayName).slice(0, 1)}</Text>
              </Pressable>

              <View style={styles.profileText}>
                <Text style={styles.profileLabel}>{screenCopy.menuNicknameLabel}</Text>
                {editingProfile ? (
                  <TextInput
                    value={draftNickname}
                    onChangeText={setDraftNickname}
                    placeholder="駅前のドパガキ"
                    placeholderTextColor={colors.textSubtle}
                    maxLength={24}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.nameInput}
                  />
                ) : (
                  <Text style={styles.nameText}>{displayName}</Text>
                )}
              </View>
            </View>

            {editingProfile && (
              <View style={styles.avatarColors}>
                {AVATAR_COLORS.map((item) => (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityLabel={`アイコン色 ${item.id}`}
                    onPress={() => setDraftAvatarColorId(item.id)}
                    style={[
                      styles.avatarColorDot,
                      { backgroundColor: item.color },
                      draftAvatarColorId === item.id && styles.avatarColorDotSelected,
                    ]}
                  />
                ))}
              </View>
            )}

            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={homeCopy.shareLabel}
              onPress={() => void ShareService.shareStatus()}
              style={styles.shareButton}
            >
              <ShareGlyph color={colors.text} size={16} />
              <Text style={styles.shareLabel}>{homeCopy.shareLabel}</Text>
            </PressableScale>
          </Card>
        </EnterCard>

        <EnterCard index={1}>
          <TitleCollectionCard titles={titles} selectedId={displayTitleId} onSelect={selectTitle} />
        </EnterCard>

        <EnterCard index={2}>
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>{screenCopy.menuNotificationTitle}</Text>

            <View style={styles.switchRow}>
              <Text style={styles.rowLabel}>{screenCopy.menuNotificationLabel}</Text>
              <Switch
                value={settings.notificationEnabled}
                onValueChange={(notificationEnabled) => void update({ ...settings, notificationEnabled })}
                thumbColor={settings.notificationEnabled ? colors.accent : colors.textSubtle}
                trackColor={{ false: colors.surfaceSunken, true: colors.blueDeep }}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.rowLabel}>{screenCopy.menuTimeSlotLabel}</Text>
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
              <Text style={styles.timePreview}>{timeRangeLabel}</Text>
              <Text style={styles.timeHint}>{screenCopy.menuTimeSlotHint}</Text>
            </View>
          </Card>
        </EnterCard>

        <EnterCard index={3}>
          <PremiumJokeCard />
        </EnterCard>

        <View style={styles.footer}>
          <PrimaryButton
            label={screenCopy.menuRedoOnboarding}
            variant="ghost"
            onPress={() => router.push('/onboarding')}
          />
          <PrimaryButton label={screenCopy.menuHowTo} variant="ghost" onPress={() => router.push('/howto')} />
          <PrimaryButton
            label={screenCopy.menuDeleteData}
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

          <View style={styles.legalRow}>
            <Pressable accessibilityRole="button" onPress={() => setLegalDoc(PRIVACY_POLICY)}>
              <Text style={styles.legalLink}>プライバシーポリシー</Text>
            </Pressable>
            <Text style={styles.legalDivider}>・</Text>
            <Pressable accessibilityRole="button" onPress={() => setLegalDoc(TERMS_OF_SERVICE)}>
              <Text style={styles.legalLink}>利用規約</Text>
            </Pressable>
          </View>
        </View>

        <AdBanner />
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
  profileCard: {
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editButtonPressed: {
    opacity: 0.75,
  },
  penGlyph: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-45deg' }],
  },
  penBody: {
    width: 3,
    height: 10,
    borderRadius: 1.5,
    backgroundColor: colors.textMuted,
  },
  penTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 2.5,
    borderRightWidth: 2.5,
    borderTopWidth: 4,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.textMuted,
    marginTop: -1,
  },
  checkGlyph: {
    width: 16,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkShort: {
    position: 'absolute',
    left: 1,
    bottom: 3,
    width: 6,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: colors.accent,
    transform: [{ rotate: '45deg' }],
  },
  checkLong: {
    position: 'absolute',
    right: 0,
    bottom: 5,
    width: 11,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: colors.accent,
    transform: [{ rotate: '-50deg' }],
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
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  avatarColors: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  avatarColorDot: {
    width: 28,
    height: 28,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.border,
  },
  avatarColorDotSelected: {
    borderColor: colors.primary,
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
  nameText: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    paddingVertical: 2,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 48,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.cardStrong,
  },
  shareLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
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
  timePreview: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  timeHint: {
    color: colors.textSubtle,
    ...typography.caption,
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
    textDecorationLine: 'underline',
  },
  legalDivider: {
    color: colors.textSubtle,
    fontSize: 12,
  },
});
