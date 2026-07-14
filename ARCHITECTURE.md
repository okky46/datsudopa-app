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
  StorageService         … AsyncStorageの唯一の入口（キー管理・progressStateV1）
  ProgressService        … 累計/ドパガキ度/日次ロング/未参加/初回日を単一状態で原子的に更新
  SessionService         … セッション開始（mutex排他）・確定（2段+復旧）・連続/週履歴の集計
  RaidService            … 22:00 JST窓の開始可否（active含む）・ホーム表示状態
  NotificationService    … 22:00 JST通知×7日・全キャンセル・通知タップの identifier 受け渡し
  VideoDeliveryService   … manifest 3段フォールバック・事前DL・キャッシュ（動画IDはバージョン付き）
  SupabaseService        … クライアント生成・匿名サインイン・サインアウト（未設定ならnull）
  ProfileService         … 公開ネームを set_public_name RPC で同期・失敗時再送
  RaidSyncService        … start/finish_raid_participation RPC の送信キュー（開始/終了で最大2書き込み）
  CompanionService       … get_raid_companions RPC（参加者のみ・最大3件）
  AnalyticsService       … event_id付きイベントキュー（mutex）・バッチupsert送信
  DataResetService       … 端末内データ削除（通知全キャンセル・サインアウト・キャッシュ/Storage削除）
  FeatureGateService     … 機能権限（entitlements）と広告モード
  ShareCardService       … 共有カードのキャプチャ→共有シート
  AdsService             … AdMobユニットID解決

src/hooks/
  useRaidNotificationRouter … 通知タップ遷移を一元管理（identifier dedup・ナビ準備待ち・
                              オンボ優先・窓外はホーム）
src/utils/
  jst                    … JST固定の日付/レイド窓計算
  mutex                  … 非同期mutex（直列キュー）。start/finalize/analyticsで使用
  username               … 公開名の正規化・検査・候補生成
