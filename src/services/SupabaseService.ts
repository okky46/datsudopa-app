
// Supabaseは匿名認証・公開ユーザーネーム・公式レイド参加記録・同行者名取得・分析だけに使う。
// URL/キー未設定でもアプリは完全に動作する（ローカルファースト）。

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

let client: SupabaseClient | null = null;

export class SupabaseService {
  static isConfigured(): boolean {
    return SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
  }

  static getClient(): SupabaseClient | null {
    if (!SupabaseService.isConfigured()) {
      return null;
    }
    if (!client) {
      client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      });
    }
    return client;
  }

  /** 匿名サインイン（既存セッションがあれば再利用）。失敗時は null */
  static async ensureSignedIn(): Promise<string | null> {
    const supabase = SupabaseService.getClient();
    if (!supabase) {
      return null;
    }
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.user) {
        return sessionData.session.user.id;
      }
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) {
        return null;
      }
      return data.user?.id ?? null;
    } catch {
      return null;
    }
  }
}

/** 通信がぶら下がって画面を止めないための共通タイムアウト */
export async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_resolve, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ]);
}
