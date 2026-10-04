import { h, icon } from '../lib/dom.js';
import { dailyScene, tips, scenes, cards, allCardIds, patternById, CATEGORIES } from '../content/index.js';
import { today, streak } from '../lib/store.js';
import { isDue } from '../lib/srs.js';
import { topbar, speakBtn, greeting } from '../ui.js';

const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

export function dueCount(state, t = today()) {
  return Object.entries(state.cards).filter(([id, c]) => allCardIds.includes(id) && isDue(c, t)).length;
}

export function dailyStatus(state, t = today()) {
  const scene = dailyScene(t);
  const day = state.days[t] || { review: 0, scenes: [] };
  return { scene, reviewDone: Boolean(day.dailyReview), chatDone: day.scenes.includes(scene.id) };
}

const dayNumber = (t) => {
  const [y, m, d] = t.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
};

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
  const cat = CATEGORIES.find((c) => c.id === scene.cat);
  const fresh = scene.cards.filter((id) => !ctx.state.cards[id]).length;
  const go = !reviewDone ? 'review?daily=1' : `chat/${scene.id}${chatDone ? '' : '?daily=1'}`;
  const [label, sub] = !reviewDone
    ? ['Derse başla', 'Önce 2 dk tekrar']
    : !chatDone ? ['Simülasyona başla', `${scene.persona.name} hazır`] : ['Tekrar oyna', 'Bugünlük tamam ✓'];

  return h('article', { class: 'card mission' },
    h('div', { class: `art art-${scene.cat}` },
      h('span', { class: 'emoji', 'aria-hidden': 'true' }, scene.emoji),
      h('span', { class: 'chip glass top' }, icon('clock'), `Bugünün misyonu · ~${scene.minutes + 3} dk`),
      h('div', { class: 'bottom' },
        h('span', { class: 'row' }, icon(cat.icon), `${scene.it} · ${scene.level}`),
        h('span', {}, fresh ? `${fresh} yeni kalıp` : 'Tekrar turu'))),
    h('div', { class: 'body stack' },
      h('h2', {}, `${scene.tr}: ${scene.mission}`),
      h('p', { class: 'muted' }, scene.desc),
      h('div', { class: 'infobox' }, icon('bulb'),
        h('div', {},
          h('p', { class: 'small' }, h('strong', {}, `Canlı rol yapma: ${scene.persona.name}, ${scene.persona.role.toLowerCase()}`)),
          h('p', { class: 'small muted' }, scene.register === 'Lei' ? 'Kibar ve resmî hitap («Lei»).' : 'Samimi hitap («tu»).'))),
      h('div', { class: 'progress-line small muted' },
        h('span', { class: reviewDone ? 'on' : '' }, icon(reviewDone ? 'check' : 'repeat'), 'Hızlı tekrar'),
        h('span', { class: chatDone ? 'on' : '' }, icon(chatDone ? 'check' : 'mic'), 'Sohbet')),
      h('button', { class: 'btn mission-cta', onclick: () => ctx.go(go) },
        icon(reviewDone ? 'mic' : 'repeat'),
        h('span', { class: 'grow cta-text' }, h('span', {}, label), h('span', { class: 'sub' }, sub)),
        icon('arrow'))));
}

/** Tekrar zamanı gelen (yoksa en zayıf bilinen, o da yoksa bugünün) kalıbından bir örnek. */
function recallCard(ctx) {
  const t = today();
  const state = ctx.state;
  const due = dueCount(state, t);
  const known = Object.entries(state.cards).filter(([id]) => cards[id]);
  let pick;
  let title;
  if (known.length) {
    known.sort((a, b) => (isDue(b[1], t) - isDue(a[1], t)) || a[1].box - b[1].box);
    pick = cards[known[0][0]];
    title = 'Dünkü kalıpları hatırla';
  } else {
    pick = cards[dailyScene(t).key];
    title = 'Bugünün kalıbı';
  }
  const pattern = pick.pattern ? patternById(pick.pattern) : null;
  return h('section', { class: 'card cream stack' },
    h('div', { class: 'row' },
      h('span', { class: 'badge-round' }, icon('repeat')),
      h('div', { class: 'grow' }, h('h3', {}, title), h('p', { class: 'small muted' }, due ? '2 dakikalık tazeleme' : 'Dinle, sesli tekrar et')),
      due ? h('span', { class: 'chip' }, `${due} bekleyen`) : null),
    h('div', { class: 'card row', style: 'padding:14px' },
      h('div', { class: 'grow' }, h('p', { class: 'key-it', lang: 'it' }, `«${pick.it}»`), h('p', { class: 'tr' }, pick.tr)),
      speakBtn(pick.it)),
    h('div', { class: 'row between small' },
      pattern ? h('span', { class: 'row terra-text' }, icon('bulb'), `Kalıp: ${pattern.head} ${pattern.slot}`.trim()) : h('span'),
      h('button', { class: 'link row', onclick: () => ctx.go(due ? 'review?mode=due' : 'notebook') }, due ? 'Tekrar et' : 'Tümünü gör', icon('chevron'))));
}

