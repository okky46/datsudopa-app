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

## テスト・CI

```sh
npm run typecheck   # 型チェック（__tests__ は ts-jest 側で型チェック）
npm test            # jest 単体テスト（純粋ロジック）
```

GitHub Actions（`.github/workflows/ci.yml`）が main と Pull Request で `npm ci` → `npm run typecheck` → `npm test` を実行する。

## Supabase

手順は [`supabase/README.md`](./supabase/README.md) を参照。

1. プロジェクト作成 → **Anonymous sign-ins を有効化**
2. マイグレーションを **順番に** SQL Editor で実行（または `supabase db push`）:
   - `0001_init.sql` — テーブル・RLS・同行者RPC・集計View
   - `0002_security_hardening.sql` — RPC化・直接DML封じ・View private化
   - `0003_analytics_event_id.sql` — 分析イベントの event_id 一意化
   - `0004_pr8_followup_hardening.sql` — 公開名検査強化・3引数start RPC・raid_id正規化
3. URLとanonキーを環境変数へ

### 既存環境（PR #7 の 0001 のみ適用済み）からの移行

`0002`、`0003`、`0004` を追加適用するだけでよい（0001は書き換えず、追加マイグレーションとして分離してある）。
`0002` は直接 upsert を封じ RPC へ切り替えるため、**必ずこのバージョンのアプリと同時に適用**する
（古いアプリは直接 upsert が拒否され参加記録を送れなくなる。ローカル記録は影響を受けない）。

### RPC構成（クライアントはこれらだけを呼ぶ）

- `set_public_name(p_public_name)` — 公開名の設定/更新（サーバー側で正規化・検査、name_status変更不可）
- `start_raid_participation(p_session_id, p_raid_id, p_started_at)` — 開始（user_id/snapshot/時刻/公式判定はサーバー決定。`raid_id` はサーバー現在時刻のJST日付から生成される `YYYY-MM-DD_22JST` のみ許可）
- `finish_raid_participation(p_session_id, p_status, p_watched_seconds)` — 終了（本人のstartedのみ・0〜180クランプ）
- `get_raid_companions(p_raid_id)` — 同行者名（参加者のみ・最大3件・安定ハッシュ順・blocked除外）

公式レイド1回あたりの通信は最大3回（開始RPC・終了RPC・同行者RPC）。分析イベントは端末内キューから
event_id付きでまとめて upsert 送信し、`private` スキーマの SQL View（`private.raid_daily_stats` /
`private.analytics_daily_events`）を Dashboard（service role）で確認する。問題のある公開名は
`profiles.name_status` を `blocked` にすると同行者表示から除外される。

## データ削除の範囲

設定の「端末内データを削除」は次を削除する: スケジュール済み通知の全キャンセル・Supabase匿名セッションの
サインアウト・動画キャッシュ・端末内AsyncStorage。**Supabase上の匿名データ（profiles / raid_participations /
analytics_events）は対象外**（匿名ユーザー削除には service role / Edge Function が必要で、サービスロール
キーをアプリに埋め込まない方針のため）。この範囲はボタン名・確認文言・プライバシーポリシーに明記している。

## 動画の配置と差し替え

### 動画IDのバージョン管理

動画IDは `void-001-v1` のようにバージョン付き。同梱IDとリモートIDが同一だと同梱が常に優先され、
リモート更新が反映されない。映像を差し替えるときは新バージョン（例 `void-001-v2`）を使うと、同梱に無い
新IDとしてリモート/キャッシュから配信される。キャッシュはID単位なので新旧が混ざらない
（= 新IDへの切り替えがそのままキャッシュ無効化になる）。manifest 更新時は `videos`/`rotation`/必要なら
`daily` のIDを新バージョンへ差し替える。

### アプリ同梱（必須・最終フォールバック）

1. `assets/videos/` に `void-001-v1.mp4` 〜 `void-007-v1.mp4` を配置
   （30〜90秒ループ / MP4 / H.264 / 720p / 24または30fps / 1本4〜12MB、合計40〜80MB目安）
2. `src/constants/bundledVideos.ts` の `BUNDLED_VIDEO_MODULES` の `null` を
   `require('../../assets/videos/void-001-v1.mp4')` に差し替える
3. `npm run typecheck` → 実機確認

実動画が未配置の間は、静かな生成プレースホルダー描画でレイドが成立する（開発用・画面/READMEに明記）。

### 追加映像（Cloudflare Workers Static Assets）

手順は [`cloudflare/README.md`](./cloudflare/README.md) を参照。`cloudflare/public/videos/` にmp4（1ファイル25MiB未満・原則22MiB以下）を置き、`manifest.json` を更新して `npx wrangler deploy`。動画取得は静的アセットURLへの直接アクセスのみで、Workerコードは実行されない。R2 / Supabase Storage / Cloudflare Stream / HLS は使わない。

## 障害時の挙動

- Supabase未設定・通信失敗: レイド・累計時間・ドパガキ度・履歴はすべてローカルで継続。参加記録はキューに残り後で再送。ただし22:03 JST以降など公式窓外になったstartはサーバー公式参加へ登録せず、ローカル限定のunsynced実績として残す。同行者欄は代替の一文（架空名は出さない）
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
