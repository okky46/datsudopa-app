// Webプレビュー用: ネイティブ専用モジュールをWebビルド時のみシムに差し替える。
// ネイティブ(iOS/Android/Expo Go)のビルドには影響しない(platform === 'web' のみ)。
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
const prev = config.resolver.resolveRequest;
const WEB_SHIMS = {
  'react-native-google-mobile-ads': path.join(__dirname, '.web-shims/no-ads.js'),
  'expo-notifications': path.join(__dirname, '.web-shims/expo-notifications.js'),
};
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && WEB_SHIMS[moduleName]) {
    return { type: 'sourceFile', filePath: WEB_SHIMS[moduleName] };
  }
  return prev ? prev(context, moduleName, platform) : context.resolveRequest(context, moduleName, platform);
};
module.exports = config;
