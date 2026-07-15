// テスト用の expo-crypto。randomUUID は決定的な連番UUIDを返す。

let counter = 0;

export function randomUUID(): string {
  counter += 1;
  const hex = counter.toString(16).padStart(12, '0');
  return `00000000-0000-4000-8000-${hex}`;
}
