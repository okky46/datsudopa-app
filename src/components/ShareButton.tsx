
import { Alert, StyleSheet, View } from 'react-native';
import { DailyResult } from '../types/result';
import { ShareService } from '../services/ShareService';
import { colors } from '../constants/theme';
import { PrimaryButton } from './PrimaryButton';

type Props = {
  result?: DailyResult | null;
  compact?: boolean;
};

function ShareGlyph({ color }: { color: string }) {
  return (
    <View style={styles.shareIcon} accessibilityElementsHidden importantForAccessibility="no">
      <View style={[styles.shareLine, styles.shareLineTop, { backgroundColor: color }]} />
      <View style={[styles.shareLine, styles.shareLineBottom, { backgroundColor: color }]} />
      <View style={[styles.shareDot, styles.shareDotLeft, { borderColor: color }]} />
      <View style={[styles.shareDot, styles.shareDotTop, { borderColor: color }]} />
      <View style={[styles.shareDot, styles.shareDotBottom, { borderColor: color }]} />
    </View>
  );
}

export function ShareButton({ result, compact = false }: Props) {
  return (
    <PrimaryButton
      label={compact ? '共有' : '脱ドパレポートを共有'}
      variant={compact ? 'ghost' : 'primary'}
      disabled={!result}
      icon={<ShareGlyph color={compact ? colors.text : colors.black} />}
      onPress={() => {
        if (!result) {
          Alert.alert('共有できるリザルトがありません', 'まずはレイドか通常視聴を完了してください。');
          return;
        }
        void ShareService.shareResult(result);
      }}
    />
  );
}

const styles = StyleSheet.create({
  shareIcon: {
    width: 20,
    height: 20,
  },
  shareLine: {
    position: 'absolute',
    left: 6,
    width: 9,
    height: 2,
    borderRadius: 999,
  },
  shareLineTop: {
    top: 6,
    transform: [{ rotate: '-24deg' }],
  },
  shareLineBottom: {
    top: 12,
    transform: [{ rotate: '24deg' }],
  },
  shareDot: {
    position: 'absolute',
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  shareDotLeft: {
    left: 0,
    top: 7,
  },
  shareDotTop: {
    right: 0,
    top: 2,
  },
  shareDotBottom: {
    right: 0,
    bottom: 2,
  },
});
