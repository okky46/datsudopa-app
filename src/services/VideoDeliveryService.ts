
// 動画の取得・キャッシュ・フォールバックを一手に引き受ける。
// 画面側は ResolvedVideo を受け取るだけで、保存場所（同梱 / キャッシュ / リモート）を意識しない。
//
// manifest の取得順: リモート → キャッシュ済み → アプリ同梱。
// 動画ソースの解決順: 同梱アセット → 端末キャッシュ → Static AssetsのURL → プレースホルダー描画。
// 外部取得の失敗でレイドを失敗扱いにしない。

import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { BUNDLED_MANIFEST, BUNDLED_VIDEO_MODULES } from '../constants/bundledVideos';
import { ManifestVideo, ResolvedVideo, VideoManifest } from '../types/video';
import { jstDateKey } from '../utils/jst';
import { StorageService, VideoCacheEntry } from './StorageService';

/** Cloudflare Workers Static Assets のルートURL（末尾スラッシュなし） */
const VIDEO_BASE_URL = (process.env.EXPO_PUBLIC_VIDEO_BASE_URL ?? '').replace(/\/$/, '');

const MANIFEST_TIMEOUT_MS = 5000;

/** 端末キャッシュの上限（バイト）。超えたら古いものから削除 */
const MAX_CACHE_BYTES = 400 * 1024 * 1024;

const CACHE_DIR = FileSystem.cacheDirectory ? FileSystem.cacheDirectory + 'datsudopa-videos/' : null;

