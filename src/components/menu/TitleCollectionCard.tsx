
import { StyleSheet, Text, View } from 'react-native';
import { menuCopy } from '../../constants/copy';
import { colors, fontFamily, radius, spacing, typography } from '../../constants/theme';
import { TitleEntry } from '../../services/TitleService';
import { Card } from '../ui/Card';
import { PressableScale } from '../ui/Motion';

type Props = {
  titles: TitleEntry[];
  selectedId: string;
  onSelect: (id: string) => void;
};

function LockGlyph() {
  return (
    <View style={styles.lock}>
      <View style={styles.lockShackle} />
      <View style={styles.lockBody} />
    </View>
  );
}

function RadioMark({ selected }: { selected: boolean }) {
  return (
    <View style={[styles.radio, selected && styles.radioSelected]}>
      {selected && <View style={styles.radioDot} />}
    </View>
  );
}

export function TitleCollectionCard({ titles, selectedId, onSelect }: Props) {
  return (
    <Card style={styles.card}>
      <Text style={styles.sectionTitle}>{menuCopy.titlesSectionTitle}</Text>
      <Text style={styles.hint}>{menuCopy.titlesHint}</Text>

      <View style={styles.list}>
        {titles.map((title) => {
          const selected = title.unlockedNow && title.id === selectedId;
          return (
            <PressableScale
              key={title.id}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled: !title.unlockedNow }}
              accessibilityLabel={title.unlockedNow ? `称号 ${title.name}` : '未解放の称号'}
              disabled={!title.unlockedNow}
              onPress={() => onSelect(title.id)}
              style={[styles.row, selected && styles.rowSelected, !title.unlockedNow && styles.rowLocked]}
            >
              <View style={styles.rowText}>
                <Text style={[styles.titleName, !title.unlockedNow && styles.titleNameLocked]} numberOfLines={1}>
                  {title.unlockedNow ? title.name : menuCopy.titlesLockedLabel}
                </Text>
                <Text style={styles.titleHint} numberOfLines={1}>
                  {title.hint}
                </Text>
              </View>
              {title.unlockedNow ? <RadioMark selected={selected} /> : <LockGlyph />}
            </PressableScale>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    ...typography.h2,
  },
  hint: {
    color: colors.textSubtle,
    ...typography.caption,
  },
  list: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardStrong,
  },
  rowSelected: {
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentSoft,
  },
  rowLocked: {
    opacity: 0.6,
  },
  rowText: {
    flex: 1,
    gap: 1,
  },
  titleName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: fontFamily.bold,
  },
  titleNameLocked: {
    color: colors.textSubtle,
    letterSpacing: 2,
  },
  titleHint: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fontFamily.medium,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.accent,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
  lock: {
    width: 14,
    alignItems: 'center',
  },
  lockShackle: {
    width: 8,
    height: 7,
    borderWidth: 1.6,
    borderBottomWidth: 0,
    borderColor: colors.textSubtle,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  lockBody: {
    width: 13,
    height: 9,
    borderRadius: 2.5,
    marginTop: -1,
    backgroundColor: colors.textSubtle,
  },
});
