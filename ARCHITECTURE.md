# ARCHITECTURE.md — 脱ドパ MVP アーキテクチャ

仕様の一次情報源は `MVP_REQUIREMENTS.md`。本書は実装構造の説明。

## 全体方針

- **ローカルファースト**: レイド成立・累計脱ドパ時間・ドパガキ度・履歴・連続日数は端末内（AsyncStorage）で完結する。外部通信ゼロでも公式レイドを完走できる。
- **Supabaseは共有に必要な最低限だけ**: 匿名認証・公開ユーザーネーム・レイド参加記録・同行者名取得・分析イベント。Realtime / Presence / ポーリング / レイド中の接続維持は使わない。
- **通信失敗はキューへ**: 書き込みは端末内キューに積み、次回起動・ホーム表示時に再送。通信の完了を画面遷移やローカル記録の条件にしない。

## ローカルとSupabaseの境界

| データ | ローカル | Supabase |
|---|---|---|
| オンボーディング状態・通知設定 | ✔ | — |
| 視聴セッション（WatchSession） | ✔（正） | レイドのみ同期（副） |
| 累計脱ドパ時間・ドパガキ度・連続日数 | ✔ | — |
| 公開ユーザーネーム | ✔（正） | ✔（同行者表示用） |
| 同行者名 | — | ✔（RPCで最大3件） |
| 分析イベント | ✔（キュー） | ✔（バッチ送信先） |
| 動画manifest・キャッシュ | ✔ | —（動画はCloudflare） |

## レイヤ構成

```
app/                     … expo-router 画面
  onboarding.tsx         … 5画面オンボーディング
  (tabs)/index.tsx       … ホーム（レイド状態・累計・ドパガキ度・週履歴）
  (tabs)/long.tsx        … 今日の1本（通常ロング）
  (tabs)/menu.tsx        … 設定
  raid/active.tsx        … 視聴フロー（raid / catchup / long / first）
  raid/result.tsx        … リザルト・同行者・共有

src/services/
  StorageService         … AsyncStorageの唯一の入口（キー管理）
  SessionService         … セッション開始/確定・累計/連続/週履歴の集計
  DopagakiService        … ドパガキ度の初期化と増減（定数は constants/dopagaki.ts）
  RaidService            … 22:00 JST窓の開始可否・ホーム表示状態
  NotificationService    … 22:00 JST通知×7日・通知タップ→レイド直行
  VideoDeliveryService   … manifest 3段フォールバック・事前DL・キャッシュ
  SupabaseService        … クライアント生成・匿名サインイン（未設定ならnull）
  ProfileService         … 公開ネームのupsert・失敗時の再同期
  RaidSyncService        … レイド参加記録の送信キュー（開始/終了で最大2書き込み）
  CompanionService       … get_raid_companions RPC（最大3件）
  AnalyticsService       … イベントキュー・バッチ送信
  FeatureGateService     … 機能権限（entitlements）と広告モード
  ShareCardService       … 共有カードのキャプチャ→共有シート
  AdsService             … AdMobユニットID解決
```

## セッションと二重加算防止

- すべての視聴（公式レイド / 追い脱ドパ / 通常ロング / 初回ロング）は一意な `sessionId`（UUID）を持つ `WatchSession`。
- 反映は `SessionService.finalizeSession` の1箇所のみで行い、`status === 'active'` のセッションにしか効かない。二重タップ・二重イベントでも累計・ドパガキ度は1回しか動かない。
- アプリ強制終了で active のまま残ったセッションは、次回起動時に0秒の離脱として確定する（過大加算しない）。
- 追い脱ドパ（22:03以降）は `kind: 'long', longSource: 'catchup'`。公式レイド実績には含めず、累計時間・ドパガキ度改善・ロング履歴として扱う。

## 公式レイドの時刻判定

- `src/utils/jst.ts` がJST（UTC+9固定）で日付キー・レイド開始時刻・窓判定を計算する。端末タイムゾーンに依存しない。
- `raid_id = YYYY-MM-DD_22JST`。`daily_raids` テーブルは作らない（毎日22時固定のため）。
- 開始可能なのは 22:00:00〜22:02:59 かつ当日未参加のときだけ。

## ドパガキ度

定数は `src/constants/dopagaki.ts` に集約:

- 初期値: 30分未満35 / 30分〜1時間55 / 1〜2時間75 / 2時間以上90
- 完走 −3 / 途中離脱 +1 / 当日未参加 +1（日付単位で1回、遡りは最大3日）
- 通常ロング3分ごと −1（1日最大 −3）
- 0〜100にクランプ。共有・タップ等では増減しない。

## DB通信回数（公式レイド1回あたり最大3回）

1. 開始時: `raid_participations` へ upsert（status=started）
2. 終了時: 同じ `session_id` へ upsert（status=completed/exited）
3. リザルト: `get_raid_companions` RPC 1回

失敗分は `raidSyncQueue`（AsyncStorage）に残り、ホーム表示時に順次再送。一意制約違反（重複参加）は再送不能としてキューから破棄する。

## テーブルとRLS（supabase/migrations/0001_init.sql）

- `profiles(user_id PK, public_name, public_name_normalized, name_status, …)`
  — RLS: 自分の行のみ select/insert/update。
- `raid_participations(session_id PK, raid_id, user_id, public_name_snapshot, status, started_at, finished_at, watched_seconds, …)`
  — `(raid_id, user_id)` 一意。RLS: 自分の行のみ。他人の参加記録一覧は直接取得不可。
- `get_raid_companions(p_raid_id)` — security definer。同一レイド・公式時間内開始・自分以外・name_status=active の名前スナップショットを最大3件だけ返す。
- `analytics_events` — RLS: insertのみ。読み取りはDashboard。
- 集計View: `raid_daily_stats` / `analytics_daily_events`。
- サービスロールキーはアプリへ一切埋め込まない（anonキーのみ）。

## 動画の取得優先順位

manifest: リモート（Cloudflare Static Assets） → 端末キャッシュ → アプリ同梱（`bundledVideos.ts`）。
再生ソース: 同梱アセット → 端末キャッシュ → Static AssetsのURL直接再生 → 生成プレースホルダー描画。

- 再生直前は `getLocalManifest()`（キャッシュ/同梱のみ）で即決し、リモート待ちで22時を逃さない。
- 起動時に今日のレイド動画・ロング動画を事前ダウンロード。キャッシュ上限約400MB、古い順に削除。
- 外部障害時に止まってよいもの: 同行者名・分析同期・追加動画取得・manifest更新。レイド本体・ローカル記録・ドパガキ度は継続する。

## 将来課金の権限モデル

- 画面はプラン名でなく `FeatureGateService.hasFeature(key)` で分岐する。
  権限: `ad_free` / `video_selection` / `video_archive` / `long_duration` / `premium_videos` / `heavy_mode`
- 広告モード: `normal` / `hidden` / `heavy`（heavy_mode > ad_free > normal で導出）
- MVPは全権限false固定。課金導入時は `FeatureGateService.getEntitlements()` の実装だけを購入情報ベースへ差し替える。ヘビーモードは買い切り・月額・上位サブスクのどれにも変更可能。
- 実課金・RevenueCat・購入ボタン・偽の課金成功状態は存在しない（「今後提供予定」表示のみ）。

## 広告（AdMob）

- 表示箇所: ホーム最下部 / 通常ロング開始前画面最下部 / 設定最下部 のみ。
- オンボーディング・公式レイド中・ロング視聴中・リザルト・共有画像には出さない。
- Expo Go ではプレースホルダー表示にフォールバック。
