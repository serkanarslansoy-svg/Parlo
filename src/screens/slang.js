import { h, icon } from '../lib/dom.js';
import slang from '../content/slang.json';
import { shuffle } from '../lib/answer.js';
import { topbar } from '../ui.js';

// Sokak dili: argo ve küfürleri ANLAMAK için. XP vermez; her oyuncu için ayrı 18+ onayı ister.
export const LEVELS = {
  1: { label: 'herkesin yanında', short: 'Rahat' },
  2: { label: 'arkadaş arasında', short: 'Samimi' },
  3: { label: 'kaba · işte ve çocuk yanında olmaz', short: 'Kaba' },
  4: { label: 'ağır hakaret · kavga çıkarır', short: 'Ağır' },
  5: { label: 'asla kullanma', short: 'Asla' },
};
const unitOf = (n) => slang.find((u) => u.unit === Number(n));
const maxLevel = (u) => Math.max(...u.items.map((i) => i.level));
let openItem = null;

export const levelBadge = (level) => h('span', { class: `lvl lvl-${level}`, title: LEVELS[level].label }, h('b', {}, level), LEVELS[level].short);

/** 18+ onayı alınmamışsa uyarı ekranı döndürür. */
function gate(ctx) {
  if (ctx.state.settings?.adult) return null;
  return h('div', { class: 'screen' }, topbar({ subtitle: 'Sokak dili' }),
    h('section', { class: 'card stack slang-gate' },
      h('p', { style: 'font-size:40px' }, '🔞'),
      h('h2', {}, 'Bu bölüm küfür ve hakaret içerir'),
      h('p', {}, 'Sokakta, işte, maçta duyduğun argo ve küfürleri anlamak, ne kadar ağır olduklarını bilmek ve sana söylendiğinde doğru tepki vermek için. Sansürsüzdür.'),
      h('p', { class: 'small muted' }, 'Bu onay sadece bu oyuncu için geçerli; aynı telefondaki diğer oyuncular (örneğin çocuklar) ayrıca onaylamadıkça görmez.'),
      h('button', { class: 'btn block', onclick: () => { ctx.state.settings = { ...ctx.state.settings, adult: true }; ctx.persist(); ctx.refresh(); } }, '18 yaşından büyüğüm, göster'),
      h('button', { class: 'btn ghost block', onclick: () => ctx.go('scenes') }, 'Vazgeç')));
}

/** Senaryolar ekranındaki giriş kartı. */
export function slangEntry(ctx) {
  return h('button', { class: 'card slang-entry', onclick: () => ctx.go('slang') },
    h('span', { class: 'se-icon', 'aria-hidden': 'true' }, '🗯️'),
    h('span', { class: 'grow' },
      h('span', { class: 'se-title' }, 'Sokak dili', h('span', { class: 'chip terra' }, '18+')),
      h('span', { class: 'small muted' }, `Argo, küfür ve hakaretleri anla; doğru tepki ver. ${slang.length} ünite.`)),
    icon('chevron'));
}

export function renderSlang(ctx, param, query) {
  const g = gate(ctx);
  if (g) return g;
  if (param && query?.get('quiz')) return renderQuiz(ctx, unitOf(param));
  if (param) return renderUnit(ctx, unitOf(param));
  return h('div', { class: 'screen' }, topbar({ subtitle: 'Sokak dili' }),
    h('section', {},
      h('p', { class: 'eyebrow terra row' }, h('i', { class: 'dot' }), '18+ · XP vermez'),
      h('h1', {}, 'Sokak dili'),
      h('p', { class: 'muted', style: 'margin-top:6px' }, 'Amaç küfretmeyi öğrenmek değil: duyduğunu anlamak, ne kadar ağır olduğunu bilmek ve sakin, net tepki vermek.')),
    h('section', { class: 'card stack' },
      h('p', { class: 'eyebrow' }, 'Ağırlık ölçüsü'),
      ...Object.keys(LEVELS).map((l) => h('div', { class: 'row small' }, levelBadge(Number(l)), h('span', {}, LEVELS[l].label)))),
    ...slang.map((u) => h('button', { class: 'card unit-card', onclick: () => ctx.go(`slang/${u.unit}`) },
      h('span', { class: 'unit-n' }, u.unit),
      h('span', { class: 'grow' }, h('span', { class: 'se-title' }, u.title), h('span', { class: 'small muted' }, `${u.items.length} ifade · ${u.exercises.length} alıştırma`)),
      levelBadge(maxLevel(u)))),
    h('button', { class: 'btn ghost block', onclick: () => { ctx.state.settings = { ...ctx.state.settings, adult: false }; ctx.persist(); ctx.go('scenes'); } }, 'Bu bölümü bu oyuncu için gizle'));
}

