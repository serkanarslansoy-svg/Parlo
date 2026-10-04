// 30 günlük program: her gün 4 adım (tekrar, yeni kalıp, konuşma, hata düzeltme).
import program from '../content/program.json';
import { award, POINTS } from './points.js';
import { newCard, addDays } from './srs.js';

export const WEEKS = program.weeks;
export const DAYS = program.days;
export const TOTAL_DAYS = DAYS.length;
export const STEPS = [
  { id: 'review', label: 'Tekrar', min: 3, icon: 'repeat' },
  { id: 'learn', label: 'Yeni kalıp', min: 4, icon: 'book' },
  { id: 'talk', label: 'Konuşma', min: 6, icon: 'mic' },
  { id: 'fix', label: 'Hata düzeltme', min: 2, icon: 'check' },
];

export const dayPlan = (n) => DAYS.find((d) => d.day === Number(n)) || null;
export const weekOf = (n) => WEEKS.find((w) => w.week === dayPlan(n)?.week) || null;

function prog(state) {
  if (!state.program) state.program = { days: {} };
  return state.program;
}
export function dayRec(state, n) {
  const p = prog(state);
  if (!p.days[n]) p.days[n] = { steps: {}, mistakes: [] };
  return p.days[n];
}
export const isStepDone = (state, n, step) => Boolean(state.program?.days?.[n]?.steps?.[step]);
export const isDayDone = (state, n) => STEPS.every((s) => isStepDone(state, n, s.id));
export const doneCount = (state) => DAYS.filter((d) => isDayDone(state, d.day)).length;

/** Sıradaki gün (hepsi bittiyse null). */
export function currentDay(state) {
  const d = DAYS.find((x) => !isDayDone(state, x.day));
  return d ? d.day : null;
}

export function nextStep(state, n) {
  return STEPS.find((s) => !isStepDone(state, n, s.id)) || null;
}

/** Önceki gün bugün bittiyse bu gün "yarın" açılır (yine de başlanabilir). */
export function waitsForTomorrow(state, n, today) {
  if (n <= 1) return false;
  return state.program?.days?.[n - 1]?.completedOn === today && !Object.keys(state.program?.days?.[n]?.steps || {}).length;
}

export function isUnlocked(state, n) {
  return n === 1 || isDayDone(state, n - 1);
}

/**
 * Bir adımı tamamlar. Gün bu adımla bittiyse günü işaretler ve (takvim günü başına bir kez) bonus XP verir.
 * @returns {{dayDone: boolean, bonus: number}}
 */
export function completeStep(state, n, step, today) {
  const rec = dayRec(state, n);
  rec.steps[step] = true;
  if (!isDayDone(state, n) || rec.completedOn) return { dayDone: isDayDone(state, n), bonus: 0 };
  rec.completedOn = today;
  const day = state.days[today] || (state.days[today] = { review: 0, scenes: [] });
  if (!day.programDone) day.programDone = [];
  day.programDone.push(n);
  let bonus = 0;
  if (!day.dailyBonus) {
    day.dailyBonus = true;
    bonus = award(state, POINTS.dailyDone, today);
  }
  return { dayDone: true, bonus };
}

/** Günün hata listesine ekler (aynı cümle bir kez, en fazla 10). */
export function addMistake(state, n, it, tr) {
  if (!n || !it) return;
  const rec = dayRec(state, n);
  if (rec.mistakes.some((m) => m.it === it) || rec.mistakes.length >= 10) return;
  rec.mistakes.push({ it, tr: tr || '' });
}

/** Yeni kalıp adımında öğrenilen kartlar tekrar kutusuna yarın için girer. */
export function enrollCards(state, ids, today) {
  for (const id of ids) if (!state.cards[id]) state.cards[id] = { ...newCard(today), due: addDays(today, 1) };
}

/** Daha önceki program günlerinde öğrenilmiş kartlar (tekrar adımı için yedek liste). */
export function learnedBefore(n) {
  return DAYS.filter((d) => d.day < n).flatMap((d) => d.learn);
}
