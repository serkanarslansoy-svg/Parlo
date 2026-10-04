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

const active = (d) => d && (d.review > 0 || d.scenes.length > 0);

/** Kesintisiz pratik günü sayısı. Bugün henüz pratik yapılmadıysa dünden geriye sayar. */
export function streak(state, todayKey = today()) {
  let k = active(state.days[todayKey]) ? todayKey : addDays(todayKey, -1);
  let n = 0;
  while (active(state.days[k])) {
    n++;
    k = addDays(k, -1);
  }
  return n;
}

export function isActiveDay(state, key) {
  return active(state.days[key]);
}
