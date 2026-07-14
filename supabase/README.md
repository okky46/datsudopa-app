# Supabase セットアップ

脱ドパMVPのSupabaseは「匿名認証・公開ユーザーネーム・公式レイド参加記録・同行者名取得・分析イベント」だけに使う。動画は保存しない。RealtimeやPresenceは使わない。

## 1. プロジェクト作成と匿名認証

1. https://supabase.com/dashboard でプロジェクトを作成
2. **Authentication → Sign In / Up → Anonymous sign-ins を有効化**

## 2. マイグレーション適用

`migrations/` の SQL を **番号順に** Dashboard の SQL Editor で実行する（または `supabase db push`）。

- `0001_init.sql` — テーブル・RLS・同行者RPC・集計View
- `0002_security_hardening.sql` — RPC化・直接DML封じ・View private化
- `0003_analytics_event_id.sql` — 分析イベントの event_id 一意化
- `0004_pr8_followup_hardening.sql` — 公開名検査強化・3引数start RPC・raid_id正規化

### 既存環境（0001だけ適用済み）からの追加適用

`0002`、`0003`、`0004` を追加適用するだけでよい（0001は書き換えない）。**`0002` は必ず対応バージョンのアプリと
同時に適用**すること（直接 upsert を封じ RPC へ移行するため、古いアプリは参加記録を送れなくなる。
ただしローカル記録・累計・ドパガキ度は影響を受けない）。

適用後の構成:

- `profiles`（RLS: 自分の行の select のみ。書き込みは `set_public_name` RPC 経由）
- `raid_participations`（RLS: 自分の行の select のみ。書き込みは start/finish RPC 経由。`(raid_id, user_id)` 一意）
- `analytics_events`（RLS: insertのみ。`event_id` 一意で重複無視）
- RPC（`authenticated` のみ実行可）:
  - `set_public_name(p_public_name)` — 公開名の設定/更新。`user_id=auth.uid()` 固定・サーバー側で
    NFKC正規化と長さ/URL検査・`name_status` は変更不可・blocked は改名不可
  - `start_raid_participation(p_session_id, p_raid_id, p_started_at)` — user_id/snapshot/started_at/status/watched_seconds を
    サーバー決定。公式時間は now() で判定し、`p_raid_id` はサーバー現在時刻のJST日付から作る `YYYY-MM-DD_22JST` と完全一致する場合だけ受理（端末時計・suffix偽装不可）。冪等
  - `finish_raid_participation(p_session_id, p_status, p_watched_seconds)` — 本人の started のみ更新。
    watched_seconds を 0〜180 にクランプ・finished_at=now()。冪等
  - `get_raid_companions(p_raid_id)` — 呼び出し本人が公式参加している場合のみ、自分以外の公開名を
    最大3件（安定ハッシュ順・blocked除外）
- 集計View: `private.raid_daily_stats` / `private.analytics_daily_events`（anon/authenticated から参照不可。
  Dashboard/service role のみ）

## 3. アプリ側の環境変数

```sh
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...   # anonキー（service roleキーは絶対に使わない）
```

未設定の場合、アプリはSupabase通信を一切行わず、完全にローカルで動作する。

## 4. 通信回数の設計

公式レイド1回あたり最大3回:

1. 開始時: `start_raid_participation` RPC
2. 終了時: `finish_raid_participation` RPC
3. リザルト: `get_raid_companions` RPC を1回

失敗した書き込み（ネットワーク/タイムアウト）は端末内キュー（AsyncStorage）に残り、
次回起動時・ホーム表示時に再送される。ただし開始RPCの公式参加判定はサーバー現在時刻のみを信頼するため、22:03 JST以降に再送されたstartは確定的に破棄され、対応するfinishも送信しない。ローカル履歴・累計時間・ドパガキ度は保持され、サーバー同期できなかったセッションはローカル限定のunsyncedとして識別する。

## 5. 名前の運用

問題のある公開ネームは Dashboard で `profiles.name_status` を `blocked` にすると、
同行者表示から除外される（専用管理画面は作らない）。