function dayNumber(dateKey: string): number {
  const [year, month, day] = dateKey.split('-').map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function isValidManifest(value: unknown): value is VideoManifest {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const manifest = value as VideoManifest;
  return Array.isArray(manifest.videos) && Array.isArray(manifest.rotation) && manifest.rotation.length > 0;
}

export class VideoDeliveryService {
  static isRemoteConfigured(): boolean {
    return VIDEO_BASE_URL.length > 0;
  }

  /**
   * 再生直前用。リモート取得を待たず cached → bundled だけで即決する。
   * （リモートの反映は起動時の prefetchDaily / getManifest に任せる）
   */
  static async getLocalManifest(): Promise<VideoManifest> {
    const cached = await StorageService.getCachedManifest();
    if (cached && isValidManifest(cached)) {
      return cached;
    }
    return BUNDLED_MANIFEST;
  }

  /** remote → cached → bundled の3段フォールバック */
  static async getManifest(): Promise<VideoManifest> {
    if (VideoDeliveryService.isRemoteConfigured()) {
      try {
        const response = await fetchWithTimeout(`${VIDEO_BASE_URL}/manifest.json`, MANIFEST_TIMEOUT_MS);
        if (response.ok) {
          const parsed: unknown = await response.json();
          if (isValidManifest(parsed)) {
            await StorageService.saveCachedManifest(parsed);
            return parsed;
          }
        }
      } catch {
        // リモート失敗はフォールバックへ
      }
    }
    const cached = await StorageService.getCachedManifest();
    if (cached && isValidManifest(cached)) {
      return cached;
    }
    return BUNDLED_MANIFEST;
  }

  /** 今日の公式レイド動画（全ユーザー共通）。日別指定 → ローテーションの順 */
  static getRaidVideoId(manifest: VideoManifest, dateKey = jstDateKey()): string {
    const daily = manifest.daily?.[dateKey]?.raidVideoId;
    if (daily) {
      return daily;
    }
    return manifest.rotation[dayNumber(dateKey) % manifest.rotation.length];
  }

  /** 今日の通常ロング動画（今日の1本）。レイドとはローテーションをずらす */
  static getLongVideoId(manifest: VideoManifest, dateKey = jstDateKey()): string {
    const daily = manifest.daily?.[dateKey]?.longVideoId;
    if (daily) {
      return daily;
    }
    return manifest.rotation[(dayNumber(dateKey) + 3) % manifest.rotation.length];
  }

  static findMeta(manifest: VideoManifest, videoId: string): ManifestVideo | undefined {
    return manifest.videos.find((video) => video.id === videoId);
  }

  /** 再生ソースの解決。同梱 → キャッシュ → リモートURL → null（プレースホルダー） */
  static async resolveVideo(videoId: string, manifest: VideoManifest): Promise<ResolvedVideo> {
    const meta = VideoDeliveryService.findMeta(manifest, videoId)
      ?? VideoDeliveryService.findMeta(BUNDLED_MANIFEST, videoId);
    const title = meta?.title ?? '何も起きない映像';
    const durationSeconds = meta?.durationSeconds ?? 60;

    const bundled = BUNDLED_VIDEO_MODULES[videoId];
    if (bundled != null) {
      return { id: videoId, title, durationSeconds, source: bundled };
    }

    const cacheEntry = await VideoDeliveryService.findCacheEntry(videoId);
    if (cacheEntry) {
      return { id: videoId, title, durationSeconds, source: cacheEntry.fileUri };
    }

    if (VideoDeliveryService.isRemoteConfigured() && meta) {
      return { id: videoId, title, durationSeconds, source: `${VIDEO_BASE_URL}/${meta.file}` };
    }

    // 実動画が未配置でも、プレースホルダー描画でレイドを成立させる
    return { id: videoId, title, durationSeconds, source: null };
  }

  /**
   * 起動時などに呼ぶ事前ダウンロード。今日のレイド動画・ロング動画を
   * バックグラウンドで端末へ保存し、22時のローカル再生を優先できるようにする。
   */
  static async prefetchDaily(): Promise<void> {
    if (!VideoDeliveryService.isRemoteConfigured() || !CACHE_DIR || Platform.OS === 'web') {
      return;
    }
    try {
      const manifest = await VideoDeliveryService.getManifest();
      const dateKey = jstDateKey();
      const targets = [
        VideoDeliveryService.getRaidVideoId(manifest, dateKey),
        VideoDeliveryService.getLongVideoId(manifest, dateKey),
      ];
      for (const videoId of targets) {
        if (BUNDLED_VIDEO_MODULES[videoId] != null) {
          continue;
        }
        if (await VideoDeliveryService.findCacheEntry(videoId)) {
          continue;
        }
        await VideoDeliveryService.downloadToCache(videoId, manifest);
      }
      await VideoDeliveryService.enforceCacheLimit();
    } catch {
      // 事前取得の失敗は無視（再生時にリモート/プレースホルダーへフォールバック）
    }
  }

  private static async findCacheEntry(videoId: string): Promise<VideoCacheEntry | null> {
    if (!CACHE_DIR) {
      return null;
    }
    const index = await StorageService.getVideoCacheIndex();
    const entry = index.find((item) => item.videoId === videoId);
    if (!entry) {
      return null;
    }
    try {
      const info = await FileSystem.getInfoAsync(entry.fileUri);
      if (info.exists) {
        return entry;
      }
    } catch {
      // fallthrough
    }
    await StorageService.saveVideoCacheIndex(index.filter((item) => item.videoId !== videoId));
    return null;
  }

  private static async downloadToCache(videoId: string, manifest: VideoManifest): Promise<void> {
    if (!CACHE_DIR) {
      return;
    }
    const meta = VideoDeliveryService.findMeta(manifest, videoId);
    if (!meta) {
      return;
    }
    try {
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
      const fileUri = `${CACHE_DIR}${videoId}.mp4`;
      const result = await FileSystem.downloadAsync(`${VIDEO_BASE_URL}/${meta.file}`, fileUri);
      if (result.status !== 200) {
        await FileSystem.deleteAsync(fileUri, { idempotent: true });
        return;
      }
      const info = await FileSystem.getInfoAsync(fileUri);
      const index = await StorageService.getVideoCacheIndex();
      index.push({
        videoId,
        fileUri,
        sizeBytes: info.exists && 'size' in info ? info.size ?? 0 : 0,
        downloadedAt: new Date().toISOString(),
      });
      await StorageService.saveVideoCacheIndex(index);
    } catch {
      // ダウンロード失敗は無視
    }
  }

  /** キャッシュ上限を超えたぶんを古い順に削除する */
  private static async enforceCacheLimit(): Promise<void> {
    const index = await StorageService.getVideoCacheIndex();
    let total = index.reduce((sum, entry) => sum + entry.sizeBytes, 0);
    if (total <= MAX_CACHE_BYTES) {
      return;
    }
    const sorted = [...index].sort((a, b) => a.downloadedAt.localeCompare(b.downloadedAt));
    const kept: VideoCacheEntry[] = [...sorted];
    for (const entry of sorted) {
      if (total <= MAX_CACHE_BYTES) {
        break;
      }
      try {
        await FileSystem.deleteAsync(entry.fileUri, { idempotent: true });
      } catch {
        // 消せなくてもindexからは外す
      }
      total -= entry.sizeBytes;
      kept.splice(kept.indexOf(entry), 1);
    }
    await StorageService.saveVideoCacheIndex(kept);
  }

  /** 設定画面の「キャッシュを削除」 */
  static async clearCache(): Promise<void> {
    if (CACHE_DIR) {
      try {
        await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
      } catch {
        // ディレクトリが無い場合など
      }
    }
    await StorageService.saveVideoCacheIndex([]);
  }
}
