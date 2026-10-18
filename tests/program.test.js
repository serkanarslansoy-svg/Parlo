import { describe, it, expect } from 'vitest';
import { DAYS, WEEKS, STEPS, TOTAL_DAYS, currentDay, nextStep, completeStep, isDayDone, addMistake, enrollCards, waitsForTomorrow, isUnlocked, learnedBefore, doneCount, finishDate, planDays, hasPlan, setPlanDays, formatDay } from '../src/lib/program.js';
import { cards, sceneById } from '../src/content/index.js';
import { freshState } from '../src/lib/store.js';

const T = '2026-10-05';

describe('program içeriği', () => {
  it('30 gün, 4 hafta, her hafta 7–9 gün', () => {
    expect(TOTAL_DAYS).toBe(30);
    expect(DAYS.map((d) => d.day)).toEqual(Array.from({ length: 30 }, (_, i) => i + 1));
    expect(WEEKS).toHaveLength(4);
    for (const w of WEEKS) expect(DAYS.filter((d) => d.week === w.week).length).toBeGreaterThanOrEqual(7);
  });
  it('her günün kartları, senaryosu ya da soru-cevap pratiği geçerli', () => {
    for (const d of DAYS) {
      for (const id of d.learn) expect(cards[id], `gün ${d.day}: ${id}`).toBeTruthy();
      if (d.talk.scene) expect(sceneById(d.talk.scene), `gün ${d.day}: ${d.talk.scene}`).toBeTruthy();
      else {
        expect(d.talk.title, `gün ${d.day} başlık`).toBeTruthy();
        expect(d.talk.drill.length, `gün ${d.day} soru`).toBeGreaterThanOrEqual(3);
        for (const q of d.talk.drill) { expect(q.q && q.tr).toBeTruthy(); expect(q.models.length).toBeGreaterThan(0); }
      }
    }
  });
  it('kontrol günleri hariç her gün en az 3 yeni cümle; kontroller 7, 14, 21 ve 30. günlerde', () => {
    for (const d of DAYS.filter((x) => !x.gate)) expect(d.learn.length, `gün ${d.day}`).toBeGreaterThanOrEqual(3);
    expect(DAYS.filter((d) => d.gate).map((d) => d.day)).toEqual([7, 14, 21, 30]);
  });
  it('her günün cümleleri, sahnesi ya da soruları mevcut; seviye ve kısa not var', () => {
    for (const d of DAYS) {
      for (const id of [...d.learn, ...(d.review || [])]) expect(cards[id], `gün ${d.day}: ${id}`).toBeTruthy();
      if (d.talk.scene) expect(sceneById(d.talk.scene), `gün ${d.day}`).toBeTruthy();
      else expect(d.talk.drill.length, `gün ${d.day}`).toBeGreaterThan(0);
      expect(d.level).toBeTruthy();
    }
  });
  it('kontrol günleri öncekileri tekrar eder (yeni cümle yok)', () => {
    for (const d of DAYS.filter((x) => x.gate)) expect(d.learn, `gün ${d.day}`).toEqual([]);
  });
});

