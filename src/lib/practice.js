// Tekrar yolu: her program gününün 30 soruluk tekrar alıştırması.
// Gün programda bitince açılır; XP sadece ilk bitirişte verilir, sonraki turlar serbest pratiktir.
import { DAYS, isDayDone } from './program.js';
import { award } from './points.js';
import { shuffle } from './answer.js';
import { sceneById } from '../content/index.js';

export const SESSION_SIZE = 30;
export const MATCH_SIZE = 5;
export const COMPLETE_BONUS = 10;
export const MIN_POOL = 6;

// 30 adımın dağılımı: önce tanı (kaydır), sonra seç, eşleştir, en sonda yaz.
export const PLAN = [
  { kind: 'swipe', count: 6 },
  { kind: 'choose', count: 10 },
  { kind: 'match', count: 2 },
  { kind: 'write', count: 12 },
];

export const practiceRec = (state, n) => state.practiceDays?.[n] || null;
export const isPracticeDone = (state, n) => Boolean(practiceRec(state, n));
export const isPracticeOpen = (state, n) => isDayDone(state, n);
export const practiceDoneCount = (state) => DAYS.filter((d) => isPracticeDone(state, d.day)).length;

/**
 * Günün tekrar edilecek cümleleri: o günün yenileri + günün sahnesinin cümleleri.
 * Hâlâ azsa (sahne ve serbest konuşma günleri) önceki günlerden en yenileriyle 6'ya tamamlanır.
 */
export function practiceIds(n) {
  const i = DAYS.findIndex((d) => d.day === Number(n));
  if (i < 0) return [];
  const d = DAYS[i];
  const pool = [...new Set([...d.learn, ...(d.talk.scene ? sceneById(d.talk.scene).cards : [])])];
  for (let j = i - 1; j >= 0 && pool.length < MIN_POOL; j--) {
    for (const id of [...DAYS[j].learn].reverse()) if (pool.length < MIN_POOL && !pool.includes(id)) pool.push(id);
  }
  return pool;
}

/** Cümleleri sırayla dağıtır; art arda aynı cümle gelmez. */
export function spread(ids, size, rand = Math.random) {
  const out = [];
  while (out.length < size) {
    let bag = shuffle(ids, rand);
    if (out.length && bag[0] === out[out.length - 1] && bag.length > 1) bag = [...bag.slice(1), bag[0]];
    out.push(...bag);
  }
  return out.slice(0, size);
}

/** 30 adımlık tekrar oturumu. Eşleştirme tablosu tek adım sayılır. */
export function buildSession(n, rand = Math.random) {
  const ids = practiceIds(n);
  if (!ids.length) return [];
  const steps = [];
  for (const part of PLAN) {
    if (part.kind === 'match') {
      for (let i = 0; i < part.count; i++) steps.push({ kind: 'match', ids: shuffle(ids, rand).slice(0, MATCH_SIZE) });
    } else {
      spread(ids, part.count, rand).forEach((id, i) => steps.push({ kind: part.kind, id, dir: i % 2 ? 'tr' : 'it' }));
    }
  }
  return steps;
}

/**
 * Oturum bitti. İlk bitirişte doğru sayısı + bonus kadar XP verir; tekrarında XP yok, sadece en iyi skor güncellenir.
 * @returns {{xp: number, first: boolean}}
 */
export function finishPractice(state, n, ok, total, day) {
  state.practiceDays = state.practiceDays || {};
  const prev = state.practiceDays[n];
  if (prev) {
    state.practiceDays[n] = { ...prev, best: Math.max(prev.best, ok), runs: (prev.runs || 1) + 1 };
    return { xp: 0, first: false };
  }
  state.practiceDays[n] = { date: day, best: ok, total, runs: 1 };
  return { xp: award(state, ok + COMPLETE_BONUS, day), first: true };
}

/** Seçmeli soru için seçenekler: doğru cevap + aynı kalıptan (yoksa herhangi) çeldiriciler. */
export function choicesFor(card, allCards, field = 'it', n = 4, rand = Math.random) {
  const others = allCards.filter((c) => c.id !== card.id && c[field] !== card[field]);
  const same = shuffle(others.filter((c) => c.pattern && c.pattern === card.pattern), rand);
  const rest = shuffle(others.filter((c) => !same.includes(c)), rand);
  const picked = [];
  for (const c of [...same, ...rest]) {
    if (picked.length >= n - 1) break;
    if (!picked.some((p) => p[field] === c[field])) picked.push(c);
  }
  return shuffle([card, ...picked], rand).map((c) => c[field]);
}
