
import { useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent, PanResponder, StyleSheet, Text, View } from 'react-native';
import { colors, gradientBar, radius, shadows, spacing, typography } from '../../constants/theme';
import {
  formatDurationMinutes,
  LONG_DURATION_MAX_MINUTES,
  LONG_DURATION_MIN_MINUTES,
  minutesToRatio,
  ratioToMinutes,
  snapToDurationStep,
} from '../../utils/durationSteps';
import { SoftGradient } from './SoftGradient';

const THUMB_SIZE = 22;

type Props = {
  valueMinutes: number;
  onChange: (minutes: number) => void;
  compact?: boolean;
  // 値を画面の別の場所(セクション見出しなど)に出す場合はfalse
  showValue?: boolean;
};

export function DurationSlider({ valueMinutes, onChange, compact = false, showValue = true }: Props) {
  const [trackWidth, setTrackWidth] = useState(0);
  const snappedMinutes = snapToDurationStep(valueMinutes);
  const ratio = minutesToRatio(snappedMinutes);
  const travel = Math.max(0, trackWidth - THUMB_SIZE);
  const thumbLeft = travel * ratio;

  const setFromOffset = useCallback(
    (offsetX: number) => {
      if (trackWidth <= 0) {
        return;
      }
      const nextRatio = Math.max(0, Math.min(1, (offsetX - THUMB_SIZE / 2) / Math.max(1, travel)));
      onChange(ratioToMinutes(nextRatio));
    },
    [onChange, trackWidth, travel],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => setFromOffset(event.nativeEvent.locationX),
        onPanResponderMove: (event) => setFromOffset(event.nativeEvent.locationX),
      }),
    [setFromOffset],
  );

  const onTrackLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      {showValue && (
        <Text style={[styles.value, compact && styles.valueCompact]}>{formatDurationMinutes(snappedMinutes)}</Text>
      )}

      <View style={styles.rangeRow}>
        <Text style={styles.rangeLabel}>{formatDurationMinutes(LONG_DURATION_MIN_MINUTES)}</Text>
        <Text style={styles.rangeLabel}>{formatDurationMinutes(LONG_DURATION_MAX_MINUTES)}</Text>
      </View>

      <View style={styles.trackWrap} onLayout={onTrackLayout} {...panResponder.panHandlers}>
        <View style={styles.track}>
          <SoftGradient
            colors={gradientBar}
            direction="horizontal"
            borderRadius={radius.pill}
            style={[styles.fill, { width: `${Math.max(4, ratio * 100)}%` }]}
          />
        </View>
        <View style={[styles.thumb, { left: thumbLeft }]} pointerEvents="none" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  cardCompact: {
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  value: {
    color: colors.text,
    fontSize: 32,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.4,
    lineHeight: 38,
  },
  valueCompact: {
    fontSize: 28,
    lineHeight: 32,
  },
  rangeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  rangeLabel: {
    color: colors.textSubtle,
    ...typography.caption,
    fontWeight: '500',
  },
  trackWrap: {
    height: THUMB_SIZE + 8,
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  track: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(46, 52, 80, 0.07)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.accentBorder,
    shadowColor: colors.text,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});
