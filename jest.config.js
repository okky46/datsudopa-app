// 純粋ロジックの単体テスト用の軽量な jest 設定。
// RN/Expo/Supabase のネイティブ依存はテスト用モックへ差し替え、node 環境で高速に回す。

/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@react-native-async-storage/async-storage$': '<rootDir>/__tests__/mocks/asyncStorage.ts',
    '^expo-crypto$': '<rootDir>/__tests__/mocks/expoCrypto.ts',
    '^expo-file-system/legacy$': '<rootDir>/__tests__/mocks/empty.ts',
    '^react-native-url-polyfill/auto$': '<rootDir>/__tests__/mocks/empty.ts',
    '^@supabase/supabase-js$': '<rootDir>/__tests__/mocks/supabaseJs.ts',
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      { tsconfig: { module: 'commonjs', esModuleInterop: true, skipLibCheck: true, types: ['jest', 'node'] } },
    ],
  },
  clearMocks: true,
};