describe('program ilerlemesi', () => {
  it('adım adım ilerler, gün bitince bonus bir kez verilir', () => {
    const s = freshState();
    expect(currentDay(s)).toBe(1);
    expect(nextStep(s, 1).id).toBe('review');
    for (const st of STEPS.slice(0, 3)) expect(completeStep(s, 1, st.id, T).dayDone).toBe(false);
    const r = completeStep(s, 1, 'fix', T);
    expect(r).toEqual({ dayDone: true, bonus: 30 });
    expect(isDayDone(s, 1)).toBe(true);
    expect(currentDay(s)).toBe(2);
    expect(doneCount(s)).toBe(1);
    // aynı gün ikinci bir gün bitirilirse bonus tekrar verilmez
    for (const st of STEPS) completeStep(s, 2, st.id, T);
    expect(s.pts[T]).toBe(30);
  });
  it('bir sonraki gün yarın açılır ama kilitli değildir', () => {
    const s = freshState();
    for (const st of STEPS) completeStep(s, 1, st.id, T);
    expect(isUnlocked(s, 2)).toBe(true);
    expect(isUnlocked(s, 3)).toBe(false);
    expect(waitsForTomorrow(s, 2, T)).toBe(true);
    expect(waitsForTomorrow(s, 2, '2026-10-06')).toBe(false);
  });
  it('hatalar tekrarsız ve en fazla 10', () => {
    const s = freshState();
    addMistake(s, 1, 'Ho fame.', 'Acıktım.');
    addMistake(s, 1, 'Ho fame.', 'Acıktım.');
    for (let i = 0; i < 20; i++) addMistake(s, 1, `c${i}`, '');
    expect(s.program.days[1].mistakes).toHaveLength(10);
  });
  it('yeni kartlar yarın tekrar edilmek üzere eklenir, var olanlara dokunulmaz', () => {
    const s = freshState();
    s.cards.g1a = { box: 3, due: '2026-12-01', right: 3, wrong: 0 };
    enrollCards(s, ['g1a', 'g1b'], T);
    expect(s.cards.g1a.box).toBe(3);
    expect(s.cards.g1b).toMatchObject({ box: 0, due: '2026-10-06' });
    expect(learnedBefore(3)).toEqual([...DAYS[0].learn, ...DAYS[1].learn]);
  });
});

describe('çalışma planı', () => {
  // 2026-10-05 Pazartesi
  const MON = '2026-10-05';
  it('plan yoksa her gün: 30 gün bugünden başlar', () => {
    const st = freshState();
    expect(finishDate(st, MON)).toBe('2026-11-03');
    expect(planDays(st)).toHaveLength(7);
    expect(hasPlan(st)).toBe(false);
  });
  it('haftada 5 gün (hafta içi) bitişi uzatır', () => {
    const st = freshState();
    setPlanDays(st, [1, 2, 3, 4, 5]);
    expect(hasPlan(st)).toBe(true);
    // 30 iş günü: 6 hafta → 6. haftanın Cuması
    expect(finishDate(st, MON)).toBe('2026-11-13');
  });
  it('bugün bir gün bitirildiyse sayım yarından başlar; biten günler düşülür', () => {
    const st = freshState();
    STEPS.forEach((s) => completeStep(st, 1, s.id, MON));
    expect(finishDate(st, MON)).toBe('2026-11-03'); // 29 gün kaldı, yarından itibaren
  });
  it('boş plan her güne döner; tarih yazısı Türkçe', () => {
    const st = freshState();
    setPlanDays(st, []);
    expect(planDays(st)).toHaveLength(7);
    expect(formatDay('2026-11-21')).toBe('21 Kasım Cumartesi');
  });
});

describe('içerik sürümü', async () => {
  const { migrateState, CONTENT_VERSION } = await import('../src/lib/program.js');
  const { addProfile } = await import('../src/lib/profiles.js');
  it('yeni oyuncunun ilerlemesi sonraki açılışta silinmez', () => {
    const db = { profiles: [], active: null, data: {} };
    const p = addProfile(db, { name: 'Ayşe', avatar: '🦊', color: '#2e7d4f' });
    const st = db.data[p.id];
    st.program = { days: { 1: { steps: { review: true }, mistakes: [] } } };
    expect(migrateState(st)).toBe(false);
    expect(st.program.days[1].steps.review).toBe(true);
  });
  it('eski sürüm ilerlemesi bir kez temizlenir, XP kalır', () => {
    const st = { program: { days: { 3: { steps: { review: true } } } }, cards: { bar1: { box: 3 } }, pts: { '2026-10-01': 50 }, scenes: { bar: {}, ristorante: {} } };
    expect(migrateState(st, ['ristorante'])).toBe(true);
    expect(st).toMatchObject({ contentVersion: CONTENT_VERSION, program: { days: {} }, cards: {}, pts: { '2026-10-01': 50 }, scenes: { ristorante: {} } });
    expect(migrateState(st)).toBe(false);
  });
});
