
export function formatDateForShare(dateKey: string): string {
  return dateKey.replace(/-/g, '.');
}

/** mm:ss */
export function formatSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.max(0, totalSeconds % 60);
  return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
}

/** 「2時間18分」「18分」「45秒」 */
export function formatDurationJa(totalSeconds: number): string {
  if (totalSeconds < 60) {
    return `${Math.max(0, Math.round(totalSeconds))}秒`;
  }
  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return minutes > 0 ? `${hours}時間${minutes}分` : `${hours}時間`;
  }
  return `${minutes}分`;
}

/** 「あと3時間12分」「あと45秒」 */
export function formatRemainingTo(targetDate: Date, now = new Date()): string {
  const diffSeconds = Math.ceil((targetDate.getTime() - now.getTime()) / 1000);
  if (diffSeconds <= 0) {
    return 'まもなく';
  }
  if (diffSeconds < 60) {
    return `あと${diffSeconds}秒`;
  }
  const hours = Math.floor(diffSeconds / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);
  if (hours > 0) {
    return `あと${hours}時間${minutes}分`;
  }
  return `あと${Math.max(1, minutes)}分`;
}
