
export function getTimeBasedGreeting(now = new Date()): string {
  const hour = now.getHours();

  if (hour >= 5 && hour < 11) {
    return 'おはよう、今日も静かにいこう';
  }
  if (hour >= 11 && hour < 17) {
    return 'こんにちは、脳を休ませよう';
  }
  if (hour >= 17 && hour < 22) {
    return 'こんばんは、今日の残りを静かに';
  }
  return '夜更かし前に、一度深呼吸';
}
