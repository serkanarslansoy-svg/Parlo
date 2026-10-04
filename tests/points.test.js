import { describe, it, expect } from 'vitest';
import { award, weekKeys, weekPoints, totalPoints, leaderboard, gapToNext } from '../src/lib/points.js';

const T = '2026-10-04'; // Pazar

describe('puanlar', () => {
  it('güne puan ekler ve toplar', () => {
    const s = {};
    award(s, 10, T);
    award(s, 15, T);
    award(s, 5, '2026-09-28');
    expect(s.pts[T]).toBe(25);
    expect(totalPoints(s)).toBe(30);
  });
  it('hafta pazartesi başlar', () => {
    expect(weekKeys(T)[0]).toBe('2026-09-28');
    expect(weekKeys(T)[6]).toBe(T);
    expect(weekPoints({ pts: { '2026-09-27': 50, '2026-09-28': 5, [T]: 10 } }, T)).toBe(15);
  });
});

describe('lig', () => {
  const profiles = [{ id: 'a', name: 'Ayşe' }, { id: 'b', name: 'Burak' }, { id: 'c', name: 'Can' }];
  const data = { a: { pts: { [T]: 40 } }, b: { pts: { [T]: 90 } }, c: { pts: { [T]: 40, '2026-01-01': 500 } } };
  const stateOf = (id) => data[id];
  it('haftalık sıralar, eşitlikte aynı sıra', () => {
    const rows = leaderboard(profiles, stateOf, T, 'week');
    expect(rows.map((r) => [r.profile.id, r.rank])).toEqual([['b', 1], ['a', 2], ['c', 2]]);
  });
  it('tüm zamanlar toplamı kullanır', () => {
    expect(leaderboard(profiles, stateOf, T, 'all')[0].profile.id).toBe('c');
  });
  it('bir üsttekini geçmek için gereken puan', () => {
    const rows = leaderboard(profiles, stateOf, T, 'week');
    expect(gapToNext(rows, 'a')).toEqual({ name: 'Burak', points: 51 });
    expect(gapToNext(rows, 'c')).toEqual({ name: 'Burak', points: 51 });
    expect(gapToNext(rows, 'b')).toBeNull();
  });
});
