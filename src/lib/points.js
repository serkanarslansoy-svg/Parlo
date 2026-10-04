// Puanlar ve haftalık lig. Puan, gerçekten konuşmayı ve doğru hatırlamayı ödüllendirir.
import { addDays } from './srs.js';

export const POINTS = {
  reviewOk: 10, // tekrar sorusunu yardımsız bilmek
  reviewHint: 5, // ipucuyla bilmek
  stepSolo: 15, // sohbet adımını ilk denemede, yardımsız geçmek
  stepHelp: 5, // yardımla geçmek
  sceneDone: 20, // senaryoyu bitirmek
  dailyDone: 30, // günün dersini tamamlamak
  drillOk: 10, // soru-cevap pratiğinde rahat cevap
  drillHard: 5, // zorlanarak verilen cevap
  learnCard: 2, // yeni cümleyi sesli tekrar etmek
};

export function award(state, n, day) {
  if (!n) return 0;
  state.pts = state.pts || {};
  state.pts[day] = (state.pts[day] || 0) + n;
  return n;
}

/** Pazartesi başlayan haftanın günleri. */
export function weekKeys(day) {
  const [y, m, d] = day.split('-').map(Number);
  const offset = (new Date(y, m - 1, d).getDay() + 6) % 7;
  const monday = addDays(day, -offset);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export const dayPoints = (state, day) => state.pts?.[day] || 0;
export const weekPoints = (state, day) => weekKeys(day).reduce((s, k) => s + dayPoints(state, k), 0);
export const totalPoints = (state) => Object.values(state.pts || {}).reduce((s, n) => s + n, 0);

/**
 * Lig sıralaması. mode: 'week' | 'all'.
 * @returns {Array<{profile, points, rank}>} eşit puanda aynı sıra
 */
export function leaderboard(profiles, stateOf, day, mode = 'week') {
  const rows = profiles
    .map((p) => {
      const st = stateOf(p.id);
      return { profile: p, points: mode === 'week' ? weekPoints(st, day) : totalPoints(st) };
    })
    .sort((a, b) => b.points - a.points || a.profile.name.localeCompare(b.profile.name, 'tr'));
  let rank = 0;
  let prev = null;
  rows.forEach((r, i) => {
    if (r.points !== prev) rank = i + 1;
    r.rank = rank;
    prev = r.points;
  });
  return rows;
}

/** Bir üstteki oyuncuyu geçmek için kaç puan gerekiyor (zaten liderse null). */
export function gapToNext(rows, profileId) {
  const i = rows.findIndex((r) => r.profile.id === profileId);
  if (i <= 0) return null;
  const above = rows.slice(0, i).reverse().find((r) => r.points > rows[i].points);
  return above ? { name: above.profile.name, points: above.points - rows[i].points + 1 } : null;
}
