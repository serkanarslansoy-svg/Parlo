import { h, icon } from '../lib/dom.js';
import { patterns, PATTERN_CATS, cardsOfPattern } from '../content/index.js';
import { mastery } from '../lib/srs.js';
import { norm } from '../lib/answer.js';
import { topbar, speakBtn, dots, masteryLabel } from '../ui.js';

let cat = 'all';
let search = '';
const open = new Set();

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
        h('button', { class: 'icon-btn plain', 'aria-label': `Sil: ${p.it}`, onclick: () => {
          if (!confirm('Bu cümle silinsin mi?')) return;
          ctx.state.personal = items.filter((x) => x.id !== p.id);
          ctx.persist();
          draw();
        } }, icon('trash')))))
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

export function renderNotebook(ctx) {
  const { state } = ctx;
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

  const strong = patterns.filter((p) => patternMastery(state, p) >= 60).length;
  return h('div', { class: 'screen' },
    topbar({ subtitle: 'Cümlelerim' }),
    h('section', {},
      h('p', { class: 'eyebrow' }, 'Kişisel arşiv'),
      h('h1', {}, 'Kalıp defterim'),
      h('p', { class: 'muted', style: 'margin-top:6px' }, 'Bir kalıp, onlarca cümle. Kalıbı öğren, boşluğa kendi kelimeni koy.')),
    h('div', { class: 'row' }, h('span', { class: 'chip green' }, `${patterns.length} kalıp`), h('span', { class: 'chip sun' }, `${strong} tanesinde ustasın`)),
    searchEl,
    chipsEl,
    list,
    personalSection(ctx));
}
