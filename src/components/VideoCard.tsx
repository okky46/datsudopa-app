
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';
import { VideoAsset } from '../types/video';

type Props = {
  video: VideoAsset;
  selected?: boolean;
  onPress: () => void;
};

export function VideoCard({ video, selected = false, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={[styles.card, selected && styles.selected]}>
      <View style={styles.thumb}>
        <Text style={styles.thumbText}>{video.mood.replace('_', ' ')}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{video.title}</Text>
        <Text style={styles.meta}>{video.creatorName || 'unknown'} / {video.sourceType}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selected: {
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentSoft,
  },
  thumb: {
    width: 82,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.blueDeep,
  },
  thumbText: {
    color: colors.textSubtle,
    fontSize: 10,
    letterSpacing: 1,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  meta: {
    color: colors.textSubtle,
    fontSize: 12,
  },
});
