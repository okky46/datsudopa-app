
export function getTimeBasedGreeting(now = new Date()): string {
  const hour = now.getHours();

  if (hour >= 5 && hour < 11) {
    return 'おはよう。';
  }
  if (hour >= 11 && hour < 17) {
    return 'ひとやすみ。';
  }
  if (hour >= 17 && hour < 22) {
    return 'こんばんは。';
  }
  return '夜更かし中。';
}
