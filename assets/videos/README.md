# assets/videos — アプリ同梱の公式レイド映像

外部通信なしでも公式レイドが成立するよう、最低7本の映像をここへ同梱する。

## 差し替え手順

1. `void-001.mp4` 〜 `void-007.mp4` をこのディレクトリに配置する
   - 30〜90秒で自然にループする映像（3分間ループ再生される）
   - MP4 / H.264 / 720p / 24fpsまたは30fps
   - 1本4〜12MB程度、合計40〜80MB程度
2. `src/constants/bundledVideos.ts` の `BUNDLED_VIDEO_MODULES` の `null` を
   `require('../../assets/videos/void-001.mp4')` の形に差し替える
3. `npm run typecheck` と実機起動で確認する

実動画が未配置の間は、静かな生成プレースホルダー描画で再生が成立する（開発用）。
