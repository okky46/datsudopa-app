
# 脱ドパ MVP

Expo + React Native + TypeScript で作る「脱ドパ」MVPです。毎日1回の通知から脱ドパレイドを開始し、静かな脱ドパロングを全画面で見て、完走/失敗リザルトを共有できます。

## 実装済み

- Expo Router の3タブ構成: ホーム / 脱ドパロング / メニュー
- 初回オンボーディング、レイド時刻、通知文言の強さ
- AsyncStorage 保存: onboardingCompleted, userSettings, dailyResults, currentRaidState, notificationPermission, premiumStatus placeholder, videoWatchHistory
- expo-notifications による毎日ローカル通知のスケジュール
- 通知後3分以内のレイド開始判定
- expo-video 対応の全画面再生Shellと、実動画なしでも動く生成placeholder
- AppState によるレイド中の background/inactive 失敗判定
- リザルト生成、ホーム/リザルト画面からOS標準共有
- AdMobバナー: ホーム下部、脱ドパロング通常視聴画面
- PremiumService placeholder と「課金するとさらに多くの広告が登場」ネタカード

## Expo Goで確認できる部分

AdMob以外の多くのUIとロジックはExpo標準の範囲で作っています。

- 3タブ画面
- オンボーディング
- ホーム表示
- 通常視聴/レイド再生のplaceholder UI
- AsyncStorage保存
- OS標準共有
- ローカル通知の許可取得とスケジュールの一部

ただし react-native-google-mobile-ads はExpo Goに含まれないネイティブモジュールです。AdMobバナーを含む画面を完全に確認するにはdevelopment buildが必要です。

## development buildが必要な部分

- react-native-google-mobile-ads のAdMobバナー表示
- iOS/Androidネイティブ広告SDKの初期化
- AdMob App ID を含むネイティブ設定の反映

## セットアップ

1. 依存関係を入れます。
   npm install

2. 開発サーバーを起動します。
   npm run start

3. development buildを使う場合は、先にネイティブプロジェクトを生成します。
   npx expo prebuild

4. Android development build例。
   npx expo run:android

5. iOS development build例。macOS環境で実行してください。
   npx expo run:ios

## ローカルでアプリを触る手順

まず依存関係をインストールします。

```sh
npm install
```

Windows環境で `UNABLE_TO_VERIFY_LEAF_SIGNATURE` が出る場合は、NodeにOSの証明書ストアを使わせてから再実行します。

```powershell
$env:NODE_OPTIONS="--use-system-ca"
npm install --legacy-peer-deps
```

開発サーバーは次で起動します。

```sh
npm run start
```

起動後に表示されるExpo DevTools/ターミナルの案内から、接続方法を選びます。

- Expo Goで確認する場合: iPhone/Android実機にExpo Goを入れ、同じWi-Fiに接続してQRコードを読み取ります。
- Androidエミュレーターで確認する場合: Android Studioでエミュレーターを起動してから、ターミナルで `a` を押すか `npm run android` を実行します。
- iOSシミュレーターで確認する場合: macOS + Xcode環境で、ターミナルで `i` を押すか `npm run ios` を実行します。
- 実機development buildで確認する場合: Expo Goではなく、下記のdevelopment buildを端末にインストールしてから `npm run start` で接続します。

Expo Goで確認できる範囲は、オンボーディング、3タブUI、ホーム、脱ドパロング、レイド/リザルト画面、AsyncStorage保存、OS標準共有、通知許可の一部です。AdMobの実バナー表示はExpo Goでは確認できません。Expo Goでは広告枠placeholderが表示されます。

AdMobを含めて確認する場合はdevelopment buildが必要です。Androidは次を実行します。

```sh
npx expo prebuild
npm run dev:android
```

iOSはmacOS + Xcode環境で次を実行します。

```sh
npx expo prebuild
npm run dev:ios
```

現時点では `.env` は必須ではありません。`app.config.js` がGoogle公式テスト用AdMob IDへfallbackします。本番IDや独自bundle/package名で確認したい場合だけ、必要に応じて以下を環境変数として設定してください。

