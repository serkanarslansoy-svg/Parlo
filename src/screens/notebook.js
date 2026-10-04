import { h, icon } from '../lib/dom.js';
import { patterns, PATTERN_CATS, cardsOfPattern } from '../content/index.js';
import { mastery } from '../lib/srs.js';
import { norm } from '../lib/answer.js';
import { topbar, speakBtn, dots, masteryLabel } from '../ui.js';
import { confirmButton } from '../ui.js';
import { cards } from '../content/index.js';
import { MODES, unlockedDays, strength } from '../lib/practice.js';
import { DAYS, currentDay } from '../lib/program.js';

let cat = 'all';
let search = '';
const open = new Set();
const openDays = new Set();
let showGuide = false;

function patternMastery(state, p) {
  const cs = cardsOfPattern(p.id);
  if (!cs.length) return 0;
  return Math.round(cs.reduce((sum, c) => sum + mastery(state.cards[c.id]), 0) / cs.length);
}

function example(card) {
  return h('div', { class: 'example' },
    h('div', { class: 'grow' }, h('p', { class: 'it', lang: 'it' }, card.it), h('p', { class: 'tr' }, card.tr)),
    speakBtn(card.it));
}

function patternCard(state, p, redraw) {
  const cs = cardsOfPattern(p.id);
  const pct = patternMastery(state, p);
  const isOpen = open.has(p.id);
  const started = cs.some((c) => state.cards[c.id]);
  return h('article', { class: 'card stack' },
    h('div', { class: 'pattern-head' }, h('span', { class: 'head', lang: 'it' }, p.head), p.slot ? h('span', { class: 'slot' }, p.slot) : null),
    h('p', { class: 'small' }, h('strong', {}, p.tr)),
    cs[0] ? example(cs[0]) : null,
    isOpen ? h('div', {}, cs.slice(1).map(example), h('p', { class: 'small muted', style: 'margin-top:10px' }, p.note)) : null,
    h('div', { class: 'row between' },
      h('span', { class: 'row small' }, dots(pct), h('span', { class: 'muted' }, started ? `${masteryLabel(pct)} · %${pct}` : 'Henüz başlamadın')),
      h('button', { class: 'link row', 'aria-expanded': String(isOpen), onclick: () => { isOpen ? open.delete(p.id) : open.add(p.id); redraw(); } },
        isOpen ? 'Kapat' : cs.length > 1 ? `+${cs.length - 1} örnek` : 'Açıklama', icon('down'))));
}

function personalSection(ctx) {
  const list = h('div', { class: 'stack' });
  const it = h('textarea', { class: 'input', rows: 2, maxlength: 200, lang: 'it', placeholder: 'İtalyanca cümle (örn. Posso lasciare la valigia qui?)', 'aria-label': 'İtalyanca cümle' });
  const note = h('input', { class: 'input', maxlength: 120, placeholder: 'Not: nerede duydun / ne demek?', 'aria-label': 'Not' });

  const draw = () => {
    const items = ctx.state.personal || [];
    list.replaceChildren(...(items.length ? items.map((p) => h('article', { class: 'card' },
      h('div', { class: 'row' },
        h('div', { class: 'grow' }, h('p', { class: 'it', lang: 'it' }, `«${p.it}»`), p.note ? h('p', { class: 'tr' }, p.note) : null),
        speakBtn(p.it),
        confirmButton({ class: 'icon-btn plain del', 'aria-label': `Sil: ${p.it}` }, icon('trash'), 'Sil?', () => {
          ctx.state.personal = items.filter((x) => x.id !== p.id);
          ctx.persist();
          draw();
        }))))
      : [h('p', { class: 'empty small' }, 'Gün içinde duyduğun ya da ihtiyaç duyduğun cümleleri buraya ekle.')]));
  };
  const add = () => {
    const v = it.value.trim();
    if (!v) return it.focus();
    ctx.state.personal = [{ id: Date.now().toString(36), it: v, note: note.value.trim(), date: new Date().toISOString() }, ...(ctx.state.personal || [])];
    ctx.persist();
    it.value = '';
    note.value = '';
    draw();
  };
  draw();
  return h('section', { class: 'stack' },
    h('div', { class: 'section-head' }, h('h2', {}, 'Benim cümlelerim')),
    h('div', { class: 'card cream stack' }, it, note, h('button', { class: 'btn block', onclick: add }, icon('plus'), 'Ekle')),
    list);
}

