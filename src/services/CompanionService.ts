
// レイド後の「今日一緒だった人」。同じraid_idに公式時間内に参加した
// 自分以外の実在ユーザー名を最大3件だけ、専用のDB関数から取得する。
// 取得できない場合は空配列（画面側で代替文言を出す。架空名は絶対に出さない）。

import { SupabaseService, withTimeout } from './SupabaseService';

const FETCH_TIMEOUT_MS = 6000;
export const COMPANION_LIMIT = 3;

export class CompanionService {
  static async getCompanions(raidId: string): Promise<string[]> {
    if (!SupabaseService.isConfigured()) {
      return [];
    }
    try {
      const userId = await SupabaseService.ensureSignedIn();
      const supabase = SupabaseService.getClient();
      if (!userId || !supabase) {
        return [];
      }
      const { data, error } = await withTimeout(
        Promise.resolve(supabase.rpc('get_raid_companions', { p_raid_id: raidId })),
        FETCH_TIMEOUT_MS,
      );
      if (error || !Array.isArray(data)) {
        return [];
      }
      return (data as Array<{ public_name_snapshot?: string }>)
        .map((row) => row.public_name_snapshot ?? '')
        .filter((name) => name.length > 0)
        .slice(0, COMPANION_LIMIT);
    } catch {
      return [];
    }
  }
}
