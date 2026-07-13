
// 公開ユーザーネームの生成・正規化・検査。
// サーバー側（Supabaseのトリガー/制約）でも同等の検査を行う前提で、クライアント側の一次検査を担う。

import leoProfanity from 'leo-profanity';
import { JA_NG_WORDS, NAME_ANIMALS, NAME_PREFIXES } from '../constants/usernames';
import { nameErrorCopy } from '../constants/copy';

export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 16;

const ZERO_WIDTH_PATTERN = /[\u200B-\u200D\u2060\uFEFF]/g;
const CONTROL_PATTERN = /[\u0000-\u001F\u007F]/;
const URL_PATTERN = /(https?:\/\/|www\.|[a-z0-9-]+\.(com|net|org|jp|io|me|tv|xyz))/i;
/** 記号（文字・数字以外）が3つ以上連続したら過度な装飾とみなす */
const SYMBOL_RUN_PATTERN = /[^\p{L}\p{N}\s]{3,}/u;

export type NameValidation =
  | { ok: true; normalized: string }
  | { ok: false; reason: string };

/** NFKC正規化・ゼロ幅文字除去・前後空白除去 */
export function normalizePublicName(input: string): string {
  return input.normalize('NFKC').replace(ZERO_WIDTH_PATTERN, '').trim();
}

export function validatePublicName(input: string): NameValidation {
  if (/[\r\n]/.test(input)) {
    return { ok: false, reason: nameErrorCopy.invalid };
  }

  const normalized = normalizePublicName(input);
  const length = [...normalized].length;

  if (length < NAME_MIN_LENGTH) {
    return { ok: false, reason: nameErrorCopy.tooShort };
  }
  if (length > NAME_MAX_LENGTH) {
    return { ok: false, reason: nameErrorCopy.tooLong };
  }
  if (CONTROL_PATTERN.test(normalized)) {
    return { ok: false, reason: nameErrorCopy.invalid };
  }
  if (URL_PATTERN.test(normalized)) {
    return { ok: false, reason: nameErrorCopy.invalid };
  }
  if (SYMBOL_RUN_PATTERN.test(normalized)) {
    return { ok: false, reason: nameErrorCopy.invalid };
  }
  if (leoProfanity.check(normalized)) {
    return { ok: false, reason: nameErrorCopy.invalid };
  }
  const lowered = normalized.toLowerCase();
  if (JA_NG_WORDS.some((word) => lowered.includes(word.toLowerCase()))) {
    return { ok: false, reason: nameErrorCopy.invalid };
  }

  return { ok: true, normalized };
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** 「夜更かしペンギン」形式の候補を1つ生成（16文字以内が保証されるまで引き直す） */
export function generateNameCandidate(): string {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const name = `${pick(NAME_PREFIXES)}${pick(NAME_ANIMALS)}`;
    if ([...name].length <= NAME_MAX_LENGTH) {
      return name;
    }
  }
  return `${NAME_PREFIXES[0]}${NAME_ANIMALS[0]}`;
}

/** 重複しない候補を count 件生成 */
export function generateNameCandidates(count = 3): string[] {
  const candidates = new Set<string>();
  let guard = 0;
  while (candidates.size < count && guard < 60) {
    candidates.add(generateNameCandidate());
    guard += 1;
  }
  return [...candidates];
}
