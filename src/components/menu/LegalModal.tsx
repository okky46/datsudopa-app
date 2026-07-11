
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { PressableScale } from '../ui/Motion';

type Props = {
  visible: boolean;
  title: string;
  body: string;
  onClose: () => void;
};

// プライバシーポリシー / 利用規約のポップアップ
export function LegalModal({ visible, title, body, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.body}>{body}</Text>
          </ScrollView>
          <PressableScale accessibilityRole="button" accessibilityLabel="閉じる" onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeLabel}>閉じる</Text>
          </PressableScale>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(46, 52, 80, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '80%',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
  },
  title: {
    color: colors.text,
    ...typography.h2,
  },
  scroll: {
    flexGrow: 0,
  },
  body: {
    color: colors.textMuted,
    ...typography.body,
    fontSize: 13,
    lineHeight: 21,
  },
  closeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  closeLabel: {
    color: colors.onPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
});
