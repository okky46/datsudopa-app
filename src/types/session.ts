
// すべての視聴（公式レイド / 通常ロング / 追い脱ドパ / 初回ロング）は
// 一意な sessionId を持つ WatchSession として記録する。
// 累計脱ドパ時間・ドパガキ度への反映は finalize 時に1回だけ行い、二重加算を防ぐ。

export type SessionKind = 'raid' | 'long';

/** longセッションの由来。追い脱ドパ・初回体験は分析で区別する */
export type LongSource = 'daily' | 'catchup' | 'first_long';

export type SessionStatus = 'active' | 'completed' | 'exited';

export type ExitReason = 'user_exit' | 'backgrounded' | 'playback_error';

export type WatchSession = {
  sessionId: string;
  kind: SessionKind;
  /** kind === 'long' のときのみ */
  longSource?: LongSource;
  /** kind === 'raid' のときのみ（例: 2026-07-13_22JST） */
  raidId?: string;
  /** JST基準の日付キー */
  dateKey: string;
  videoId: string;
  startedAt: string;
  endedAt?: string;
  targetSeconds: number;
  watchedSeconds: number;
  status: SessionStatus;
  exitReason?: ExitReason;
  /** サーバー公式参加へ同期できなかったローカル限定セッションの識別 */
  serverSyncStatus?: 'synced' | 'unsynced';
  /** 確定後の進捗効果をローカルoutboxとして復旧可能にする状態 */
  progressEffectStatus?: 'pending' | 'applied';
  /** raid finishキュー登録をローカルoutboxとして復旧可能にする状態 */
  raidFinishSyncStatus?: 'pending' | 'queued';
};

/** セッション確定時にリザルト画面へ渡す集計 */
export type SessionSummary = {
  session: WatchSession;
  totalDetoxSeconds: number;
  dopagakiLevel: number;
  dopagakiDelta: number;
  streakDays: number;
};

/** 今週の履歴の1日ぶんの状態 */
export type DayHistoryStatus = 'raid_completed' | 'raid_exited' | 'long_only' | 'none';

export type DayHistory = {
  dateKey: string;
  status: DayHistoryStatus;
  isToday: boolean;
  isFuture: boolean;
};
