
// 将来のプレミアム / ヘビーモードの「今後提供予定」表示。
// 購入ボタンや偽の課金状態は置かない。プレミアム（真面目な特典）と
// ヘビーモード（自主的な広告増量ネタ）は別概念として並べる。

import { StyleSheet, Text, View } from 'react-native';
import { menuCopy } from '../../constants/copy';
import { colors, fontFamily, radius, spacing, typography } from '../../constants/theme';
import { Card } from '../ui/Card';

function PlanRow({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.plan}>
      <View style={styles.planHeader}>
        <Text style={styles.planTitle}>{title}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{menuCopy.comingSoon}</Text>
        </View>
      </View>
      <Text style={styles.planBody}>{body}</Text>
    </View>
  );
}

export function PlansCard() {
  return (
    <Card style={styles.card}>
      <Text style={styles.sectionTitle}>{menuCopy.plansSection}</Text>
      <PlanRow title={menuCopy.premiumTitle} body={menuCopy.premiumBody} />
      <View style={styles.divider} />
      <PlanRow title={menuCopy.heavyTitle} body={menuCopy.heavyBody} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    ...typography.h2,
  },
  plan: {
    gap: spacing.xs,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  planTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
  },
  planBody: {
    color: colors.textMuted,
    ...typography.caption,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
});
