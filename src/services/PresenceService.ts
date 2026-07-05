
import {
  PRESENCE_DOT_HUES,
  PRESENCE_MAX_COMPANIONS,
  PRESENCE_MIN_COMPANIONS,
  PRESENCE_POSITION_POOL,
} from '../constants/presence';
import { PresenceCompanion, PresenceStats } from '../types/presence';

// サーバーもDBも持たない「気配」の疑似生成器。
// 日付や時間帯から決まるシードを使い、同じ枠内ではある程度一貫した人数感を出す。

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomInt(random: () => number, min: number, max: number): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

export class PresenceService {
  /** 日付や合言葉からその回だけの疑似乱数を作る（DB不要・端末内完結） */
  static createRandom(seedKey: string): () => number {
    return mulberry32(hashString(seedKey));
  }

  static pickHue(random: () => number = Math.random): string {
    return PRESENCE_DOT_HUES[randomInt(random, 0, PRESENCE_DOT_HUES.length - 1)];
  }

  /** 一つの気配（点）をランダムな余白位置に生成する */
  static createCompanion(random: () => number = Math.random, usedPositions: Set<number> = new Set()): PresenceCompanion {
    let index = randomInt(random, 0, PRESENCE_POSITION_POOL.length - 1);
    if (usedPositions.size < PRESENCE_POSITION_POOL.length) {
      let attempts = 0;
      while (usedPositions.has(index) && attempts < PRESENCE_POSITION_POOL.length) {
        index = (index + 1) % PRESENCE_POSITION_POOL.length;
        attempts += 1;
      }
    }
    usedPositions.add(index);
    const position = PRESENCE_POSITION_POOL[index];
    const jitterX = (random() - 0.5) * 3;
    const jitterY = (random() - 0.5) * 3;
    return {
      id: `${Date.now()}-${Math.floor(random() * 1e6)}`,
      x: Math.min(97, Math.max(3, position.x + jitterX)),
      y: Math.min(94, Math.max(6, position.y + jitterY)),
      size: 6 + Math.round(random() * 5),
      hue: PresenceService.pickHue(random),
      phase: random(),
    };
  }

  /** 視聴開始時点で「すでにそこにいた」人たちの初期セット */
  static createInitialCompanions(seedKey: string): PresenceCompanion[] {
    const random = PresenceService.createRandom(seedKey);
    const count = randomInt(random, PRESENCE_MIN_COMPANIONS, PRESENCE_MAX_COMPANIONS);
    const used = new Set<number>();
    return Array.from({ length: count }, () => PresenceService.createCompanion(random, used));
  }

  /** レイドカードなどに出す、その枠のざっくりした人数感（DB不要・日付+時刻でシード固定） */
  static getRaidStats(dateKey: string, raidTime: string): PresenceStats {
    const random = PresenceService.createRandom(`raid-stats-${dateKey}-${raidTime}`);
    const active = randomInt(random, 6, 34);
    const completed = randomInt(random, 3, active + 12);
    const escaped = randomInt(random, 0, Math.max(1, Math.round(completed * 0.4)));
    return { active, completed, escaped };
  }

  /** リザルト画面で見せる、その枠を一緒に耐えた想定人数 */
  static getCompanionCountForResult(dateKey: string, raidTime: string): number {
    const stats = PresenceService.getRaidStats(dateKey, raidTime);
    return stats.completed;
  }
}
