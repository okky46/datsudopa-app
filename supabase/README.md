# Supabase セットアップ

脱ドパMVPのSupabaseは「匿名認証・公開ユーザーネーム・公式レイド参加記録・同行者名取得・分析イベント」だけに使う。動画は保存しない。RealtimeやPresenceは使わない。

## 1. プロジェクト作成と匿名認証

1. https://supabase.com/dashboard でプロジェクトを作成
2. **Authentication → Sign In / Up → Anonymous sign-ins を有効化**

## 2. マイグレーション適用

`migrations/0001_init.sql` を Dashboard の SQL Editor へ貼り付けて実行する
（または Supabase CLI で `supabase db push`）。

作成されるもの:

- `profiles`（RLS: 自分の行のみ読み書き）
- `raid_participations`（RLS: 自分の行のみ読み書き。`(raid_id, user_id)` 一意）
- `analytics_events`（RLS: insertのみ）
- `get_raid_companions(p_raid_id)` — 同行者名を最大3件だけ返す security definer 関数。
  他人の参加記録の直接一覧取得はRLSで不可
- 集計View: `raid_daily_stats` / `analytics_daily_events`

## 3. アプリ側の環境変数

```sh
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...   # anonキー（service roleキーは絶対に使わない）
```

未設定の場合、アプリはSupabase通信を一切行わず、完全にローカルで動作する。

## 4. 通信回数の設計

公式レイド1回あたり最大3回:

1. 開始時: `raid_participations` へ upsert（status=started）
2. 終了時: 同じ session_id へ upsert（status=completed/exited）
3. リザルト: `get_raid_companions` RPC を1回

失敗した書き込みは端末内キュー（AsyncStorage）に残り、次回起動時・ホーム表示時に再送される。

## 5. 名前の運用

問題のある公開ネームは Dashboard で `profiles.name_status` を `blocked` にすると、
同行者表示から除外される（専用管理画面は作らない）。
