// Tekrar yolu: her program gününün 30 soruluk tekrar alıştırması.
// Gün programda bitince açılır; XP sadece ilk bitirişte verilir, sonraki turlar serbest pratiktir.
import { DAYS, isDayDone, dayPlan, EXAM_PASS, examRec } from './program.js';
import { award } from './points.js';
import { markActive } from './store.js';
import { shuffle, tilesFor, norm, isKeyboardSlip } from './answer.js';
import { sceneById, scenes } from '../content/index.js';

export const SESSION_SIZE = 30;
export const MATCH_SIZE = 5;
export const COMPLETE_BONUS = 10;
export const MIN_POOL = 6;

// 30 adımın dağılımı: önce tanı (kaydır), sonra seç, eşleştir, en sonda yaz.
export const PLAN = [
  { kind: 'swipe', count: 6 },
  { kind: 'choose', count: 8 },
  { kind: 'match', count: 2 },
  { kind: 'gap', count: 6 },
  { kind: 'write', count: 8 },
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
  markActive(state, day);
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

// --- Hafta kontrol sınavı ---
export const EXAM_SIZE = 20;
export const EXAM_XP = 50;
export const EXAM_PLAN = [
  { kind: 'choose', count: 6 },
  { kind: 'gap', count: 6 },
  { kind: 'write', count: 8 },
];
export const examNeed = (total = EXAM_SIZE) => Math.ceil(total * EXAM_PASS);

/** Sınav havuzu: o haftanın günlerinin cümleleri (son gün: tüm program). */
export function examIds(n) {
  const plan = dayPlan(n);
  if (!plan) return [];
  const days = n === DAYS[DAYS.length - 1].day ? DAYS : DAYS.filter((d) => d.week === plan.week);
  const ids = [];
  for (const d of days) {
    for (const id of [...d.learn, ...(d.talk.scene ? sceneById(d.talk.scene).cards : [])]) if (!ids.includes(id)) ids.push(id);
  }
  return ids;
}

export function buildExam(n, rand = Math.random) {
  const ids = examIds(n);
  if (!ids.length) return [];
  const steps = [];
  for (const part of EXAM_PLAN) {
    spread(shuffle(ids, rand), part.count, rand).forEach((id, i) => steps.push({ kind: part.kind, id, dir: i % 2 ? 'tr' : 'it' }));
  }
  return steps;
}

/**
 * Sınav sonucu. %80 ve üstü geçer; ilk geçişte EXAM_XP verilir.
 * @returns {{passed: boolean, xp: number, firstPass: boolean}}
 */
export function finishExam(state, n, ok, total, day) {
  state.exams = state.exams || {};
  markActive(state, day);
  const prev = examRec(state, n);
  const passed = ok >= examNeed(total);
  const firstPass = passed && !prev?.passed;
  state.exams[n] = {
    best: Math.max(prev?.best || 0, ok), total, tries: (prev?.tries || 0) + 1,
    passed: Boolean(prev?.passed || passed), date: passed && !prev?.passed ? day : prev?.date || null,
  };
  return { passed, firstPass, xp: firstPass ? award(state, EXAM_XP, day) : 0 };
}

// --- Diyalog boşluk doldurma ---
// Bir cümleden önce karşı tarafın ne dediği: sohbet sahnelerinden ve soru-cevap günlerinden.
let contextMap = null;
function contexts() {
  if (contextMap) return contextMap;
  contextMap = new Map();
  for (const sc of scenes) {
    for (const node of Object.values(sc.nodes)) {
      for (const it of node.intents || []) if (!contextMap.has(it.model)) contextMap.set(it.model, { who: sc.persona.name, line: node.ai });
    }
  }
  for (const d of DAYS) {
    for (const q of d.talk.drill || []) for (const m of q.models) if (!contextMap.has(m)) contextMap.set(m, { who: 'Komşu', line: q.q });
  }
  return contextMap;
}

/**
 * Cümleden bir kelimeyi boşluk yapar (3+ harfli kelimelerden). Karşı tarafın repliği varsa onu da verir.
 * @returns {{before: string, answer: string, after: string, context: {who, line} | null}}
 */
export function gapFor(card, rand = Math.random) {
  const words = card.it.split(/\s+/);
  const clean = (w) => tilesFor(w)[0] || '';
  const candidates = words.map((w, i) => i).filter((i) => norm(clean(words[i])).replace(/ /g, '').length >= 3);
  const i = candidates.length ? candidates[Math.floor(rand() * candidates.length)] : 0;
  const raw = words[i];
  const answer = clean(raw);
  const at = raw.indexOf(answer);
  const before = (i ? `${words.slice(0, i).join(' ')} ` : '') + raw.slice(0, at);
  const after = raw.slice(at + answer.length) + (i < words.length - 1 ? ` ${words.slice(i + 1).join(' ')}` : '');
  return { before, answer, after, context: contexts().get(card.it) || null };
}

/** Boşluğa yazılanı kontrol eder: aksan/büyük harf önemsiz, klavye kayması doğru sayılır. */
export function checkGap(input, answer) {
  const g = norm(input).replace(/ /g, '');
  const e = norm(answer).replace(/ /g, '');
  if (!g) return { ok: false, slip: false };
  if (g === e) return { ok: true, slip: false };
  return isKeyboardSlip(g, e) ? { ok: true, slip: true } : { ok: false, slip: false };
}
