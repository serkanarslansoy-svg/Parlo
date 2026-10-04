import { h, icon } from '../lib/dom.js';
import { cards, patternById } from '../content/index.js';
import { speak } from '../lib/speech.js';
import { sayPanel } from './say.js';
import { award, POINTS } from '../lib/points.js';
import { dayPlan, completeStep, enrollCards } from '../lib/program.js';
import { today } from '../lib/store.js';
import { speakBtn } from '../ui.js';

/** 2. adım: günün yeni cümleleri. Her cümle okunur ve yazarak tekrar edilir. */
export function renderLearn(ctx, param) {
  const n = Number(param);
  const plan = dayPlan(n);
  if (!plan) { ctx.go('program'); return h('div'); }
  const ids = plan.learn;
  const back = () => ctx.go(`day/${n}`);
  const slow = () => Boolean(ctx.state.settings?.slow);

  const finish = () => {
    const t = today();
    enrollCards(ctx.state, ids, t);
    const xp = award(ctx.state, ids.length * POINTS.learnCard, t);
    const { bonus } = completeStep(ctx.state, n, 'learn', t);
    ctx.persist();
    ctx.flash = ids.length
      ? `${ids.length} yeni cümle öğrendin · +${xp + bonus} XP. Yarın tekrar adımında karşına çıkacaklar.`
      : 'Yeni kalıp adımı tamam.';
    back();
  };

  const header = (sub) => h('header', { class: 'topbar' },
    h('div', { class: 'row grow' },
      h('button', { class: 'icon-btn plain', 'aria-label': 'Geri', onclick: back }, icon('back')),
      h('div', {}, h('p', { class: 'small muted' }, `Gün ${n} · 2. adım`), h('h3', {}, 'Yeni kalıp'))),
    sub);

  if (!ids.length) {
    return h('div', { class: 'screen full' }, header(null),
      h('div', { class: 'card empty stack' }, h('p', { style: 'font-size:40px' }, '💬'), h('h2', {}, 'Bugün yeni cümle yok'),
        h('p', {}, 'Bugün bildiklerinle konuşacaksın. Doğrudan konuşma adımına geç.'),
        h('button', { class: 'btn block', onclick: finish }, 'Devam et', icon('arrow'))));
  }

  let pos = 0;
  const counter = h('span', { class: 'chip' });
  const segments = h('div', { class: 'segments', style: `grid-template-columns:repeat(${ids.length},1fr)` });
  const body = h('div', { class: 'stack' });

  function show() {
    const card = cards[ids[pos]];
    const pattern = card.pattern ? patternById(card.pattern) : null;
    counter.textContent = `${pos + 1} / ${ids.length}`;
    segments.replaceChildren(...ids.map((_, i) => h('i', { class: i < pos ? 'on' : '' })));
    const nextBtn = h('button', { class: 'btn block', disabled: true, onclick: () => { pos += 1; if (pos < ids.length) show(); else finish(); } },
      pos + 1 < ids.length ? 'Sonraki cümle' : 'Bitir', icon('arrow'));
    body.replaceChildren(
      h('section', { class: 'card learn-card stack' },
        h('div', { class: 'row between' },
          pattern ? h('span', { class: 'chip green' }, `${pattern.head} ${pattern.slot}`.trim()) : h('span', { class: 'chip' }, 'Günlük ifade'),
          h('span', { class: 'row' }, speakBtn(card.it), speakBtn(card.it, { slow: true, label: 'Yavaş dinle' }))),
        h('p', { class: 'learn-it', lang: 'it' }, card.it),
        h('p', { class: 'muted' }, card.tr),
        pattern ? h('p', { class: 'small muted' }, `LEGO: ${pattern.head} ${pattern.slot} → ${pattern.tr}. ${pattern.note}`) : null),
      sayPanel(card, () => { nextBtn.disabled = false; }),
      nextBtn);
    setTimeout(() => speak(card.it, { slow: slow() }), 250);
    window.scrollTo(0, 0);
  }

  show();
  return h('div', { class: 'screen full' },
    header(counter),
    segments,
    plan.words ? h('section', { class: 'card cream stack' }, h('p', { class: 'eyebrow' }, 'Bugünün kelimeleri'), h('p', { class: 'small', lang: 'it' }, plan.words)) : null,
    body);
}