```

## セッションと二重加算防止・原子性

- すべての視聴（公式レイド / 追い脱ドパ / 通常ロング / 初回ロング）は一意な `sessionId`（UUID）を持つ `WatchSession`。
- **開始の排他**: `SessionService.startSession` は mutex で直列化し、公式レイドは当日セッションが
  `active/completed/exited` のいずれでも存在すれば拒否する（`null` を返す）。ボタン連打・通知二重処理・
  画面二重遷移でも1セッションだけ作られる。窓外開始も拒否する（UI判定に依存しない最終防衛）。
- **確定の原子性**: `finalizeSession` は 2 段。
  1. mutex内でセッション状態を finalized に更新（`sessions` への単一書き込み）
  2. `ProgressService.applySessionEffects` が累計・ドパガキ度を **1回の read-modify-write** で原子的に反映
  効果反映済みのセッションIDは `progressStateV1.appliedSessionIds` に記録し、二重反映を防ぐ。
  1) と 2) の間で中断しても、起動時 `SessionService.recoverOnStartup` →
  `ProgressService.recoverPendingEffects` が未反映セッションを1回だけ反映して復旧する。
- 画面アンマウント（タブ遷移・pop・ジェスチャー）でも `active.tsx` の cleanup が未確定セッションを
  finalize し、そこまでの視聴時間を保存して active を残さない。二重呼び出しは finalize が無効化する。
- 追い脱ドパ（22:03以降）は `kind: 'long', longSource: 'catchup'`。公式レイド実績には含めず、累計時間・ドパガキ度改善・ロング履歴として扱う。

## ローカル進捗状態（progressStateV1）

累計脱ドパ時間・ドパガキ度・日次ロング累計/適用step・未参加処理・初回利用日・
`firstEligibleRaidDateKey`・`appliedSessionIds` を **単一オブジェクト** にまとめ、`ProgressService` が
mutex で直列化して 1 書き込みで更新する。旧個別キーからは初回読み込み時に一度だけ移行する。

## 公式レイドの時刻判定

- `src/utils/jst.ts` がJST（UTC+9固定）で日付キー・レイド開始時刻・窓判定を計算する。端末タイムゾーンに依存しない。
- `raid_id = YYYY-MM-DD_22JST`。`daily_raids` テーブルは作らない（毎日22時固定のため）。
- 開始可能なのは 22:00:00〜22:02:59 かつ当日未参加のときだけ。サーバー側 RPC も now() で同じ窓を再検証する。

## ドパガキ度

定数は `src/constants/dopagaki.ts` に集約:

- 初期値: 30分未満35 / 30分〜1時間55 / 1〜2時間75 / 2時間以上90
- 完走 −3 / 途中離脱 +1 / 当日未参加 +1（日付単位で1回、遡りは最大3日）
- 通常ロングは **日次累計** で判定: `eligibleSteps = min(3, floor(日次ロング累計秒/180))`、
  `newSteps = eligibleSteps − 適用済みstep`。2分+2分→−1、1分30秒+1分30秒→−1、1日最大 −3。
- **初回利用日**: 22:03以降に初回登録した場合は `firstEligibleRaidDateKey` を翌日に設定し、当日の未参加+1を付けない。
- 0〜100にクランプ。共有・タップ等では増減しない。

## 通知タップの遷移

`useRaidNotificationRouter` が一元管理する。コールドスタート（`getLastNotificationResponseAsync`）と
フォアグラウンドのレスポンスリスナーの両方から呼ばれても、通知 identifier で dedup し1回だけ遷移する。
遷移前に「フォント読込完了・Root Navigation 準備完了・オンボーディング完了・未処理・レイド画面を開いていない・
遷移中でない」を確認する。オンボーディング未完了ならオンボーディングへ、窓外ならホーム（追い脱ドパ導線）へ。

## DB通信回数（公式レイド1回あたり最大3回）

1. 開始時: `start_raid_participation(session_id, raid_id)` RPC
2. 終了時: `finish_raid_participation(session_id, status, watched_seconds)` RPC
3. リザルト: `get_raid_companions(raid_id)` RPC

失敗分（ネットワーク/タイムアウト）は `raidSyncQueue`（AsyncStorage）に残り、ホーム表示時に順次再送。
RPCは冪等（開始は ON CONFLICT DO NOTHING、終了は started のみ更新）。

## RPCによるサーバー側整合性（クライアントは値を注入できない）

- **profiles 更新**: 直接 update/insert はRLS/権限で不可。公開名は `set_public_name(p_public_name)` RPC のみ。
  RPC内で `user_id = auth.uid()` を固定し、サーバー側で NFKC正規化・長さ/URL検査を行う。`name_status` は
  RPCで変更しない（管理者が Dashboard で `blocked` にした状態を本人が解除できない）。blocked ユーザーは改名不可。
- **raid_participations 書き込み**: 直接 upsert は不可。`start_raid_participation` が
  `user_id`/`public_name_snapshot`(=profiles.public_name)/`started_at`(=now())/`status`/`watched_seconds` を
  サーバー側で決定。公式時間内かどうかは **サーバー時刻** で判定するため端末時計を偽装できない。
  `finish_raid_participation` は本人の `started` セッションのみを completed/exited へ更新し、
  `watched_seconds` を 0〜180 にクランプ、`finished_at = now()`。
- **同行者取得**: `get_raid_companions` は呼び出し本人が対象レイドへ公式参加している場合のみ、自分以外の
  公開名を最大3件返す。並び順は `md5(raid_id + auth.uid() + 相手id)` の安定ハッシュ順。blocked 除外。
  他人の参加記録一覧は返さない。
- **集計View**: `raid_daily_stats` / `analytics_daily_events` は `private` スキーマへ隔離し、
  anon/authenticated から参照不可（Dashboard/service role のみ）。
- **分析**: 各イベントに `event_id`(UUID)。DB側 `event_id` 一意 + upsert(重複無視)で二重保存を防ぐ。
- サービスロールキーはアプリへ一切埋め込まない（anonキーのみ）。

## テーブルとRLS

- `supabase/migrations/0001_init.sql`: 初期スキーマ（profiles / raid_participations / analytics_events）。
- `supabase/migrations/0002_security_hardening.sql`: RPC化・直接DML封じ・View private化。
- `supabase/migrations/0003_analytics_event_id.sql`: analytics_events に event_id 一意。

## 動画の取得優先順位

manifest: リモート（Cloudflare Static Assets） → 端末キャッシュ → アプリ同梱（`bundledVideos.ts`）。
再生ソース: 同梱アセット → 端末キャッシュ → Static AssetsのURL直接再生 → 生成プレースホルダー描画。

- 再生直前は `getLocalManifest()`（キャッシュ/同梱のみ）で即決し、リモート待ちで22時を逃さない。
- 起動時に今日のレイド動画・ロング動画を事前ダウンロード。キャッシュ上限約400MB、古い順に削除。
- 外部障害時に止まってよいもの: 同行者名・分析同期・追加動画取得・manifest更新。レイド本体・ローカル記録・ドパガキ度は継続する。
- **動画IDのバージョン管理**: 動画IDは `void-001-v1` のようにバージョン付き。同梱IDとリモートIDが同一だと
  同梱が常に優先されリモート更新が反映されないため、映像差し替え時は新バージョン（`void-001-v2`）を使う。
  キャッシュはID単位なので新旧が混ざらない（キャッシュ無効化 = 新ID）。

## データ削除（DataResetService）

「端末内データを削除」の実削除範囲: スケジュール済み通知の全キャンセル・Supabase匿名セッションのサインアウト・
動画キャッシュ削除・AsyncStorage全削除 → オンボーディングへ。匿名ユーザーのサーバー側レコード削除には
service role / Edge Function が必要で、アプリにサービスロールキーを埋め込まない方針のため今回は範囲外。
ボタン名・確認文言・プライバシーポリシーに「サーバー上の匿名データは対象外」であることを明記している。

## テストとCI

- `__tests__/` に純粋ロジックの単体テスト（jest + ts-jest、node環境）。RN/Expo/Supabase のネイティブ依存は
  `__tests__/mocks/` のインメモリ実装へ差し替える。対象: JST時刻境界・レイド二重起動/連打・finalize二重/
  途中失敗復旧・日次ロングstep・初回未参加判定・分析キュー競合・ユーザーネーム検査。
- 同行者RPCの非参加者拒否・blocked除外・View非公開は SQL(0002) で担保（DBが必要なため単体テスト対象外）。
- CI（`.github/workflows/ci.yml`）は main と PR で `npm ci` → `npm run typecheck` → `npm test`。

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
