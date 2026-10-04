import { describe, it, expect } from 'vitest';
import { unlockedDays, unlockedIds, pickRound, recordPractice, strength, weight, choicesFor, ROUND_SIZE } from '../src/lib/practice.js';
import { completeStep, STEPS, DAYS } from '../src/lib/program.js';
import { cards } from '../src/content/index.js';
import { freshState } from '../src/lib/store.js';

const T = '2026-10-05';
const finishDay = (st, n) => STEPS.forEach((s) => completeStep(st, n, s.id, T));
const seq = (vals) => { let i = 0; return () => vals[i++ % vals.length]; };

describe('pratik alanı', () => {
  it('sadece bitirilen günlerin cümleleri açılır', () => {
    const st = freshState();
    expect(unlockedIds(st)).toEqual([]);
    completeStep(st, 1, 'review', T);
    expect(unlockedIds(st)).toEqual([]); // gün yarım
    finishDay(st, 1);
    expect(unlockedIds(st)).toEqual(DAYS[0].learn);
    finishDay(st, 2);
    const days = unlockedDays(st);
    expect(days.map((d) => d.day)).toEqual([1, 2]);
    expect(new Set(unlockedIds(st)).size).toBe(unlockedIds(st).length);
  });

  it('tur dolu gelir, havuz küçükse cümleler tekrar eder ama art arda gelmez', () => {
    const st = freshState();
    const ids = ['a', 'b', 'c'];
    const round = pickRound(st, ids, ROUND_SIZE, seq([0.1, 0.5, 0.9, 0.3]));
    expect(round).toHaveLength(ROUND_SIZE);
    round.forEach((id, i) => { if (i) expect(id).not.toBe(round[i - 1]); });
    expect(new Set(round)).toEqual(new Set(ids));
    expect(pickRound(st, ['x'], 3)).toEqual(['x', 'x', 'x']);
  });

  it('zorlanılan cümle daha ağır basar', () => {
    const st = freshState();
    for (let i = 0; i < 5; i++) { recordPractice(st, 'good', true, T); recordPractice(st, 'bad', false, T); }
    expect(weight(st, 'bad')).toBeGreaterThan(weight(st, 'good'));
    expect(strength(st, 'good')).toBe(100);
    expect(strength(st, 'bad')).toBe(0);
    expect(st.pts[T]).toBe(5); // sadece doğrular XP verir
  });

  it('seçmeli: doğru cevap var, seçenekler tekrarsız', () => {
    const all = Object.values(cards);
    const card = cards.g1a || all[0];
    for (const field of ['it', 'tr']) {
      const opts = choicesFor(card, all, field);
      expect(opts).toHaveLength(4);
      expect(opts).toContain(card[field]);
      expect(new Set(opts).size).toBe(4);
    }
  });
});
