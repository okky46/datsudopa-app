
// 累計脱ドパ時間・ドパガキ度・日次ロング判定・未参加処理・初回利用日を、
// 相互整合が必要な「単一のローカル進捗状態」としてまとめる。
// finalize は ProgressService.applySessionEffects の1回のread-modify-writeで反映し、
// appliedSessionIds によって二重反映を防ぐ（途中失敗時は起動時に復旧）。

export type ProgressState = {
  totalDetoxSeconds: number;
  /** null はオンボーディング未完了（初期化前） */
  dopagakiLevel: number | null;
  /** 日付キー → その日の通常ロング累計視聴秒数（日次stepの分母） */
  longSecondsByDate: Record<string, number>;
  /** 日付キー → その日の通常ロングで適用済みのstep数（0〜cap） */
  longReductionByDate: Record<string, number>;
  /** 未参加ペナルティを処理済みの日付キー */
  missedProcessedDates: string[];
  firstUseDateKey: string | null;
  /** 未参加判定を開始してよい最初の公式レイド日（初回22:03以降なら翌日） */
  firstEligibleRaidDateKey: string | null;
  /** 効果を累計・ドパガキ度へ反映済みのセッションID（二重反映防止） */
  appliedSessionIds: string[];
};
