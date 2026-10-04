// Cümlelerim pratik alanı: bitirilen program günlerinin cümleleri, sınırsız tur.
// Zorlanılan cümleler daha sık gelir; sonuçlar state.practice[cardId] = {seen, ok} olarak tutulur.
import { DAYS, isDayDone } from './program.js';
import { award } from './points.js';
import { shuffle } from './answer.js';

export const ROUND_SIZE = 10;
export const MATCH_SIZE = 5;
export const PRACTICE_XP = 1;

export const MODES = [
  { id: 'write', label: 'Yazmalı', icon: 'pencil', desc: 'Türkçesini gör, İtalyancasını yaz' },
  { id: 'choose', label: 'Seçmeli', icon: 'list', desc: '4 seçenekten doğrusunu seç' },
  { id: 'swipe', label: 'Kaydırmalı', icon: 'swipe', desc: 'Kartı çevir, biliyorsan sağa kaydır' },
  { id: 'match', label: 'Eşleştirme', icon: 'link', desc: 'İtalyanca ve Türkçeyi eşleştir' },
];
export const modeById = (id) => MODES.find((m) => m.id === id) || null;

/** Bitirilen günler ve cümleleri, gün sırasıyla (aynı cümle bir kez). */
export function unlockedDays(state) {
  const seen = new Set();
  return DAYS.filter((d) => isDayDone(state, d.day)).map((d) => {
    const ids = d.learn.filter((id) => !seen.has(id));
    ids.forEach((id) => seen.add(id));
    return { day: d.day, title: d.title, ids };
  }).filter((d) => d.ids.length);
}
export const unlockedIds = (state) => unlockedDays(state).flatMap((d) => d.ids);

export const statOf = (state, id) => state.practice?.[id] || { seen: 0, ok: 0 };

/** 0–100: pratikte doğru oranı (hiç görülmediyse 0). */
export function strength(state, id) {
  const s = statOf(state, id);
  return s.seen ? Math.round((s.ok / s.seen) * 100) : 0;
}

/** Zayıf ve az görülen cümle daha ağır basar. */
export function weight(state, id) {
  const s = statOf(state, id);
  const miss = s.seen ? 1 - s.ok / s.seen : 1;
  return 1 + 4 * miss + (s.seen < 3 ? 2 : 0);
}

/**
 * Bir tur için cümle seçer. Havuz turdan küçükse cümleler tekrar eder
 * (art arda aynı cümle gelmez).
 */
export function pickRound(state, ids, size = ROUND_SIZE, rand = Math.random) {
  if (!ids.length) return [];
  const out = [];
  let bag = [];
  while (out.length < size) {
    if (!bag.length) bag = [...ids];
    const pool = bag.length > 1 ? bag.filter((id) => id !== out[out.length - 1]) : bag;
    const total = pool.reduce((s, id) => s + weight(state, id), 0);
    let r = rand() * total;
    let pick = pool[pool.length - 1];
    for (const id of pool) { r -= weight(state, id); if (r <= 0) { pick = id; break; } }
    out.push(pick);
    bag.splice(bag.indexOf(pick), 1);
  }
  return out;
}

/** Sonucu kaydeder; doğruysa küçük XP verir. */
export function recordPractice(state, id, ok, day) {
  state.practice = state.practice || {};
  const s = statOf(state, id);
  state.practice[id] = { seen: s.seen + 1, ok: s.ok + (ok ? 1 : 0) };
  return ok ? award(state, PRACTICE_XP, day) : 0;
}

/**
 * Seçmeli soru için seçenekler: doğru cevap + aynı kalıptan (yoksa herhangi) çeldiriciler.
 * field: 'it' ya da 'tr'.
 */
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
