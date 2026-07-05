# CLAUDE.md — 脱ドパ UIガイド

Expo + React Native + TypeScript(expo-router)のMVP。このファイルはUI修正時に「AIっぽくない・洗練された・親しみやすい脱ドパらしさ」を維持するための基準。

`.claude/skills/frontend-design`(Claude公式スキル)は新規デザイン検討時の一般的な視点出し・自己批評プロセスとして参考にする。ただし本アプリの色・余白・角丸・影・タイポグラフィは必ず本ファイルと `src/constants/theme.ts` のトークンを優先する。スキルの提案がこのガイドと矛盾する場合(新しい配色を作る、トークン外の値を使う等)は本ファイルを優先する。

## プロダクトコンセプト

- 「ショートの真逆を、みんなでやる」。毎日1回の通知(レイド)から低刺激のロング映像を全員で見て、スクロール脳をクールダウンするアプリ。
- トーンは「静かなウェルネスアプリ × 少しふざけた世界観」。UIは清潔で柔らかく、コピーは「ドパガキ」「虚無」など脱力系のユーモアを混ぜる。
- 説教くさくしない。健康アプリの真面目さと、ネタ(PremiumJokeCard、称号など)の同居がアイデンティティ。

## UIデザイン原則

1. 静かで軽い高級感。派手な装飾より余白と階層で見せる。
2. 光る演出(虹・グラデーション)は「ここぞ」に限定: スコアバー、再生ボタン、完走セレブレーション(ScreenFrame)、AuroraDot程度。
3. アイコンは絵文字やアイコンフォントではなく、View で手描きした小さなグリフ(BellIcon, ClockGlyph, LockGlyph 等)。この手作り感を維持する。
4. コピーは `src/constants/copy.ts` に集約。画面に説明文を増やさず、世界観の一文で語る。
5. 新しい色・数値をハードコードしない。必ず `src/constants/theme.ts` のトークンを使う。

## 色・余白・角丸・影・タイポグラフィ

すべて `src/constants/theme.ts` が唯一の情報源。方針:

