import { h, icon } from '../lib/dom.js';
import { dailyScene, tips, allCardIds } from '../content/index.js';
import { today, streak, isActiveDay } from '../lib/store.js';
import { addDays, isDue } from '../lib/srs.js';
import { topbar, speakBtn, greeting, levelChip } from '../ui.js';

const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export function dueCount(state, t = today()) {
  return Object.entries(state.cards).filter(([id, c]) => allCardIds.includes(id) && isDue(c, t)).length;
}

export function dailyStatus(state, t = today()) {
  const scene = dailyScene(t);
  const day = state.days[t] || { review: 0, scenes: [] };
  return { scene, reviewDone: Boolean(day.dailyReview), chatDone: day.scenes.includes(scene.id) };
}

function nameCard(ctx) {
  const input = h('input', { class: 'input', placeholder: 'Adın (örn. Serkan)', maxlength: 30, autocomplete: 'given-name', 'aria-label': 'Adın' });
  const saveName = () => {
    const v = input.value.trim();
    if (!v) return input.focus();
    ctx.state.name = v;
    ctx.persist();
    ctx.refresh();
  };
  input.addEventListener('keydown', (e) => e.key === 'Enter' && saveName());
  return h('section', { class: 'card sun stack' },
    h('h3', {}, 'Benvenuto! Sana nasıl hitap edelim?'),
    h('p', { class: 'small muted' }, 'Adın sadece bu cihazda saklanır.'),
    h('div', { class: 'row' }, input, h('button', { class: 'btn small', onclick: saveName }, 'Kaydet')));
}

function missionCard(ctx) {
  const { scene, reviewDone, chatDone } = dailyStatus(ctx.state);
  const firstLine = scene.nodes[scene.start].intents[0].model;
  const step = (done, label, ico) => h('div', { class: `step ${done ? 'done' : ''}` }, icon(done ? 'check' : ico), label);

  let cta;
  if (!reviewDone) cta = h('button', { class: 'btn block', onclick: () => ctx.go('review?daily=1') }, 'Derse başla', icon('arrow'));
  else if (!chatDone) cta = h('button', { class: 'btn block', onclick: () => ctx.go(`chat/${scene.id}?daily=1`) }, icon('mic'), `${scene.persona.name} ile konuş`, icon('arrow'));
  else cta = h('button', { class: 'btn soft block', onclick: () => ctx.go(`chat/${scene.id}`) }, icon('check'), 'Bugünlük tamam · Tekrar oyna');

  return h('article', { class: 'card mission' },
    h('div', { class: `art art-${scene.cat}`, 'aria-hidden': 'true' }, scene.emoji),
    h('div', { class: 'body stack' },
      h('div', { class: 'row between' }, h('span', { class: 'eyebrow' }, `Günün senaryosu · ~${scene.minutes + 3} dk`), levelChip(scene.level)),
      h('h2', {}, `${scene.tr}: ${scene.it}`),
      h('div', { class: 'row' }, h('p', { class: 'quote grow' }, `«${firstLine}»`), speakBtn(firstLine)),
      h('p', { class: 'small muted' }, scene.desc),
      h('div', { class: 'steps' }, step(reviewDone, 'Hızlı tekrar', 'repeat'), step(chatDone, 'Sohbet', 'mic')),
      cta));
}

function toolsSection(ctx) {
  const due = dueCount(ctx.state);
  const known = Object.keys(ctx.state.cards).length;
  const tool = (badgeCls, ico, title, sub, onclick) =>
    h('button', { class: 'card tool', onclick },
      h('span', { class: `badge ${badgeCls}` }, icon(ico)),
      h('span', { class: 'grow' }, h('h3', {}, title), h('span', { class: 'small muted' }, sub)),
      icon('chevron', 'chev'));
  return h('section', { class: 'stack' },
    h('h2', {}, 'Hızlı pratik'),
    tool('', 'repeat', 'Tekrar kutusu', due ? `${due} cümlenin tekrar zamanı geldi` : 'Bugün tekrar edilecek cümle yok', () => due ? ctx.go('review?mode=due') : ctx.go('notebook')),
    tool('sun', 'book', 'Cümlelerim', known ? `${known} cümle öğrenmeye başladın` : 'Kalıplar ve kendi cümlelerin', () => ctx.go('notebook')));
}

function weekSection(state) {
  const t = today();
  const [y, m, d] = t.split('-').map(Number);
  const offset = (new Date(y, m - 1, d).getDay() + 6) % 7; // Pazartesi = 0
  const monday = addDays(t, -offset);
  const days = WEEKDAYS.map((label, i) => {
    const key = addDays(monday, i);
    return { label, key, on: isActiveDay(state, key), isToday: key === t };
  });
  const count = days.filter((x) => x.on).length;
  return h('section', { class: 'card stack' },
    h('div', { class: 'row between' }, h('h3', {}, 'Bu hafta'), h('span', { class: 'small muted' }, `${count} / 7 gün`)),
    h('div', { class: 'week' },
      days.map((x) => h('div', {}, h('span', {}, x.label),
        h('i', { class: `${x.on ? 'on' : ''} ${x.isToday ? 'today' : ''}`, 'aria-label': `${x.label}: ${x.on ? 'pratik yapıldı' : 'pratik yok'}` }, x.on ? icon('check') : '')))));
}

function tipCard() {
  const t = today();
  const [y, m, d] = t.split('-').map(Number);
  const tip = tips[Math.floor(Date.UTC(y, m - 1, d) / 86400000) % tips.length];
  return h('section', { class: 'card terra stack' },
    h('div', { class: 'row between' }, h('span', { class: 'chip terra' }, icon('bulb'), tip.tag), speakBtn(tip.it)),
    h('p', { class: 'it' }, `«${tip.it}»`),
    h('p', { class: 'small' }, tip.text));
}

export function renderHome(ctx) {
  const { state } = ctx;
  const s = streak(state);
  return h('div', { class: 'screen' },
    topbar({ subtitle: 'Bugün', right: s ? h('span', { class: 'chip terra' }, icon('flame'), `${s} gün`) : null }),
    state.name ? null : nameCard(ctx),
    h('section', { class: 'greet' },
      h('h1', {}, `${greeting()}${state.name ? `, ${state.name}` : ''}!`),
      h('p', { class: 'muted' }, 'Bugün biraz İtalyanca konuşalım mı?')),
    missionCard(ctx),
    toolsSection(ctx),
    weekSection(state),
    tipCard());
}
