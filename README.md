# 脱ドパ MVP

> ショート中毒者が、毎晩同じ時間に集まって、3分間何も起きない映像を見るアプリ。

毎日22:00 JSTにローカル通知が届き、3分以内に参加すると「公式レイド」が始まる。知らない人たちと同じ時間に、全員共通の「何も起きない映像」を3分見る。ショートに消えていた時間を、累計脱ドパ時間として少しずつ取り戻す。

- 仕様の一次情報源: [`MVP_REQUIREMENTS.md`](./MVP_REQUIREMENTS.md)
- 実装構造: [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- 移行チェックリスト: [`MIGRATION_CHECKLIST.md`](./MIGRATION_CHECKLIST.md)

技術: Expo (SDK 56) / React Native / TypeScript / expo-router

## 実装済みの主要機能

- 毎日22:00 JST固定の公式レイド（開始猶予180秒: 22:00:00〜22:02:59のみ開始可能）
- 通知タップから公式レイドへ直接遷移。22:03以降は「追い脱ドパ」導線
- 5画面オンボーディング（問題提起 → 利用時間 → 損失可視化 → レイド説明＋公開ネーム → 初回3分ロング）
- 公開ユーザーネーム: 自動生成3候補・再生成・自由入力・NFKC正規化・NGワード検査（クライアント＋DB制約）
- 累計脱ドパ時間（途中離脱分も加算・`session_id` による二重加算防止）
- ドパガキ度（エンタメ指標。初期値は自己申告から。定数は `src/constants/dopagaki.ts`）
- 連続脱ドパ日数（1日合計3分以上で継続）・今週の履歴
- 通常ロング「今日の1本」（3/10/30/60分プリセット）
- Supabase最小連携: 匿名認証・profiles・raid_participations・同行者名（実在ユーザー最大3人）・分析イベント
- オフラインキュー: 通信失敗時は端末内に保存し、次回起動時に再送。**外部通信なしでも公式レイドは成立する**
- 動画基盤: remote manifest → cached → bundled の3段フォールバック、事前ダウンロード、キャッシュ上限管理
- SNS共有画像（縦長カードを生成して共有シートを開く）
- FeatureGate による将来課金準備（実課金なし・「今後提供予定」表示のみ）
- AdMobバナー: ホーム / ロング開始前 / 設定 の各最下部のみ

## セットアップ

```sh
npm install
npm run start
```

- Expo Go: 実機でQRコードを読み取る（AdMob実バナー以外はほぼ確認可能。広告枠はプレースホルダー表示）
- development build（AdMob含む確認）:

  ```sh
  npx expo prebuild
  npm run dev:android   # または dev:ios（macOS + Xcode）
  ```

型チェック:

```sh
npm run typecheck
```

## 環境変数

すべて任意。未設定の場合、Supabase通信・リモート動画取得は行われず、完全ローカルで動作する。

```sh
# Supabase（匿名認証・参加記録・同行者・分析）
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...       # anonキーのみ。service roleキーは絶対に入れない

# Cloudflare Workers Static Assets（追加映像の配信元）
EXPO_PUBLIC_VIDEO_BASE_URL=https://datsudopa-videos.<account>.workers.dev

# SNS共有画像に載せる招待URL
EXPO_PUBLIC_INVITE_URL=https://example.com/datsudopa

# AdMob（未設定時はGoogle公式テストIDへフォールバック）
EXPO_PUBLIC_ADMOB_ANDROID_APP_ID=ca-app-pub-xxxx~yyyy
EXPO_PUBLIC_ADMOB_IOS_APP_ID=ca-app-pub-xxxx~yyyy
EXPO_PUBLIC_ADMOB_BANNER_ANDROID=ca-app-pub-xxxx/yyyy
EXPO_PUBLIC_ADMOB_BANNER_IOS=ca-app-pub-xxxx/yyyy

# ストア用ID
EXPO_PUBLIC_ANDROID_PACKAGE=com.example.datsudopa
EXPO_PUBLIC_IOS_BUNDLE_ID=com.example.datsudopa
EXPO_PUBLIC_EAS_PROJECT_ID=...
```

AdMob App IDはネイティブ設定に入るため、変更したら `npx expo prebuild` からやり直す。

## Supabase

手順は [`supabase/README.md`](./supabase/README.md) を参照。

1. プロジェクト作成 → **Anonymous sign-ins を有効化**
2. `supabase/migrations/0001_init.sql` を SQL Editor で実行（テーブル・RLS・同行者RPC・集計View）
3. URLとanonキーを環境変数へ

公式レイド1回あたりの通信は最大3回（開始保存・終了更新・同行者名3件取得）。分析イベントは端末内キューからまとめて送信し、Supabase Dashboard の SQL View（`raid_daily_stats` / `analytics_daily_events`）で確認する。

## 動画の配置と差し替え

### アプリ同梱（必須・最終フォールバック）

1. `assets/videos/` に `void-001.mp4` 〜 `void-007.mp4` を配置
   （30〜90秒ループ / MP4 / H.264 / 720p / 24または30fps / 1本4〜12MB、合計40〜80MB目安）
2. `src/constants/bundledVideos.ts` の `BUNDLED_VIDEO_MODULES` の `null` を
   `require('../../assets/videos/void-001.mp4')` に差し替える
3. `npm run typecheck` → 実機確認

実動画が未配置の間は、静かな生成プレースホルダー描画でレイドが成立する（開発用）。

### 追加映像（Cloudflare Workers Static Assets）

手順は [`cloudflare/README.md`](./cloudflare/README.md) を参照。`cloudflare/public/videos/` にmp4（1ファイル25MiB未満・原則22MiB以下）を置き、`manifest.json` を更新して `npx wrangler deploy`。動画取得は静的アセットURLへの直接アクセスのみで、Workerコードは実行されない。R2 / Supabase Storage / Cloudflare Stream / HLS は使わない。

## 障害時の挙動

- Supabase未設定・通信失敗: レイド・累計時間・ドパガキ度・履歴はすべてローカルで継続。参加記録はキューに残り後で再送。同行者欄は代替の一文（架空名は出さない）
- manifest・動画取得失敗: キャッシュ → 同梱 → プレースホルダー描画へフォールバック。**外部通信失敗だけでレイドを失敗扱いにしない**
- アプリのbackground/inactive（公式レイド中）: 途中離脱として記録。そこまでの視聴時間は累計へ加算

## 文言・数値の編集

- 画面コピー: `src/constants/copy.ts`
- ドパガキ度の初期値・増減ルール: `src/constants/dopagaki.ts`
- レイド時刻・猶予・視聴時間: `src/constants/raid.ts`
- 名前生成ワード・日本語NGワード: `src/constants/usernames.ts`

## ストアビルドへ進むためのTODO

- `eas init` で projectId を設定
- 本番の bundle identifier / package name / AdMob ID を設定
- 実動画を `assets/videos/` と Cloudflare へ配置
- プライバシーポリシー・利用規約の文面確定（`src/constants/legal.ts`）
- Supabase本番プロジェクトへマイグレーション適用
