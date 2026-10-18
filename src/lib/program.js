// 30 günlük program: her gün 4 adım (tekrar, yeni kalıp, konuşma, hata düzeltme).
import program from '../content/program.json';
import { award, POINTS } from './points.js';
import { newCard, addDays } from './srs.js';
import { markActive } from './store.js';

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

// --- Hafta kontrol sınavları (7, 14, 21, 30. günler) ---
export const EXAM_PASS = 0.8;
export const isGateDay = (n) => Boolean(dayPlan(n)?.gate);
export const examRec = (state, n) => state.exams?.[n] || null;
export const examPassed = (state, n) => Boolean(examRec(state, n)?.passed);
const dayStarted = (state, n) => Object.keys(state.program?.days?.[n]?.steps || {}).length > 0;

/** Önceki gün bitince açılır; önceki gün kontrol günüyse sınavı da geçilmiş olmalı (başlanmış gün kilitlenmez). */
export function isUnlocked(state, n) {
  if (n === 1) return true;
  if (!isDayDone(state, n - 1)) return false;
  return !isGateDay(n - 1) || examPassed(state, n - 1) || dayStarted(state, n);
}

/** Bitmiş ama sınavı geçilmemiş kontrol günü (yoksa null). */
export function pendingExam(state) {
  const d = DAYS.find((x) => x.gate && isDayDone(state, x.day) && !examPassed(state, x.day) && !(dayPlan(x.day + 1) && dayStarted(state, x.day + 1)));
  return d ? d.day : null;
}

/**
 * Bir adımı tamamlar. Gün bu adımla bittiyse günü işaretler ve (takvim günü başına bir kez) bonus XP verir.
 * @returns {{dayDone: boolean, bonus: number}}
 */
export function completeStep(state, n, step, today) {
  const rec = dayRec(state, n);
  rec.steps[step] = true;
  markActive(state, today);
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

// --- Çalışma planı ---
export const WEEKDAYS = [
  { d: 1, short: 'Pzt', long: 'Pazartesi' }, { d: 2, short: 'Sal', long: 'Salı' },
  { d: 3, short: 'Çar', long: 'Çarşamba' }, { d: 4, short: 'Per', long: 'Perşembe' },
  { d: 5, short: 'Cum', long: 'Cuma' }, { d: 6, short: 'Cmt', long: 'Cumartesi' },
  { d: 0, short: 'Paz', long: 'Pazar' },
];
const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

/** Plandaki haftanın günleri (0 = Pazar). Plan yoksa her gün. */
export const planDays = (state) => (state.plan?.days?.length ? state.plan.days : ALL_DAYS);
export const hasPlan = (state) => Boolean(state.plan?.days?.length);

export function setPlanDays(state, days) {
  const clean = [...new Set(days)].filter((d) => ALL_DAYS.includes(d)).sort();
  state.plan = { ...(state.plan || {}), days: clean.length ? clean : ALL_DAYS };
}

const weekdayOf = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
};

/**
 * Kalan günler plandaki günlere birer birer yayılırsa Gün 30 hangi tarihte biter.
 * Bugün zaten bir gün bitirildiyse sayım yarından başlar. Hepsi bittiyse null.
 */
export function finishDate(state, today) {
  let left = TOTAL_DAYS - doneCount(state);
  if (left <= 0) return null;
  const days = planDays(state);
  const doneToday = DAYS.some((d) => state.program?.days?.[d.day]?.completedOn === today);
  let k = doneToday ? addDays(today, 1) : today;
  for (let i = 0; i < 400; i++) {
    if (days.includes(weekdayOf(k))) {
      left -= 1;
      if (left === 0) return k;
    }
    k = addDays(k, 1);
  }
  return null;
}

/** "21 Kasım Cumartesi" */
export function formatDay(key) {
  const [y, m, d] = key.split('-').map(Number);
  const wd = WEEKDAYS.find((w) => w.d === new Date(y, m - 1, d).getDay());
  return `${d} ${MONTHS[m - 1]} ${wd.long}`;
}
