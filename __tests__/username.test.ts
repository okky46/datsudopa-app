import { generateNameCandidates, validatePublicName, NAME_MAX_LENGTH } from '../src/utils/username';

describe('公開ユーザーネーム検査', () => {
  test('通常の名前は許可', () => {
    expect(validatePublicName('夜更かしペンギン').ok).toBe(true);
  });
  test('短すぎ・長すぎは拒否', () => {
    expect(validatePublicName('a').ok).toBe(false);
    expect(validatePublicName('あ'.repeat(NAME_MAX_LENGTH + 1)).ok).toBe(false);
  });
  test('改行・URLは拒否', () => {
    expect(validatePublicName('名前\nに改行').ok).toBe(false);
    expect(validatePublicName('見て www.example.com').ok).toBe(false);
  });
  test('記号の過度な連続は拒否', () => {
    expect(validatePublicName('!!!!名前').ok).toBe(false);
  });
  test('日本語NGワードは拒否', () => {
    expect(validatePublicName('うんこマン').ok).toBe(false);
  });
  test('英語profanityは拒否', () => {
    expect(validatePublicName('fuck yeah').ok).toBe(false);
  });
  test('NFKC正規化される', () => {
    const r = validatePublicName('ＡＢＣペンギン');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.normalized).toBe('ABCペンギン');
    }
  });
  test('ゼロ幅文字は除去される', () => {
    const r = validatePublicName('ペン​ギン');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.normalized).toBe('ペンギン');
    }
  });
});

describe('自動生成候補', () => {
  test('3件生成され、いずれも検査を通る', () => {
    const candidates = generateNameCandidates(3);
    expect(candidates).toHaveLength(3);
    for (const candidate of candidates) {
      expect(validatePublicName(candidate).ok).toBe(true);
    }
  });
});