```sh
EXPO_PUBLIC_ADMOB_ANDROID_APP_ID=ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy
EXPO_PUBLIC_ADMOB_IOS_APP_ID=ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy
EXPO_PUBLIC_ADMOB_BANNER_ANDROID=ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy
EXPO_PUBLIC_ADMOB_BANNER_IOS=ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy
EXPO_PUBLIC_ANDROID_PACKAGE=com.example.datsudopa
EXPO_PUBLIC_IOS_BUNDLE_ID=com.example.datsudopa
```

起動時にエラーが出た場合は、次を確認してください。

- Node/npmの証明書エラーが出る場合: `NODE_OPTIONS=--use-system-ca` を設定して再実行します。PowerShellでは `$env:NODE_OPTIONS="--use-system-ca"` です。
- AdMob関連のNative moduleエラーが出る場合: Expo Goではなくdevelopment buildで起動しているか確認します。
- 環境変数やAdMob App IDを変更した場合: `npx expo prebuild` とdevelopment buildを作り直します。
- Metroのキャッシュが怪しい場合: `npx expo start -c` でキャッシュを消して起動します。
- Androidエミュレーターが見つからない場合: Android Studioでエミュレーターを先に起動し、`adb devices` で認識を確認します。
- iOSシミュレーターが使えない場合: macOSとXcodeが必要です。WindowsではiOSシミュレーターは起動できません。
- 依存関係の解決が崩れた場合: `node_modules` と `package-lock.json` を作り直す前に、まず `npm install` と `npm run typecheck` の結果を確認します。

## AdMob設定

MVPでは開発中にGoogle公式テストIDを使います。本番IDに差し替える場合は、環境変数を設定してください。

- EXPO_PUBLIC_ADMOB_ANDROID_APP_ID: Android AdMob App ID
- EXPO_PUBLIC_ADMOB_IOS_APP_ID: iOS AdMob App ID
- EXPO_PUBLIC_ADMOB_BANNER_ANDROID: Android バナー広告ユニットID
- EXPO_PUBLIC_ADMOB_BANNER_IOS: iOS バナー広告ユニットID
- EXPO_PUBLIC_ANDROID_PACKAGE: Android package name
- EXPO_PUBLIC_IOS_BUNDLE_ID: iOS bundle identifier

app.config.js では未設定時にGoogle公式テストIDへfallbackします。AdMob App IDはネイティブ設定に入るため、値を変えたらdevelopment buildを作り直してください。

## iOS/Android確認手順

Android:

1. EXPO_PUBLIC_ANDROID_PACKAGE とAdMob IDを必要に応じて設定
2. npx expo prebuild
3. npx expo run:android
4. オンボーディングで通知許可を確認
5. ホーム下部とロング画面のAdMobバナーを確認
6. MVP確認用レイド開始ボタンから、完走/緊急離脱/バックグラウンド失敗を確認

iOS:

1. macOSで EXPO_PUBLIC_IOS_BUNDLE_ID とAdMob IDを必要に応じて設定
2. npx expo prebuild
3. npx expo run:ios
4. 通知許可、AdMobバナー、共有シート、AppState失敗判定を確認

## 動画管理方針

MVPではDBを使いません。src/constants/videos.ts の VideoAsset 定義で、local / remote / generated_placeholder / user_uploaded を扱える構造にしています。

実動画を同梱する場合は assets/videos に20〜60秒程度の短い動画を置き、VideoAssetの sourceType を local にします。1分〜30分の視聴時間は短い動画をループ再生する想定です。

将来はCloudflare R2、Supabase Storage、S3、CDNなどに動画本体を置き、DBにはURLとメタデータだけを保存します。動画本体をDBに保存しない方針です。

## EAS Buildに進むためのTODO

- eas init を実行してEXPO_PUBLIC_EAS_PROJECT_IDまたはapp configのprojectIdを設定
- iOS bundle identifier / Android package nameを本番用に確定
- AdMob本番App IDと広告ユニットIDを設定
- eas secret またはCI環境変数でAdMob IDを管理
- iOS/Androidの通知権限文言とプライバシー文言を確定
- ストア用アイコン、スプラッシュ、プライバシーポリシーURL、利用規約URLを追加
- 実動画を assets/videos またはCDNに配置

## 未実装placeholder

- RevenueCat / アプリ内課金の本実装
- Supabase連携
- インタースティシャル広告、リワード広告、共有後広告、リザルト後広告
- Screen Time API / UsageStatsManager
- ユーザー投稿動画、審査、通報、ランキング、完走者限定チャット