function practiceHub(ctx) {
  const days = unlockedDays(ctx.state);
  const ids = days.flatMap((d) => d.ids);
  const nextN = currentDay(ctx.state);
  const nextPlan = nextN ? DAYS.find((d) => d.day === nextN) : null;
  if (!ids.length) {
    return h('section', { class: 'card practice-hero locked stack' },
      h('p', { class: 'eyebrow' }, 'Pratik alanı'),
      h('h2', {}, 'Günü bitir, cümleler burada açılsın'),
      h('p', { class: 'small' }, 'Programda bitirdiğin her günün cümleleri buraya gelir. Sonra yazarak, seçerek, kaydırarak ve eşleştirerek istediğin kadar tekrar edersin.'),
      h('button', { class: 'btn block', onclick: () => ctx.go(nextN ? `day/${nextN}` : 'program') }, nextN ? `Gün ${nextN}'e git` : 'Programa git', icon('arrow')));
  }
  const avg = Math.round(ids.reduce((s, id) => s + strength(ctx.state, id), 0) / ids.length);
  const list = h('div', { class: 'stack' });
  const drawDays = () => list.replaceChildren(...days.map((d) => {
    const isOpen = openDays.has(d.day);
    const pct = Math.round(d.ids.reduce((s, id) => s + strength(ctx.state, id), 0) / d.ids.length);
    return h('article', { class: 'card day-sent' },
      h('button', { class: 'ds-head', 'aria-expanded': String(isOpen), onclick: () => { isOpen ? openDays.delete(d.day) : openDays.add(d.day); drawDays(); } },
        h('span', { class: 'ds-num' }, d.day),
        h('span', { class: 'grow' }, h('span', { class: 'ds-title' }, d.title), h('span', { class: 'ds-sub' }, `${d.ids.length} cümle · %${pct}`)),
        dots(pct), icon('down', isOpen ? 'flip' : '')),
      isOpen ? h('div', { class: 'stack sent-list' }, d.ids.map((id) => h('div', { class: 'row sent' },
        h('div', { class: 'grow' }, h('p', { class: 'it', lang: 'it' }, cards[id].it), h('p', { class: 'tr' }, cards[id].tr)),
        dots(strength(ctx.state, id))))) : null);
  }));
  drawDays();
  return h('div', { class: 'stack' },
    h('section', { class: 'card practice-hero stack' },
      h('div', { class: 'row between' }, h('p', { class: 'eyebrow' }, 'Pratik alanı'), h('span', { class: 'chip glass-dark' }, `${ids.length} cümle açık`)),
      h('h2', {}, 'Bıkana kadar tekrar'),
      h('p', { class: 'small' }, `Bitirdiğin ${days.length} günün cümleleri. Zorlandıkların daha sık gelir. Ortalama: %${avg}`),
      h('button', { class: 'btn mission-cta', onclick: () => ctx.go('practice/mix') },
        icon('shuffle'), h('span', { class: 'grow cta-text' }, h('span', {}, 'Karışık tur'), h('span', { class: 'sub' }, '10 soru · yazmalı, seçmeli, kaydırmalı')), icon('arrow'))),
    h('div', { class: 'mode-grid' }, MODES.map((m) => h('button', { class: 'card mode-tile', onclick: () => ctx.go(`practice/${m.id}`) },
      h('span', { class: 'badge-round' }, icon(m.icon)), h('span', { class: 'mt-title' }, m.label), h('span', { class: 'mt-desc' }, m.desc)))),
    h('div', { class: 'section-head' }, h('h2', {}, 'Açılan günler')),
    list,
    nextPlan ? h('button', { class: 'card locked-day row', onclick: () => ctx.go(`day/${nextN}`) },
      h('span', { class: 'ds-num' }, '🔒'),
      h('span', { class: 'grow small' }, h('strong', {}, `Gün ${nextN} · ${nextPlan.title}`), h('br'), `Bitirince ${nextPlan.learn.length} yeni cümle açılır`),
      icon('chevron')) : null);
}

function patternGuide(ctx) {
  const { state } = ctx;
  if (!showGuide) {
    return h('button', { class: 'btn ghost block', onclick: () => { showGuide = true; ctx.refresh(); } }, icon('book'), `Kalıp rehberi (${patterns.length} kalıp)`);
  }
  const list = h('div', { class: 'stack' });
  const chipsEl = h('div', { class: 'chips', role: 'group', 'aria-label': 'Kalıp türü' });
  const searchEl = h('input', { class: 'input', type: 'search', placeholder: 'Kalıp veya anlam ara (örn. posso, nerede)', value: search, 'aria-label': 'Kalıp ara' });
  const draw = () => {
    const q = norm(search);
    const items = patterns.filter((p) => (cat === 'all' || p.cat === cat)
      && (!q || norm(`${p.head} ${p.tr} ${cardsOfPattern(p.id).map((c) => `${c.it} ${c.tr}`).join(' ')}`).includes(q)));
    list.replaceChildren(...(items.length ? items.map((p) => patternCard(state, p, draw)) : [h('p', { class: 'empty' }, 'Bu aramayla eşleşen kalıp yok.')]));
    chipsEl.replaceChildren(...[{ id: 'all', label: `Tümü (${patterns.length})` }, ...PATTERN_CATS].map((c) =>
      h('button', { class: 'chip', 'aria-pressed': String(cat === c.id), onclick: () => { cat = c.id; draw(); } }, c.label)));
  };
  searchEl.addEventListener('input', () => { search = searchEl.value; draw(); });
  draw();
  return h('section', { class: 'stack' },
    h('div', { class: 'section-head' }, h('h2', {}, 'Kalıp rehberi'), h('button', { class: 'link', onclick: () => { showGuide = false; ctx.refresh(); } }, 'Gizle')),
    h('p', { class: 'small muted' }, 'Bir kalıp, onlarca cümle. Kalıbı öğren, boşluğa kendi kelimeni koy.'),
    searchEl, chipsEl, list);
}

export function renderNotebook(ctx) {
  return h('div', { class: 'screen' },
    topbar({ subtitle: 'Cümlelerim' }),
    practiceHub(ctx),
    personalSection(ctx),
    patternGuide(ctx));
}
