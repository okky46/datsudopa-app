
// アプリ同梱の公式レイド用映像。外部通信が一切できなくても、
// ここにある情報だけで公式レイドが成立する（最後のフォールバック）。
//
// 動画IDのバージョン管理:
//   動画IDは `void-001-v1` のようにバージョン付きにする。
//   同梱IDとリモートIDが同一だと同梱が常に優先され、リモート更新が反映されない。
//   映像を差し替えるときは新しいバージョン（例 `void-001-v2`）を使うと、
//   同梱に無い新IDとして扱われ、リモート/キャッシュから配信される（キャッシュはID単位なので混ざらない）。
//
// 実動画の差し替え手順:
// 1. assets/videos/ に void-001-v1.mp4 〜 void-007-v1.mp4 を配置する
//    （30〜90秒ループ / MP4 / H.264 / 720p / 24または30fps / 1本4〜12MB目安）
// 2. 下の BUNDLED_VIDEO_MODULES の null を require(...) に差し替える
//    例: 'void-001-v1': require('../../assets/videos/void-001-v1.mp4'),
// 3. `npm run typecheck` を通して起動確認する
//
// null のままの動画は、静かな生成プレースホルダー描画で再生が成立する（開発用）。

import { VideoManifest } from '../types/video';

export const BUNDLED_VIDEO_MODULES: Record<string, number | null> = {
  'void-001-v1': null, // require('../../assets/videos/void-001-v1.mp4'),
  'void-002-v1': null, // require('../../assets/videos/void-002-v1.mp4'),
  'void-003-v1': null, // require('../../assets/videos/void-003-v1.mp4'),
  'void-004-v1': null, // require('../../assets/videos/void-004-v1.mp4'),
  'void-005-v1': null, // require('../../assets/videos/void-005-v1.mp4'),
  'void-006-v1': null, // require('../../assets/videos/void-006-v1.mp4'),
  'void-007-v1': null, // require('../../assets/videos/void-007-v1.mp4'),
};

/**
 * アプリ同梱manifest（3段フォールバックの最終段）。
 * リモート配信側の manifest.json（cloudflare/public/manifest.json）と同じ形。
 */
export const BUNDLED_MANIFEST: VideoManifest = {
  version: 1,
  updatedAt: '2026-07-13',
  videos: [
    { id: 'void-001-v1', title: '誰もいない駅のホーム', file: 'videos/void-001-v1.mp4', durationSeconds: 60, access: 'free' },
    { id: 'void-002-v1', title: '雨上がりの交差点', file: 'videos/void-002-v1.mp4', durationSeconds: 60, access: 'free' },
    { id: 'void-003-v1', title: '蛍光灯の廊下', file: 'videos/void-003-v1.mp4', durationSeconds: 60, access: 'free' },
    { id: 'void-004-v1', title: '夜の立体駐車場', file: 'videos/void-004-v1.mp4', durationSeconds: 60, access: 'free' },
    { id: 'void-005-v1', title: '止まったエスカレーター', file: 'videos/void-005-v1.mp4', durationSeconds: 60, access: 'free' },
    { id: 'void-006-v1', title: '真夜中の自販機', file: 'videos/void-006-v1.mp4', durationSeconds: 60, access: 'free' },
    { id: 'void-007-v1', title: '波のない湖面', file: 'videos/void-007-v1.mp4', durationSeconds: 60, access: 'free' },
  ],
  daily: {},
  rotation: ['void-001-v1', 'void-002-v1', 'void-003-v1', 'void-004-v1', 'void-005-v1', 'void-006-v1', 'void-007-v1'],
};
