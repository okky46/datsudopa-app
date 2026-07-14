// テスト用のインメモリ AsyncStorage。各テストの beforeEach で __resetStore() を呼ぶ。

let store: Record<string, string> = {};

export function __resetStore(): void {
  store = {};
}

const AsyncStorage = {
  getItem: async (key: string): Promise<string | null> => (key in store ? store[key] : null),
  setItem: async (key: string, value: string): Promise<void> => {
    store[key] = value;
  },
  removeItem: async (key: string): Promise<void> => {
    delete store[key];
  },
  multiRemove: async (keys: string[]): Promise<void> => {
    for (const key of keys) {
      delete store[key];
    }
  },
};

export default AsyncStorage;
