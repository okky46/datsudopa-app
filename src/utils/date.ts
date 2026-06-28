
export function toDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}

export function formatDateForShare(dateKey: string): string {
  return dateKey.replace(/-/g, '.');
}

export function parseTimeToToday(time: string, baseDate = new Date()): Date {
  const [hourText, minuteText] = time.split(':');
  const date = new Date(baseDate);
  date.setHours(Number(hourText) || 0, Number(minuteText) || 0, 0, 0);
  return date;
}

export function formatClock(date: Date): string {
  return String(date.getHours()).padStart(2, '0') + ':' + String(date.getMinutes()).padStart(2, '0');
}

export function formatSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.max(0, totalSeconds % 60);
  return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
}

export function formatRemainingTo(targetDate: Date, now = new Date()): string {
  const diffSeconds = Math.ceil((targetDate.getTime() - now.getTime()) / 1000);
  if (diffSeconds <= 0) {
    return '開始時刻を過ぎています';
  }
  const hours = Math.floor(diffSeconds / 3600);
  const minutes = Math.floor((diffSeconds % 3600) / 60);
  if (hours > 0) {
    return 'あと' + hours + '時間' + minutes + '分';
  }
  return 'あと' + Math.max(1, minutes) + '分';
}