function itemCard(it, redraw) {
  const isOpen = openItem === it.id;
  return h('article', { class: `card slang-item ${isOpen ? 'open' : ''}` },
    h('button', { class: 'si-head', 'aria-expanded': String(isOpen), onclick: () => { openItem = isOpen ? null : it.id; redraw(); } },
      h('span', { class: 'grow' }, h('span', { class: 'si-it', lang: 'it' }, it.it), h('span', { class: 'small muted' }, it.tr_equivalent)),
      levelBadge(it.level)),
    isOpen ? h('div', { class: 'stack si-body' },
      h('p', { class: 'small' }, h('strong', {}, 'Anlamı: '), it.meaning),
      it.literal ? h('p', { class: 'small muted' }, h('strong', {}, 'Kelimesi kelimesine: '), it.literal) : null,
      h('p', { class: 'small' }, it.context),
      h('div', { class: 'row small chip-wrap' }, h('span', { class: `chip ${it.level >= 3 ? 'terra' : 'green'}` }, `Kullanabilir miyim? ${it.can_i_use}`), it.region ? h('span', { class: 'chip' }, it.region) : null),
      it.example?.length ? h('div', { class: 'si-dialog' }, it.example.map((l) => h('p', {}, h('b', {}, `${l.who}: `), h('span', { lang: 'it' }, l.it), h('br'), h('span', { class: 'muted small' }, l.tr)))) : null,
      it.polite_alternative ? h('p', { class: 'small si-alt' }, h('strong', {}, 'Kibar hâli: '), h('span', { lang: 'it' }, it.polite_alternative.it), ` (${it.polite_alternative.tr})`) : null,
      it.how_to_respond ? h('div', { class: 'note-card card small' }, h('strong', {}, 'Sana söylenirse: '), it.how_to_respond) : null,
      it.where_to_report ? h('p', { class: 'small' }, h('strong', {}, 'Nereye başvurulur: '), it.where_to_report) : null) : null);
}

function renderUnit(ctx, u) {
  if (!u) { ctx.go('slang'); return h('div'); }
  const list = h('div', { class: 'stack' });
  const draw = () => list.replaceChildren(...u.items.map((it) => itemCard(it, draw)));
  draw();
  return h('div', { class: 'screen' }, topbar({ subtitle: 'Sokak dili' }),
    h('button', { class: 'link row', onclick: () => ctx.go('slang') }, icon('back'), 'Tüm üniteler'),
    h('section', {}, h('p', { class: 'eyebrow' }, `Ünite ${u.unit}`), h('h1', {}, u.title), h('p', { class: 'muted', style: 'margin-top:6px' }, u.intro)),
    list,
    u.mistakes?.length ? h('section', { class: 'card note-card stack' }, h('p', { class: 'eyebrow' }, 'Sık yapılan hatalar'), h('ul', { class: 'mistake-list' }, u.mistakes.map((m) => h('li', { class: 'small' }, m)))) : null,
    u.culture ? h('section', { class: 'card culture-mini stack' }, h('p', { class: 'eyebrow' }, 'Kültür notu'), h('p', { class: 'small' }, u.culture)) : null,
    u.gate ? h('section', { class: 'card gate stack' }, h('p', { class: 'eyebrow' }, 'Hedef'), h('p', { class: 'small' }, u.gate)) : null,
    u.gestures?.length ? h('section', { class: 'stack' }, h('h2', {}, 'Jestler'), ...u.gestures.map((g) => h('div', { class: 'card stack' }, h('div', { class: 'row between' }, h('strong', { lang: 'it' }, g.name), levelBadge(g.level)), h('p', { class: 'small' }, g.how), h('p', { class: 'small muted' }, g.meaning)))) : null,
    u.exercises.length ? h('button', { class: 'btn block', onclick: () => ctx.go(`slang/${u.unit}?quiz=1`) }, `Alıştırma · ${u.exercises.length} soru`, icon('arrow')) : null);
}

