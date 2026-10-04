import { describe, it, expect } from 'vitest';
import { grade, newCard, addDays, buildQueue, mastery, MAX_BOX } from '../src/lib/srs.js';
import { streak } from '../src/lib/store.js';

const T = '2026-10-04';

describe('addDays', () => {
  it('ay ve yıl sınırını geçer', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('grade', () => {
  it('doğru cevapta kutu artar ve vade uzar', () => {
    let c = newCard(T);
    c = grade(c, true, T);
    expect(c).toMatchObject({ box: 1, due: '2026-10-05', right: 1 });
    c = grade(c, true, T);
    expect(c).toMatchObject({ box: 2, due: '2026-10-07' });
  });
  it('yanlışta başa döner ve bugün tekrar sorulur', () => {
    const c = grade({ box: 4, due: T, right: 4, wrong: 0 }, false, T);
    expect(c).toMatchObject({ box: 0, due: T, wrong: 1 });
  });
  it('en üst kutuda kalır', () => {
    expect(grade({ box: MAX_BOX, due: T, right: 9, wrong: 0 }, true, T).box).toBe(MAX_BOX);
    expect(mastery({ box: MAX_BOX })).toBe(100);
    expect(mastery(undefined)).toBe(0);
  });
});

describe('buildQueue', () => {
  const all = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 's1', 's2', 's3'];
  it('vadesi gelenleri öne alır ve en az bir yeni cümle ekler', () => {
    const srsCards = Object.fromEntries(['a', 'b', 'c', 'd', 'e', 'f'].map((id, i) => [id, { box: 1, due: addDays(T, -i) }]));
    const q = buildQueue({ srsCards, sceneCardIds: ['s1', 's2', 's3'], allCardIds: all, today: T });
    expect(q).toHaveLength(5);
    expect(q.slice(0, 4)).toEqual(['f', 'e', 'd', 'c']);
    expect(q[4]).toBe('s1');
  });
  it('hiç kart yoksa günün senaryosundan yeni cümleler gelir', () => {
    expect(buildQueue({ srsCards: {}, sceneCardIds: ['s1', 's2', 's3'], allCardIds: all, today: T })).toEqual(['s1', 's2', 's3']);
  });
  it('vadesi gelmemiş kartları sormaz ama boşluğu senaryo kartlarıyla doldurur', () => {
    const srsCards = { a: { box: 3, due: addDays(T, 5) }, s1: { box: 2, due: addDays(T, 2) }, s2: { box: 0, due: addDays(T, 1) } };
    const q = buildQueue({ srsCards, sceneCardIds: ['s1', 's2', 's3'], allCardIds: all, today: T });
    expect(q).not.toContain('a');
    expect(q[0]).toBe('s3');
    expect(q).toEqual(['s3', 's2', 's1']);
  });
});

describe('streak', () => {
  const day = (review) => ({ review, scenes: [] });
  it('bugün dahil kesintisiz günleri sayar', () => {
    expect(streak({ days: { [T]: day(1), [addDays(T, -1)]: day(2), [addDays(T, -3)]: day(1) } }, T)).toBe(2);
  });
  it('bugün henüz pratik yoksa dünden sayar', () => {
    expect(streak({ days: { [addDays(T, -1)]: day(1), [addDays(T, -2)]: day(1) } }, T)).toBe(2);
    expect(streak({ days: {} }, T)).toBe(0);
  });
});
