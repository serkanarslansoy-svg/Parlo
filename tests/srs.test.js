import { describe, it, expect } from 'vitest';
import { grade, newCard, addDays, buildQueue, mastery, MAX_BOX } from '../src/lib/srs.js';
import { streak, markActive, freshState } from '../src/lib/store.js';
import { strengthOf, groupStrength, knownCard } from '../src/lib/srs.js';

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
  it('bugün dahil günleri sayar; tek kaçırılan gün seriyi bozmaz', () => {
    expect(streak({ days: { [T]: day(1), [addDays(T, -1)]: day(2), [addDays(T, -3)]: day(1) } }, T)).toBe(3);
  });
  it('art arda iki gün kaçarsa seri sıfırlanır', () => {
    expect(streak({ days: { [T]: day(1), [addDays(T, -3)]: day(1), [addDays(T, -4)]: day(1) } }, T)).toBe(1);
  });
  it('dün kaçtıysa bugün gelince seri sürer, bugün de gelmezse hâlâ kurtarılabilir', () => {
    const days = { [addDays(T, -2)]: day(1), [addDays(T, -3)]: day(1) };
    expect(streak({ days }, T)).toBe(2); // dün kaçtı, bugün daha gelmedi
    expect(streak({ days }, addDays(T, 1))).toBe(0); // iki gün üst üste kaçtı
  });
  it('plan dışı günler seriyi bozmaz', () => {
    // 2026-10-04 Pazar. Plan: Pzt, Çar, Cuma (1, 3, 5).
    // Cuma ve Pazartesi var, Çarşamba kaçtı (tek kaçış: tolere edilir); Salı/Perşembe plan dışı.
    const days = { '2026-10-02': day(1), '2026-09-28': day(1) };
    expect(streak({ days }, T, [1, 3, 5])).toBe(2);
    expect(streak({ days }, T)).toBe(1); // plansız: Perşembe + Çarşamba art arda kaçış seriyi keser
  });
  it('program adımı ve Tekrar yolu da seriye sayılır', () => {
    const st = freshState();
    markActive(st, T);
    expect(streak(st, T)).toBe(1);
  });
  it('bugün henüz pratik yoksa dünden sayar', () => {
    expect(streak({ days: { [addDays(T, -1)]: day(1), [addDays(T, -2)]: day(1) } }, T)).toBe(2);
    expect(streak({ days: {} }, T)).toBe(0);
  });
});

describe('güç', () => {
  it('kutuya göre zayıf / orta / güçlü', () => {
    expect(strengthOf(undefined)).toBe('new');
    expect(strengthOf({ box: 0 })).toBe('weak');
    expect(strengthOf({ box: 1 })).toBe('weak');
    expect(strengthOf({ box: 2 })).toBe('mid');
    expect(strengthOf({ box: 4 })).toBe('strong');
  });
  it('grup gücü sadece kutudakilerin ortalaması', () => {
    expect(groupStrength({}, ['a', 'b'])).toBe('new');
    expect(groupStrength({ a: { box: 5 }, b: { box: 3 } }, ['a', 'b', 'c'])).toBe('strong');
    expect(groupStrength({ a: { box: 0 }, b: { box: 2 } }, ['a', 'b'])).toBe('weak');
  });
  it('biliyorum: kutu 2, üç gün sonra', () => {
    expect(knownCard(T)).toMatchObject({ box: 2, due: addDays(T, 3) });
  });
});
