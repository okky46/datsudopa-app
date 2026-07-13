
// リザルトのSNS共有。ShareCard をキャプチャして画像で共有シートを開く。
// キャプチャや画像共有に失敗した場合はテキスト共有へフォールバックする。
// 計測は「共有シートを開いたこと」まで（投稿完了は追わない）。

import { RefObject } from 'react';
import { Share, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { APP_CATCHPHRASE, shareCopy } from '../constants/copy';
import { ShareCardData } from '../components/share/ShareCard';
import { formatDateForShare, formatDurationJa } from '../utils/date';
import { AnalyticsService } from './AnalyticsService';

export function getInviteUrl(): string | undefined {
  const url = process.env.EXPO_PUBLIC_INVITE_URL ?? '';
  return url.length > 0 ? url : undefined;
}

function buildFallbackText(data: ShareCardData): string {
  return [
    `${data.publicName}｜${formatDateForShare(data.dateKey)}`,
    `${data.kindLabel}・${data.completed ? shareCopy.completed : shareCopy.exited}（${formatDurationJa(data.watchedSeconds)}）`,
    `${shareCopy.totalLabel}：${formatDurationJa(data.totalDetoxSeconds)}`,
    `${shareCopy.dopagakiLabel}：${data.dopagakiLevel}`,
    `「${data.title}」`,
    '',
    APP_CATCHPHRASE,
    shareCopy.hashtag,
    ...(data.inviteUrl ? [data.inviteUrl] : []),
  ].join('\n');
}

export class ShareCardService {
  static async shareFromRef(cardRef: RefObject<View | null>, data: ShareCardData): Promise<void> {
    void AnalyticsService.track('share_sheet_opened', { kind: data.kindLabel, completed: data.completed });

    try {
      if (!cardRef.current) {
        throw new Error('card not mounted');
      }
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
        // 360x640 → 1080x1920
        width: 1080,
        height: 1920,
      });
      const Sharing = await import('expo-sharing');
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri.startsWith('file://') ? uri : `file://${uri}`, {
          mimeType: 'image/png',
          dialogTitle: shareCopy.fallbackShareTitle,
        });
        return;
      }
      throw new Error('sharing unavailable');
    } catch {
      await Share.share({ message: buildFallbackText(data), title: shareCopy.fallbackShareTitle });
    }
  }
}
