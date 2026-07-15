// テスト用の @supabase/supabase-js。テストでは SupabaseService.isConfigured() が
// false（環境変数未設定）になるため createClient は実際には呼ばれないが、import 解決のために用意する。

export function createClient(): unknown {
  return {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      signInAnonymously: async () => ({ data: { user: null }, error: null }),
      signOut: async () => ({ error: null }),
    },
    from: () => ({
      upsert: async () => ({ error: null }),
      insert: async () => ({ error: null }),
    }),
    rpc: async () => ({ data: [], error: null }),
  };
}

export type SupabaseClient = ReturnType<typeof createClient>;
