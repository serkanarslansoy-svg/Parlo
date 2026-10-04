import { h, icon } from '../lib/dom.js';
import { dailyScene, tips, scenes, cards, allCardIds, patternById, CATEGORIES } from '../content/index.js';
import { today, streak } from '../lib/store.js';
import { isDue } from '../lib/srs.js';
import { award, POINTS, leaderboard, gapToNext, weekPoints, dayPoints } from '../lib/points.js';
import { stateOf } from '../lib/profiles.js';
import { tierOf, RULES } from '../lib/online.js';
import { weekKeys } from '../lib/points.js';
import { topbar, speakBtn, greeting, avatar } from '../ui.js';
import { STEPS, TOTAL_DAYS, currentDay, dayPlan, weekOf, nextStep, isStepDone, waitsForTomorrow } from '../lib/program.js';
import { stepRoute } from './day.js';

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

/** Günün dersi (tekrar + sohbet) bugün ilk kez tamamlandıysa bonus puanı verir. */
export function claimDailyBonus(state, t = today()) {
  const { reviewDone, chatDone } = dailyStatus(state, t);
  const day = state.days[t];
  if (!reviewDone || !chatDone || day.dailyBonus) return 0;
  day.dailyBonus = true;
  return award(state, POINTS.dailyDone, t);
}

const dayNumber = (t) => {
  const [y, m, d] = t.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
};

function leagueCard(ctx) {
  const t = today();
  const rows = leaderboard(ctx.db.profiles, (id) => stateOf(ctx.db, id), t, 'week');
  const me = rows.find((r) => r.profile.id === ctx.db.active);
  const gap = gapToNext(rows, ctx.db.active);
  const others = rows.length - 1;
  // Çevrim içi kademeli ligdeysek (son bilinen grup bu haftaya aitse) onu göster.
  const div = ctx.online.enabled && ctx.profile.online?.lastDivision?.week === weekKeys(t)[0] ? ctx.profile.online.lastDivision : null;
  if (div) {
    const tier = tierOf(div.tier);
    return h('button', { class: 'league-card', style: `--t:${tier.color}`, onclick: () => ctx.go('league') },
      h('div', { class: 'row' },
        avatar(ctx.profile, 52),
        h('div', { class: 'grow' },
          h('p', { class: 'eyebrow' }, `${tier.icon} ${tier.name} Ligi`),
          h('p', { class: 'lc-points' }, h('strong', {}, weekPoints(ctx.state, t)), ' XP', dayPoints(ctx.state, t) ? h('span', { class: 'today' }, `+${dayPoints(ctx.state, t)} bugün`) : null)),
        h('div', { class: 'lc-rank' }, h('strong', {}, `${div.rank}.`), h('span', {}, `/ ${div.size}`))),
      h('p', { class: 'lc-line' }, div.rank <= RULES.promote ? `Yükselme bölgesindesin! Yerini koru.` : `İlk ${RULES.promote}'ye gir, ${tierOf(div.tier + 1).name} Ligi'ne yüksel.`, icon('chevron')));
  }
  if (ctx.online.enabled && !others) {
    return h('button', { class: 'league-card', onclick: () => ctx.go('league') },
      h('div', { class: 'row' },
        avatar(ctx.profile, 52),
        h('div', { class: 'grow' },
          h('p', { class: 'eyebrow' }, 'Bu hafta'),
          h('p', { class: 'lc-points' }, h('strong', {}, weekPoints(ctx.state, t)), ' XP'))),
      h('p', { class: 'lc-line' }, weekPoints(ctx.state, t) ? 'Haftalık ligdeki yerini gör' : 'İlk dersini yap, haftalık lige katıl!', icon('chevron')));
  }
  let line;
  if (!others) line = 'Bir oyuncu daha ekle, haftalık yarış başlasın.';
  else if (gap) line = `${gap.name} seni ${gap.points - 1} XP önde. Bir senaryo bitir, yakala!`;
  else line = rows.length > 1 && rows[1].points === me.points ? 'Zirveyi paylaşıyorsun. Bir adım öne geç!' : 'Ligin lideri sensin. Yerini koru!';
  return h('button', { class: 'league-card', onclick: () => ctx.go(others ? 'league' : 'profiles') },
    h('div', { class: 'row' },
      avatar(ctx.profile, 52),
      h('div', { class: 'grow' },
        h('p', { class: 'eyebrow' }, 'Bu hafta'),
        h('p', { class: 'lc-points' }, h('strong', {}, weekPoints(ctx.state, t)), ' XP', dayPoints(ctx.state, t) ? h('span', { class: 'today' }, `+${dayPoints(ctx.state, t)} bugün`) : null)),
      h('div', { class: 'lc-rank' }, h('strong', {}, others ? `${me.rank}.` : '–'), h('span', {}, others ? `/ ${rows.length}` : 'tek oyuncu'))),
    h('div', { class: 'lc-row' },
      rows.slice(0, 5).map((r) => h('span', { class: `mini ${r.profile.id === ctx.db.active ? 'me' : ''}` }, avatar(r.profile, 28), h('b', {}, r.points)))),
    h('p', { class: 'lc-line' }, line, icon('chevron')));
}

