# CLAUDE.md — 脱ドパ UIガイド

Expo + React Native + TypeScript(expo-router)のMVP。このファイルはUI修正時に「AIっぽくない・洗練された・親しみやすい脱ドパらしさ」を維持するための基準。

## プロダクトコンセプト

- 「ショートの真逆を、みんなでやる」。毎日1回の通知(レイド)から低刺激のロング映像を全員で見て、スクロール脳をクールダウンするアプリ。
- トーンは「静かなウェルネスアプリ × 少しふざけた世界観」。UIは清潔で柔らかく、コピーは「ドパガキ」「虚無」など脱力系のユーモアを混ぜる。
- 説教くさくしない。健康アプリの真面目さと、ネタ(PremiumJokeCard、称号など)の同居がアイデンティティ。

## UIデザイン原則

1. 静かで軽い高級感。派手な装飾より余白と階層で見せる。
2. 光る演出(グラデーション)は「ここぞ」に限定: スコアバー、再生ボタン、AuroraDot程度。画面縁の光る枠・虹色セレブレーションは廃止済み。
3. アイコンは絵文字やアイコンフォントではなく、View で手描きした小さなグリフ(BellIcon, ClockGlyph, LockGlyph 等)。この手作り感を維持する。
4. コピーは `src/constants/copy.ts` に集約。画面に説明文を増やさず、世界観の一文で語る。
5. 新しい色・数値をハードコードしない。必ず `src/constants/theme.ts` のトークンを使う。

## 色・余白・角丸・影・タイポグラフィ

すべて `src/constants/theme.ts` が唯一の情報源。1b「上質・ダーク」の方針:

- **色**: 深いインク背景(#14161B)+クリーム文字(#ECE7DD)+シャンパンゴールド(#C9A96A)のアクセント。primary はゴールド、達成系はセージグリーン(#9FB79C)、警告寄りはダスティローズ(#CE9A8E)。カード/サーフェスは白の極薄半透明(`colors.card` = rgba(255,255,255,0.03) 等)で、インクの上にうっすら浮かせる。モーダルなど不透明が必要な箇所だけ `colors.cardOpaque` を使う。純黒・原色のネオンは使わない。
- **余白**: `spacing`(6/10/16/22/32/44)。画面の左右パディングは `spacing.lg`、カード内は `spacing.lg`、要素間は gap で統一。
- **角丸**: `radius`(12/18/24/30/pill)。カードは lg〜xl、ボタンは pill。中途半端な値を足さない。
- **影**: `shadows.soft` と `shadows.hero` の2種のみ。黒の柔らかい影のみ(インク背景では白影は使わない)。
- **タイポグラフィ**: 丸ゴシック `Zen Maru Gothic`(`@expo-google-fonts/zen-maru-gothic`)。`typography` の各プリセットに `fontFamily` を含む。独自の Text スタイルを書くときは `zenMaru(weight)` または `fontFamily.{regular|medium|bold|black}` を fontWeight とセットで指定すること(fontWeight だけでは反映されない)。見出しは fontWeight 700–900 + 負の letterSpacing、スコアは超大型(74px)+ ゴールドの text-shadow で軽く光らせる。英字ラベル(englishLabel)は使用箇所を絞る方針。
- **グラデーション**: `gradientBar`(スコアバー)/ `gradientPlay`(CTAボタン、ゴールド)/ `gradientWash`(主役カードの淡いウォッシュ)を `SoftGradient` 経由で使う。`rainbowSoft` はセレブレーション演出のみ。
- **一点物のアルファ値**: ホーム画面など特定カードだけの微妙なボーダー/影の透明度(例: `rgba(201, 169, 106, 0.22)`)は、トークン化するより読みやすければ現場でリテラルのまま書いてよい。ただし色相そのもの(ゴールド/セージ/ローズ等の基準色)は必ずトークン由来にする。

## 画面別ルール

### ホーム `app/(tabs)/index.tsx`
- 構成順: ブランド行(脱ドパ + プロフィール丸) → DopaHeroCard(スコアのみ) → RaidCard(今日のレイド) → SharePill(ドパるけど共有する) → WeeklyBalanceCard → RecordCard → AdBanner。
- DopaHeroCard は「ドパガキ度」巨大スコア + gradientWash 背景 + gradientBar のスコアバー + 昨日/先週/先月の増減 + 称号カプセルのみ。レイド参加ボタンや共有ボタンはここに入れず、RaidCard / SharePill という別要素にする(1b デザインでの分離)。
- レイド開始可否のロジック(canStart / __DEV__ 用ボタン / missed 記録)は表示文言含め壊さない。

### ロング `app/(tabs)/long.tsx`
- 上部固定の setupPanel(タイトル → ヒーローVideoCard → 今日の映像 → 視聴時間 + DurationSlider → プリセットChip → gradient「再生する」ボタン → 「スキップ不可」ロック表示)+ 下部スクロール(他の映像 / 説明 / AdBanner)の2層構造。
- heroHeight は画面高から計算して1画面に収める設計。要素追加でこのバランスを崩さない。
- 「再生する」は variant="gradient" のパステルグラデーション。ここが画面唯一の華。

### リザルト `app/raid/result.tsx`
- 縦一列・中央揃え: タイトル✨ → ResultCard → コメント1行 → ShareButton → ゴーストの「履歴を見る」。
- 称号・コメントは `copy.ts` の titles / comments から。真面目な達成メッセージに置き換えない。

### メニュー `app/(tabs)/menu.tsx`
- タイトルは「設定」。Card 単位のセクション: ユーザープロフィール(アイコン色 + ニックネーム、右上ペンで編集) → 通知設定(通知Switch + 時間帯Chip 1つ + 「脱ドパタイム○時～○時」) → PremiumJokeCard → オンボーディングやり直し / 使い方を見る / データ削除 → AdBanner。
- 設定変更は即 `StorageService.saveSettings` + `NotificationService.scheduleDailyRaid` を呼ぶ流れを維持。
- PremiumJokeCard(「脱ドパ　プレミアム」/ 広告増量ハードモードのネタ)は残す。
- 「集合の合図」「集合予定」など集合系の文言は使わない。

## 避けるべきAIっぽいUI

- 紫→青のビビッドグラデーション、ネオン、あからさまなグラスモーフィズム(強いぼかし+虹色反射)。
- ゴールド以外の彩度の高いアクセントカラーを増やすこと。基調は常にインク×ゴールド×クリームの3色構成に留める。
- 絵文字アイコンの多用(✨はコピー内の限定使用のみ)、アイコンライブラリの安易な導入。
- 「〜しましょう!」調の説明文、機能説明のためのサブテキスト増殖、ラベルの英語化。
- カードの中にカードを重ねる過剰なネスト、境界線の濃いカード、影の強いカード。
- 均等グリッドに機能を並べただけのダッシュボード化。ホームの主役は常に HomeHeroCard 1枚。
- 汎用UIキット(Paper, NativeBase等)のデフォルト見た目の持ち込み。

## 守るべき既存機能

- レイドフロー: 通知 → 3分以内の開始判定 → `raid/active` 全画面再生 → AppState による background/inactive 失敗判定 → リザルト生成・保存 → 共有。
- AsyncStorage キー(onboardingCompleted, userSettings, dailyResults, currentRaidState, videoWatchHistory 等)と `StorageService` 経由のアクセス。
- `NotificationService.scheduleDailyRaid` の再スケジュール(ホームフォーカス時・設定変更時)。
- AdBanner の配置(ホーム下部・ロング下部・メニュー下部)と Expo Go での placeholder フォールバック。
- オンボーディング完了前のリダイレクト、リザルトの OS標準共有。
- __DEV__ 限定の「レイド開始(確認用)」ボタン。

## 実装時の注意

- StyleSheet.create + theme トークンで書く。inline の色コード・マジックナンバー禁止。
- 新規UI部品はまず `src/components/ui/`(Card, Chip, SoftGradient, PastelWash, Decorations...)の再利用を検討。無ければ同じ流儀で追加。
- 新しい依存ライブラリを増やさない(特にアイコン・UIキット・アニメーション)。アニメーションは既存の react-native-reanimated の範囲で。フォントは例外的に `expo-font` + `@expo-google-fonts/zen-maru-gothic` を導入済み(1b デザインの丸ゴシック指定のため)。`app/_layout.tsx` の `useFonts` で読み込み、フォント読み込み完了までは何も描画しない。
- Expo Go で動く範囲を壊さない(ネイティブ専用APIは AdsService のようにフォールバックを用意)。
- コピー変更・追加は `src/constants/copy.ts` に置き、世界観のトーン(脱力 + 静けさ)を合わせる。
- 変更後は `npm run typecheck` を通す。

### 依存関係(npm)のバージョン揃え

Expo SDK が指定する React / React Native 系の版を崩さない。`npm install` の ERESOLVE や peer 食い違いを防ぐため:

- `react` / `react-dom` / `react-native` は Expo SDK の推奨版に**正確にピン**する(例: SDK 56 → `react`/`react-dom` ともに `19.2.3`)。片方だけ上げない。
- Expo 関連パッケージの追加・更新は `npm install <pkg>` ではなく `npx expo install <pkg>` を使う(SDK 互換版が選ばれる)。
- `expo-router` 等が peer で要求する `react-dom` は、transitive 任せにせず `package.json` の dependencies に SDK 推奨版を明示する。
- `react` だけ固定して `react-dom` が最新パッチに浮くと、`react-dom` 側の peer(`react@^x.y.z`)と衝突して `ERESOLVE` になる。ロックファイル上でも両者が同版であることを確認する。
- `--force` / `--legacy-peer-deps` で握りつぶさない。まずピン揃えで直す。

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
9. [ ] 依存を触るなら `react`/`react-dom` が SDK 推奨版で揃い、`npx expo install` 経由か
