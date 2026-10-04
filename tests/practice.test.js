import { describe, it, expect } from 'vitest';
import { buildSession, finishPractice, isPracticeOpen, isPracticeDone, practiceIds, spread, choicesFor, SESSION_SIZE, COMPLETE_BONUS } from '../src/lib/practice.js';
import { completeStep, STEPS, DAYS } from '../src/lib/program.js';
import { cards } from '../src/content/index.js';
import { freshState } from '../src/lib/store.js';

const T = '2026-10-05';
const finishDay = (st, n) => STEPS.forEach((s) => completeStep(st, n, s.id, T));

describe('tekrar yolu', () => {
  it('her günün 30 adımlık oturumu var ve sadece o günün cümlelerini kullanır', () => {
    for (const d of DAYS) {
      const s = buildSession(d.day);
      expect(s).toHaveLength(SESSION_SIZE);
      const used = s.flatMap((x) => x.ids || [x.id]);
      const pool = practiceIds(d.day);
      expect(pool.length).toBeGreaterThanOrEqual(4);
      d.learn.forEach((id) => expect(pool).toContain(id));
      used.forEach((id) => { expect(pool).toContain(id); expect(cards[id]).toBeTruthy(); });
      s.forEach((x, i) => { if (i && x.id && s[i - 1].id && s[i - 1].kind === x.kind) expect(x.id).not.toBe(s[i - 1].id); });
      expect(new Set(s.map((x) => x.kind))).toEqual(new Set(['swipe', 'choose', 'match', 'write']));
    }
  });

  it('cümleler eşit dağılır', () => {
    const out = spread(['a', 'b', 'c'], 12);
    expect(out.filter((x) => x === 'a')).toHaveLength(4);
  });

  it('gün programda bitince açılır', () => {
    const st = freshState();
    expect(isPracticeOpen(st, 1)).toBe(false);
    finishDay(st, 1);
    expect(isPracticeOpen(st, 1)).toBe(true);
    expect(isPracticeOpen(st, 2)).toBe(false);
  });

  it('XP sadece ilk bitirişte, tekrarında en iyi skor güncellenir', () => {
    const st = freshState();
    const first = finishPractice(st, 1, 20, 30, T);
    expect(first).toEqual({ xp: 20 + COMPLETE_BONUS, first: true });
    expect(st.pts[T]).toBe(20 + COMPLETE_BONUS);
    const again = finishPractice(st, 1, 28, 30, T);
    expect(again).toEqual({ xp: 0, first: false });
    expect(st.pts[T]).toBe(20 + COMPLETE_BONUS);
    expect(st.practiceDays[1].best).toBe(28);
    expect(isPracticeDone(st, 1)).toBe(true);
  });

  it('seçmeli: doğru cevap var, seçenekler tekrarsız', () => {
    const all = Object.values(cards);
    const card = cards[practiceIds(1)[0]];
    for (const field of ['it', 'tr']) {
      const opts = choicesFor(card, all, field);
      expect(opts).toHaveLength(4);
      expect(opts).toContain(card[field]);
      expect(new Set(opts).size).toBe(4);
    }
  });
});
