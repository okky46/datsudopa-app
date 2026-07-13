# Cloudflare Workers Static Assets（追加映像の配信）

追加の公式レイド映像・ロング映像は Cloudflare Workers Static Assets から配信する。
R2 / Supabase Storage / Cloudflare Stream / HLS はMVPでは使わない。

## 構成

```
cloudflare/
  wrangler.toml        # assetsのみのWorker設定（Workerコードなし）
  public/
    manifest.json      # 動画一覧・日別指定・ローテーション
    videos/
      void-001.mp4     # 実動画（このリポジトリには含まれない）
      ...
```

- 動画取得は静的アセットURLへの直接アクセスのみ。**Workerスクリプトは実行されない**ため、
  大量アクセスがCPU課金へ直結しない。
- 1ファイル **25MiB未満**（Static Assetsの上限）。原則 **22MiB以下** を目安にする。

## デプロイ手順

1. `cloudflare/public/videos/` に mp4 を配置（30〜90秒ループ / H.264 / 720p / 4〜12MB目安）
2. `manifest.json` の `videos` / `rotation` / 必要なら `daily`（JST日付キー → 動画ID）を更新
3. デプロイ:

   ```sh
   cd cloudflare
   npx wrangler deploy
   ```

4. 発行されたURL（例: `https://datsudopa-videos.<account>.workers.dev`）をアプリの環境変数へ:

   ```sh
   EXPO_PUBLIC_VIDEO_BASE_URL=https://datsudopa-videos.<account>.workers.dev
   ```

## アプリ側の挙動（VideoDeliveryService）

- manifest取得順: リモート `${BASE_URL}/manifest.json` → 端末キャッシュ → アプリ同梱
- 起動時に今日のレイド動画・ロング動画をバックグラウンドで事前ダウンロード
- 22時はローカル（同梱 or キャッシュ）再生を優先。未取得時のみStatic AssetsのURLを直接再生
- すべて失敗した場合はアプリ同梱映像（未配置ならプレースホルダー描画）へフォールバック
- 端末キャッシュは約400MBを上限に、古いものから削除

`EXPO_PUBLIC_VIDEO_BASE_URL` 未設定の場合、リモート取得は一切行わず同梱のみで動作する。
