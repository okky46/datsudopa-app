# MIGRATION_CHECKLIST.md — 旧仕様 → MVP_REQUIREMENTS.md 移行チェックリスト

移行作業中の進捗管理用。実装完了後は削除してよい。

## Phase 0: 仕様固定

- [x] `MVP_REQUIREMENTS.md` をリポジトリ直下へ配置
- [x] `CLAUDE.md` 冒頭に最優先仕様であることを明記、旧方針を刷新
- [x] `MIGRATION_CHECKLIST.md` 作成
- [x] 旧仕様監査（下記「削除対象」リスト）

## 旧仕様の削除対象（監査結果）

- [x] `PresenceField` / `PresenceBadge` / `PresenceService` / `types/presence.ts` / `constants/presence.ts`（疑似参加人数・淡い点）
- [x] 日付シードによる架空ユーザー・人数生成（`PresenceService.getRaidStats` 等）
- [x] 複数レイド時間帯・ランダムレイド時刻（`RaidScheduleService`、`RAID_TIME_SLOT_CANDIDATES`、`SocialTimeSlot`）
- [x] レイド動画選択・無料向け動画フィード（`VideoFeedCard`、long.tsx のフィード）
- [x] スキップ・倍速・スクロール・共有によるドパガキ度変動（`DopamineService.spike/bumpForShare`、`DopaSpikeOverlay`、`dopaSpikeCopy`、`temptationTotal`）
- [x] 複雑なセッションスコア（`utils/score.ts` の `calculateDopamineScore` 等）
- [x] パチンコ風完走演出（`CelebrationOverlay`）
- [x] 旧8画面オンボーディング（`app/onboarding.tsx` 全面刷新）
- [x] 通常プレミアム＝広告増量ネタの混在（`PremiumJokeCard`、`PremiumStatus.jokeAdsMultiplier`）→ ヘビーモードとして分離
- [x] 一般サンプル動画（`remote-sample-night-walk` の Google サンプルCDN）
- [x] 称号コレクション（`TitleService` / `constants/titles.ts` / `TitleCollectionCard`）→ ドパガキ度からの単純導出に置換
- [x] 旧 `DailyResult` / `dopamineScore` / `RaidStatusView` 等の型
- [x] `longPlayerHints`（視聴中の煽り文言）
- [x] README / CLAUDE.md の旧方針記述

## Phase 1: ローカルコア

- [x] 毎日22:00 JST固定レイド（`utils/jst.ts`、`RaidService`）
- [x] 22:00:00〜22:02:59 のみ開始可能（開始猶予180秒）
- [x] 通知タップ → 公式レイドへ直接遷移
- [x] 追い脱ドパ導線（22:03以降、同じ動画をロング扱いで視聴）
- [x] 5画面オンボーディング（問題提起→利用時間→損失→レイド説明＋ユーザーネーム→初回3分ロング）
- [x] ホーム再構成（次回レイド→累計脱ドパ時間→ドパガキ度→連続日数→今週履歴→広告）
- [x] 累計脱ドパ時間（実視聴時間、途中離脱分も加算、session_id で二重加算防止）
- [x] 連続脱ドパ日数（1日合計3分以上で継続）
- [x] 簡易ドパガキ度（初期値: 35/55/75/90、完走-3、離脱+1、未参加+1、ロング3分ごと-1で日次上限-3）
- [x] 「今日の1本」ロング（プリセット 3/10/30/60分）
- [x] レイド画面簡略化（映像・残り時間・中断のみ）

## Phase 2: Supabase最小連携

- [x] 匿名認証（`SupabaseService` / `ProfileService`）
- [x] 公開ユーザーネーム（自動生成3候補・再生成・自由入力・NFKC・NGワード）
- [x] `profiles` / `raid_participations` テーブル・RLS・SQL（`supabase/migrations/`）
- [x] オフラインキュー（開始/終了の未送信分を保存し後から再送）
- [x] 同行者名 最大3件（`get_raid_companions` RPC、失敗時は代替文言）
- [x] レイド1回あたり最大3通信（開始・終了・同行者取得）

## Phase 3: 動画基盤

- [x] 同梱映像レジストリ（`src/constants/bundledVideos.ts`、実ファイル差し替え手順）
- [x] bundled manifest（`assets/videos/manifest.json`）
- [x] remote → cached → bundled の3段フォールバック（`VideoDeliveryService`）
- [x] 事前ダウンロードとキャッシュ上限管理
- [x] Cloudflare Workers Static Assets 配置例（`cloudflare/`）

## Phase 4: 拡散・分析・課金準備

- [x] SNS共有画像基盤（`ShareCard` + view-shot、差し込み項目のみ、独自長文コピーなし）
- [x] 分析イベントキュー＋まとめ送信（`AnalyticsService`、`analytics_events` テーブル、SQL View）
- [x] FeatureGate（`ad_free` / `video_selection` / `video_archive` / `long_duration` / `premium_videos` / `heavy_mode`）
- [x] 広告モード（normal / hidden / heavy）
- [x] プレミアム・ヘビーモードの「今後提供予定」表示（購入ボタンなし）

## Phase 5: 整理・検証

- [x] 旧コード削除の最終確認（未使用 import / ファイルなし）
- [x] README.md 全面更新
- [x] ARCHITECTURE.md 作成
- [x] `npm run typecheck` パス
- [ ] 実機テスト: オフラインでの公式レイド完走
- [ ] 実機テスト: 通信復帰後のキュー再送
- [ ] 実機テスト: バックグラウンド遷移での離脱判定
- [ ] 実機テスト: 二重タップ・二重保存の防止
- [ ] 実機テスト: 通知タップからのレイド直行
- [ ] Supabase プロジェクトへのマイグレーション適用と同行者表示確認
- [ ] Cloudflare Workers Static Assets への実動画配置
- [ ] ストアビルド確認（EAS）