function scenesStrip(ctx) {
  const daily = dailyScene(today());
  const start = scenes.indexOf(daily);
  const ordered = [...scenes.slice(start + 1), ...scenes.slice(0, start)];
  return h('section', { class: 'stack' },
    h('div', { class: 'section-head' },
      h('div', {}, h('h2', {}, 'Hayattan gerçek senaryolar'), h('p', { class: 'small muted' }, 'Bugün nerede konuşmak istersin?')),
      h('button', { class: 'link row', onclick: () => ctx.go('scenes') }, 'Katalog', icon('arrow'))),
    h('div', { class: 'strip' }, ordered.map((s) => {
      const cat = CATEGORIES.find((c) => c.id === s.cat);
      const done = ctx.state.scenes[s.id]?.runs;
      return h('button', { class: 'card strip-card', onclick: () => ctx.go(`chat/${s.id}`) },
        h('span', { class: `thumb art-${s.cat}` },
          h('span', { class: 'chip glass tag' }, cat.label),
          h('span', { 'aria-hidden': 'true' }, s.emoji),
          h('span', { class: 'chip dark time' }, `${s.minutes} dk`)),
        h('span', { class: 'body' },
          h('span', { class: 'title' }, `${s.tr} · ${s.it}`),
          h('span', { class: 'desc' }, s.desc),
          h('span', { class: 'row between meta' }, h('span', {}, done ? '✓ Tamamlandı' : `${s.level} · ${s.persona.name}`), icon('chevron'))));
    })));
}

function cultureCard(ctx) {
  const tip = tips[dayNumber(today()) % tips.length];
  const saved = () => (ctx.state.personal || []).some((p) => p.it === tip.it);
  const saveBtn = h('button', { class: 'link row', 'aria-pressed': String(saved()), onclick: () => {
    if (saved()) return;
    ctx.state.personal = [{ id: Date.now().toString(36), it: tip.it, note: tip.title, date: new Date().toISOString() }, ...(ctx.state.personal || [])];
    ctx.persist();
    saveBtn.replaceChildren(icon('check'), 'Kaydedildi');
    saveBtn.setAttribute('aria-pressed', 'true');
  } }, icon(saved() ? 'check' : 'star'), saved() ? 'Kaydedildi' : 'Kaydet');
  return h('section', { class: 'card culture stack' },
    h('span', { class: 'deco', 'aria-hidden': 'true' }, '☕'),
    h('div', { class: 'row' }, h('span', { class: 'chip solid-terra' }, 'Kültür aynası'), h('span', { class: 'small muted' }, tip.tag)),
    h('h2', {}, tip.title),
    h('p', {}, tip.text),
    h('div', { class: 'row example' }, h('p', { class: 'it grow', lang: 'it' }, `«${tip.it}»`), speakBtn(tip.it)),
    h('div', { class: 'row between small' }, h('span', { class: 'row muted' }, icon('book'), 'PARLO editoryal notu'), saveBtn));
}

export function renderHome(ctx) {
  const { state } = ctx;
  const s = streak(state);
  const now = new Date();
  return h('div', { class: 'screen' },
    topbar({ subtitle: 'Bugün' }),
    state.name ? null : nameCard(ctx),
    h('section', { class: 'greet' },
      h('div', { class: 'row between' },
        h('span', { class: 'eyebrow terra row' }, h('i', { class: 'dot' }), `${now.getDate()} ${MONTHS[now.getMonth()]}, ${DAYS[now.getDay()]}`),
        s ? h('span', { class: 'chip terra' }, icon('flame'), `${s} gün kesintisiz pratik`) : null),
      h('h1', {}, `${greeting(now)}${state.name ? `, ${state.name}` : ''}!\u00a0${now.getHours() < 14 ? '☀️' : '🌙'}`),
      h('p', { class: 'muted' }, 'Bugün İtalya sokaklarında kendini evinde hissetmeye hazır mısın?')),
    missionCard(ctx),
    recallCard(ctx),
    scenesStrip(ctx),
    cultureCard(ctx),
    h('footer', { class: 'proverb' },
      h('p', { lang: 'it' }, '«Chi parla due lingue vive due vite.»'),
      h('p', { class: 'small' }, 'İki dil konuşan, iki hayat yaşar.')));
}