function programCard(ctx) {
  const n = currentDay(ctx.state);
  if (!n) {
    return h('button', { class: 'card program-card done', onclick: () => ctx.go('program') },
      h('p', { class: 'eyebrow' }, '30 günlük program'), h('h2', {}, 'Tamamlandı 🏆'),
      h('p', { class: 'small' }, 'Artık serbest konuşma ve senaryolarla devam et.'));
  }
  const plan = dayPlan(n);
  const nxt = nextStep(ctx.state, n);
  const started = STEPS.some((s) => isStepDone(ctx.state, n, s.id));
  const wait = waitsForTomorrow(ctx.state, n, today());
  return h('article', { class: 'card program-card' },
    h('div', { class: 'row between' },
      h('p', { class: 'eyebrow' }, `30 günlük program · ${weekOf(n).week}. hafta`),
      h('button', { class: 'link small', onclick: () => ctx.go('program') }, 'Tüm program')),
    h('h2', {}, h('span', { class: 'day-n' }, `Gün ${n}`), h('span', { class: 'day-of' }, ` / ${TOTAL_DAYS}`), ` · ${plan.title}`),
    h('p', { class: 'small' }, plan.focus),
    h('ol', { class: 'pc-steps' }, STEPS.map((s) => h('li', { class: isStepDone(ctx.state, n, s.id) ? 'on' : nxt?.id === s.id ? 'now' : '' },
      icon(isStepDone(ctx.state, n, s.id) ? 'check' : s.icon), h('span', {}, s.label), h('small', {}, `${s.min} dk`)))),
    wait ? h('p', { class: 'small pc-note' }, 'Bugünkü günü bitirdin. Yeni gün yarın daha verimli olur.') : null,
    h('button', { class: 'btn mission-cta', onclick: () => ctx.go(wait ? `day/${n}` : stepRoute(n, nxt.id)) },
      icon(wait ? 'clock' : nxt.icon),
      h('span', { class: 'grow cta-text' },
        h('span', {}, wait ? 'Yine de devam et' : started ? `${nxt.label} adımına geç` : `Gün ${n}'e başla`),
        h('span', { class: 'sub' }, `${STEPS.reduce((a, s) => a + s.min, 0)} dakikalık 4 adım`)),
      icon('arrow')));
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
      h('div', { class: 'grow' }, h('h3', {}, title), h('p', { class: 'small muted' }, due ? '2 dakikalık tazeleme' : 'Oku, yazarak hatırla')),
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
  return h('section', { class: 'card culture stack' },
    h('span', { class: 'deco', 'aria-hidden': 'true' }, '☕'),
    h('div', { class: 'row' }, h('span', { class: 'chip solid-terra' }, 'Kültür aynası'), h('span', { class: 'small muted' }, tip.tag)),
    h('h2', {}, tip.title),
    h('p', {}, tip.text),
    h('div', { class: 'row example' }, h('p', { class: 'it grow', lang: 'it' }, `«${tip.it}»`), speakBtn(tip.it)),
    h('p', { class: 'row small muted' }, icon('book'), 'PARLO editoryal notu'));
}

export function renderHome(ctx) {
  const { state } = ctx;
  const s = streak(state);
  const now = new Date();
  return h('div', { class: 'screen' },
    topbar({ subtitle: 'Bugün' }),
    h('section', { class: 'greet' },
      h('div', { class: 'row between' },
        h('span', { class: 'eyebrow terra row' }, h('i', { class: 'dot' }), `${now.getDate()} ${MONTHS[now.getMonth()]}, ${DAYS[now.getDay()]}`),
        s ? h('span', { class: 'chip terra' }, icon('flame'), `${s} gün kesintisiz pratik`) : null),
      h('h1', {}, `${greeting(now)}, ${ctx.profile.name}!\u00a0${now.getHours() < 14 ? '☀️' : '🌙'}`)),
    leagueCard(ctx),
    programCard(ctx),
    currentDay(state) ? null : missionCard(ctx),
    recallCard(ctx),
    scenesStrip(ctx),
    cultureCard(ctx),
    h('footer', { class: 'proverb' },
      h('p', { lang: 'it' }, '«Chi parla due lingue vive due vite.»'),
      h('p', { class: 'small' }, 'İki dil konuşan, iki hayat yaşar.')));
}