function renderQuiz(ctx, u) {
  if (!u) { ctx.go('slang'); return h('div'); }
  const qs = shuffle(u.exercises);
  let pos = 0;
  let ok = 0;
  let graded = 0;
  const counter = h('span', { class: 'chip' });
  const body = h('div', { class: 'stack' });
  const next = () => { pos += 1; if (pos < qs.length) show(); else finish(); };
  const done = h('button', { class: 'btn block', onclick: next }, 'Devam et', icon('arrow'));

  function show() {
    const q = qs[pos];
    counter.textContent = `${pos + 1} / ${qs.length}`;
    const fb = h('div', { 'aria-live': 'polite' });
    const answer = (good, text) => { graded += 1; if (good) ok += 1; fb.replaceChildren(h('div', { class: `feedback ${good ? 'good' : 'bad'} stack` }, h('p', { class: 'title' }, good ? 'Doğru ✓' : 'Değil'), text ? h('p', { class: 'small' }, text) : null), done); };
    if (q.type === 'level') {
      const item = u.items.find((i) => i.it.replace(/[!.?]/g, '').startsWith(q.it.replace(/[!.?]/g, '')));
      const btns = h('div', { class: 'lvl-pick' }, [1, 2, 3, 4, 5].map((l) => h('button', { class: `lvl lvl-${l}`, onclick: (e) => {
        for (const b of btns.children) b.disabled = true;
        e.currentTarget.classList.add('picked');
        answer(l === q.answer, `Doğrusu ${q.answer}: ${LEVELS[q.answer].label}.${item ? ` ${item.meaning}` : ''}`);
      } }, h('b', {}, l), LEVELS[l].short)));
      body.replaceChildren(h('section', { class: 'card stack' }, h('p', { class: 'eyebrow' }, 'Ne kadar ağır?'), h('p', { class: 'prompt', lang: 'it' }, q.it)), btns, fb);
    } else if (q.type === 'meaning') {
      const list = h('div', { class: 'stack' }, q.options.map((o, i) => h('button', { class: 'opt', onclick: (e) => {
        for (const b of list.children) { b.disabled = true; }
        list.children[q.answer].classList.add('right');
        if (i !== q.answer) e.currentTarget.classList.add('wrong');
        answer(i === q.answer);
      } }, o)));
      body.replaceChildren(h('section', { class: 'card stack' }, h('p', { class: 'eyebrow' }, 'Ne demek istedi?'), h('div', { class: 'si-dialog' }, q.dialog.map((l) => h('p', {}, h('b', {}, `${l.who}: `), h('span', { lang: 'it' }, l.it))))), list, fb);
    } else {
      const reveal = h('button', { class: 'btn secondary block', onclick: () => {
        reveal.replaceWith(h('div', { class: 'stack' }, q.answers.map((a) => h('div', { class: 'card row', style: 'padding:12px 14px' }, h('p', { class: 'grow' }, h('span', { lang: 'it' }, a.it), h('br'), h('span', { class: 'small muted' }, a.tr)))), done));
      } }, 'Önce kendin düşün, sonra cevapları göster');
      body.replaceChildren(h('section', { class: 'card stack' }, h('p', { class: 'eyebrow' }, 'Nasıl cevap verirsin?'), h('p', {}, q.situation)), reveal);
    }
    window.scrollTo(0, 0);
  }
  function finish() {
    counter.textContent = 'Bitti';
    body.replaceChildren(h('section', { class: 'card done-card stack' }, h('p', { style: 'font-size:36px' }, '🧠'), h('h2', {}, graded ? `${ok} / ${graded} doğru` : 'Tamam'), h('p', { class: 'small muted' }, 'Bu bölüm XP vermez; amaç duyduğunu anlamak.')),
      h('button', { class: 'btn block', onclick: () => ctx.refresh() }, icon('repeat'), 'Yeniden'),
      h('button', { class: 'btn ghost block', onclick: () => ctx.go(`slang/${u.unit}`) }, 'Üniteye dön'));
  }
  show();
  return h('div', { class: 'screen' },
    h('header', { class: 'topbar' }, h('div', { class: 'row grow' }, h('button', { class: 'icon-btn plain', 'aria-label': 'Geri', onclick: () => ctx.go(`slang/${u.unit}`) }, icon('back')), h('div', {}, h('p', { class: 'small muted' }, `Sokak dili · Ünite ${u.unit}`), h('h3', {}, 'Alıştırma'))), counter),
    body);
}
