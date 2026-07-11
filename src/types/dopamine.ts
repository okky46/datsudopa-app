
// アプリ全体で持続するドパガキ度（0〜100）の記録

export type DopamineSnapshot = {
  date: string; // YYYY-MM-DD
  level: number;
};

export type DopamineDeltas = {
  vsYesterday: number | null;
  vsLastWeek: number | null;
  vsLastMonth: number | null;
};

// ドパガキ度が動く操作の種類
export type DopaSpikeKind = 'scroll' | 'skip' | 'speed' | 'share';
