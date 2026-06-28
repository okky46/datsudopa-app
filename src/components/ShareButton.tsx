
import { Alert } from 'react-native';
import { DailyResult } from '../types/result';
import { ShareService } from '../services/ShareService';
import { PrimaryButton } from './PrimaryButton';

type Props = {
  result?: DailyResult | null;
  compact?: boolean;
};

export function ShareButton({ result, compact = false }: Props) {
  return (
    <PrimaryButton
      label={compact ? '共有' : '本日の報告書を共有'}
      variant={compact ? 'ghost' : 'primary'}
      disabled={!result}
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
