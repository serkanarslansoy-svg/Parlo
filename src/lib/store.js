// Kullanıcı verisi tarayıcıda (localStorage) tutulur. Depolama kapalıysa uygulama hafızada çalışmaya devam eder.
import { dayKey, addDays } from './srs.js';

const KEY = 'parlo_v3';

export const freshState = () => ({
  name: '',
  cards: {}, // cardId → {box, due, right, wrong}
  days: {}, // 'YYYY-MM-DD' → {review: n, scenes: [sceneId], dailyReview?: true}
  scenes: {}, // sceneId → {runs, cando: [string]}
  personal: [], // {id, it, note, date}
  settings: { slow: false },
});

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...freshState(), ...JSON.parse(raw) } : freshState();
  } catch {
    return freshState();
  }
}

export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* gizli mod / dolu depolama: sessizce devam */
  }
}

export function reset() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* yok say */
  }
}

export function today() {
  return dayKey();
}

export function touchDay(state, patch) {
  const k = today();
  const d = state.days[k] || { review: 0, scenes: [] };
  if (patch.review) d.review += patch.review;
  if (patch.scene && !d.scenes.includes(patch.scene)) d.scenes.push(patch.scene);
  if (patch.dailyReview) d.dailyReview = true;
  state.days[k] = d;
}

const active = (d) => Boolean(d && (d.review > 0 || d.scenes?.length > 0 || d.active || d.programDone?.length));

/** O günü pratik yapılmış say (program adımı, Tekrar yolu turu…). */
export function markActive(state, key) {
  state.days = state.days || {};
  const d = state.days[key] || (state.days[key] = { review: 0, scenes: [] });
  d.active = true;
}

/** Haftanın günü: 0 = Pazar … 6 = Cumartesi. */
export function weekday(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

// Bir gün kaçırmak seriyi bozmaz; art arda iki gerekli gün kaçarsa sıfırlanır.
export const GRACE_DAYS = 1;

/**
 * Seri: pratik yapılan gün sayısı. Bugün henüz pratik yoksa dünden geriye sayar.
 * planDays verilirse (0-6) sadece plandaki günler "gerekli" sayılır; plan dışı boş gün seriyi bozmaz.
 */
export function streak(state, todayKey = today(), planDays = null) {
  const plan = planDays?.length ? planDays : null;
  const required = (k) => !plan || plan.includes(weekday(k));
  let k = active(state.days[todayKey]) ? todayKey : addDays(todayKey, -1);
  let n = 0;
  let gap = 0;
  for (let i = 0; i < 1000; i++) {
    if (active(state.days[k])) {
      n++;
      gap = 0;
    } else if (required(k)) {
      gap++;
      if (gap > GRACE_DAYS) break;
    }
    k = addDays(k, -1);
  }
  return n;
}

export function isActiveDay(state, key) {
  return active(state.days[key]);
}