- **色**: 暖かいオフホワイト背景(#F6F4EF)+濃いネイビー文字(#2E3450)+淡いパステル(ミント/ラベンダー/ピンク/ブルー/イエロー)のアクセント。primary はネイビー(#3B4263)、達成系はセージグリーン(#5F8A6E)。彩度の高い原色・純黒・純白背景は使わない。
- **余白**: `spacing`(6/10/16/22/32/44)。画面の左右パディングは `spacing.lg`、カード内は `spacing.lg`、要素間は gap で統一。
- **角丸**: `radius`(12/18/24/30/pill)。カードは lg〜xl、ボタンは pill。中途半端な値を足さない。
- **影**: `shadows.soft` と `shadows.hero` の2種のみ。opacity 0.06〜0.09 の柔らかい影。強い drop shadow は禁止。
- **タイポグラフィ**: `typography` を使う。見出しは fontWeight 700–800 + 負の letterSpacing、スコアは超大型(74–76px)。英字ラベル(englishLabel)は使用箇所を絞る方針。
- **グラデーション**: `rainbowSoft` / `gradientBar` / `gradientPlay` / `gradientWash` の定義済みセットだけを `SoftGradient` / `PastelWash` 経由で使う。

## 画面別ルール

### ホーム `app/(tabs)/index.tsx`
- 構成順: ブランド行(脱ドパ + AuroraDot + ベル) → HomeHeroCard → キャッチコピー1行 → HistoryList → AdBanner。
- HomeHeroCard が主役: PastelWash 背景、「ドパガキ度」巨大スコア、gradientBar のスコアバー、レイド時刻表示、参加ボタン。ここ以外に目立つ要素を足さない。
- レイド開始可否のロジック(canStart / __DEV__ 用ボタン / missed 記録)は表示文言含め壊さない。

### ロング `app/(tabs)/long.tsx`
- 上部固定の setupPanel(タイトル → ヒーローVideoCard → 今日の映像 → 視聴時間 + DurationSlider → プリセットChip → gradient「再生する」ボタン → 「スキップ不可」ロック表示)+ 下部スクロール(他の映像 / 説明 / AdBanner)の2層構造。
- heroHeight は画面高から計算して1画面に収める設計。要素追加でこのバランスを崩さない。
- 「再生する」は variant="gradient" のパステルグラデーション。ここが画面唯一の華。

### リザルト `app/raid/result.tsx`
- 縦一列・中央揃え: タイトル✨ → ResultCard → コメント1行 → ShareButton → ゴーストの「履歴を見る」。
- 完走時は `triggerCelebration`(ScreenFrame の虹縁演出、約7秒)が発火する。この演出は最重要のご褒美なので削らない・多用もしない。
- 称号・コメントは `copy.ts` の titles / comments から。真面目な達成メッセージに置き換えない。

### メニュー `app/(tabs)/menu.tsx`
- タイトルは「集合設定」。Card 単位のセクション: プロフィール(ニックネーム + 光る縁の色スワッチ) → 集合の合図(通知Switch + 時間帯Chip) → その他 → PremiumJokeCard。
- 設定変更は即 `StorageService.saveSettings` + `NotificationService.scheduleDailyRaid` を呼ぶ流れを維持。
- PremiumJokeCard(「課金するとさらに多くの広告が登場」)はネタとして残す。

## 避けるべきAIっぽいUI

- 紫→青のビビッドグラデーション、ネオン、グラスモーフィズム、ダークモード風の濃紺カード。
- 絵文字アイコンの多用(✨はコピー内の限定使用のみ)、アイコンライブラリの安易な導入。
- 「〜しましょう!」調の説明文、機能説明のためのサブテキスト増殖、ラベルの英語化。
- カードの中にカードを重ねる過剰なネスト、境界線の濃いカード、影の強いカード。
- 均等グリッドに機能を並べただけのダッシュボード化。ホームの主役は常に HomeHeroCard 1枚。
- 汎用UIキット(Paper, NativeBase等)のデフォルト見た目の持ち込み。

## 守るべき既存機能

- レイドフロー: 通知 → 3分以内の開始判定 → `raid/active` 全画面再生 → AppState による background/inactive 失敗判定 → リザルト生成・保存 → 共有。
- AsyncStorage キー(onboardingCompleted, userSettings, dailyResults, currentRaidState, videoWatchHistory 等)と `StorageService` 経由のアクセス。
- `NotificationService.scheduleDailyRaid` の再スケジュール(ホームフォーカス時・設定変更時)。
- AdBanner の配置(ホーム下部・ロング下部)と Expo Go での placeholder フォールバック。
- ScreenFrame(光る縁 + セレブレーション)と frameColorId のユーザー設定。
- オンボーディング完了前のリダイレクト、リザルトの OS標準共有。
- __DEV__ 限定の「レイド開始(確認用)」ボタン。

## 実装時の注意

- StyleSheet.create + theme トークンで書く。inline の色コード・マジックナンバー禁止。
- 新規UI部品はまず `src/components/ui/`(Card, Chip, SoftGradient, PastelWash, Decorations...)の再利用を検討。無ければ同じ流儀で追加。
- 新しい依存ライブラリを増やさない(特にアイコン・UIキット・アニメーション)。アニメーションは既存の react-native-reanimated の範囲で。
- Expo Go で動く範囲を壊さない(ネイティブ専用APIは AdsService のようにフォールバックを用意)。
- コピー変更・追加は `src/constants/copy.ts` に置き、世界観のトーン(脱力 + 静けさ)を合わせる。
- 変更後は `npm run typecheck` を通す。

## UI修正前チェックリスト

修正に着手する前に必ず確認:

1. [ ] `src/constants/theme.ts` を読み、使うトークン(色/spacing/radius/影/typography)を決めたか
2. [ ] 対象画面のファイルと、使われている `src/components/` 部品を読んだか
3. [ ] 文言を触るなら `src/constants/copy.ts` を確認し、トーンを合わせたか
4. [ ] その変更は「避けるべきAIっぽいUI」に該当しないか
5. [ ] 光る演出を追加するなら、既存の限定箇所(スコアバー/再生ボタン/セレブレーション)の原則に反しないか
6. [ ] 「守るべき既存機能」(レイド判定・保存・通知・広告・共有)のロジックに触れていないか
7. [ ] Expo Go で動作が変わらないか(ネイティブ依存を増やしていないか)
8. [ ] `npm run typecheck` が通るか
