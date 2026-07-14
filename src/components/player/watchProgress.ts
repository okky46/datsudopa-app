export function clampWatchedSeconds(value: number, targetSeconds: number): number {
  const safeTarget = Number.isFinite(targetSeconds) ? Math.max(0, Math.round(targetSeconds)) : 0;
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(safeTarget, Math.round(value)));
}

export function nextWatchedSecondsFromRemaining(currentRemainingSeconds: number, targetSeconds: number): number {
  return clampWatchedSeconds(targetSeconds - Math.max(0, currentRemainingSeconds - 1), targetSeconds);
}
