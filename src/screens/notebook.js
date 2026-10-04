import { h, icon } from '../lib/dom.js';
import { DAYS, WEEKS, TOTAL_DAYS } from '../lib/program.js';
import { isPracticeOpen, isPracticeDone, practiceRec, practiceDoneCount, COMPLETE_BONUS, SESSION_SIZE } from '../lib/practice.js';
import { topbar } from '../ui.js';

// Zikzak: her durağın yatay kayması (px), hafta içinde dalga gibi.
const WAVE = [0, 46, 78, 46, 0, -46, -78, -46];

/** Tekrar sekmesi: 1–30 tekrar yolu. Programda biten günün durağı açılır. */
export function renderNotebook(ctx) {
  const { state } = ctx;
  const done = practiceDoneCount(state);
  const current = DAYS.find((d) => isPracticeOpen(state, d.day) && !isPracticeDone(state, d.day))?.day || null;
  let currentEl = null;

  const node = (d, i) => {
    const open = isPracticeOpen(state, d.day);
    const ok = isPracticeDone(state, d.day);
    const now = d.day === current;
    const rec = practiceRec(state, d.day);
    const state_ = ok ? 'done' : now ? 'now' : open ? 'open' : 'locked';
    const el = h('div', { class: `path-stop ${state_}`, style: `--x:${WAVE[i % WAVE.length]}px` },
      now ? h('span', { class: 'path-tip' }, 'BAŞLA') : null,
      h('button', {
        class: 'path-node', onclick: () => ctx.go(`practice/${d.day}`),
        'aria-label': `Gün ${d.day} tekrarı: ${d.title}${ok ? `, tamamlandı, en iyi ${rec.best} / ${rec.total}` : open ? '' : ', kilitli'}`,
      }, ok ? icon('check') : open ? h('span', {}, d.day) : h('span', { class: 'lock' }, '🔒')),
      h('span', { class: 'path-label' }, h('b', {}, `Gün ${d.day}`), ' ', d.title),
      ok ? h('span', { class: 'path-score' }, `${rec.best} / ${rec.total}`) : null);
    if (now) currentEl = el;
    return el;
  };

  const path = h('div', { class: 'path' }, WEEKS.map((w) => [
    h('div', { class: 'path-week' }, h('span', {}, `${w.week}. hafta`), h('strong', {}, w.title)),
    ...DAYS.filter((d) => d.week === w.week).map((d, i) => node(d, i)),
  ]).flat());

  if (currentEl) setTimeout(() => currentEl.scrollIntoView({ block: 'center', behavior: 'smooth' }), 120);

  return h('div', { class: 'screen' },
    topbar({ subtitle: 'Tekrar yolu' }),
    h('section', { class: 'card practice-hero stack' },
      h('div', { class: 'row between' }, h('p', { class: 'eyebrow' }, 'Tekrar yolu'), h('span', { class: 'chip glass-dark' }, `${done} / ${TOTAL_DAYS}`)),
      h('h2', {}, done === TOTAL_DAYS ? 'Yolun sonuna geldin! 🏆' : 'Her gün, 30 soruluk tekrar'),
      h('p', { class: 'small' }, `Programda bitirdiğin günün durağı açılır. ${SESSION_SIZE} soru: kaydır, seç, eşleştir, yaz. İlk bitirişte doğru sayın + ${COMPLETE_BONUS} XP; tekrar oynamak serbest ama XP vermez.`),
      h('div', { class: 'bar light' }, h('i', { style: `width:${Math.round((done / TOTAL_DAYS) * 100)}%` })),
      current ? h('button', { class: 'btn mission-cta', onclick: () => ctx.go(`practice/${current}`) },
        icon('repeat'), h('span', { class: 'grow cta-text' }, h('span', {}, `Gün ${current} tekrarı`), h('span', { class: 'sub' }, `${SESSION_SIZE} soru · ~6 dk`)), icon('arrow')) : null),
    path);
}
