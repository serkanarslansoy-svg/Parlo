import { h, icon } from '../lib/dom.js';
import { leaderboard, gapToNext, weekKeys, POINTS } from '../lib/points.js';
import { stateOf } from '../lib/profiles.js';
import { today } from '../lib/store.js';
import { topbar, avatar } from '../ui.js';

let mode = 'week';
const MEDALS = ['🥇', '🥈', '🥉'];

function podium(rows) {
  const top = rows.slice(0, 3);
  const order = [top[1], top[0], top[2]].filter(Boolean);
  return h('div', { class: 'podium' }, order.map((r) => h('div', { class: `step-col rank-${r.rank}` },
    avatar(r.profile, r.rank === 1 ? 64 : 52),
    h('span', { class: 'pname' }, r.profile.name),
    h('span', { class: 'ppts' }, `${r.points} puan`),
    h('div', { class: 'block' }, MEDALS[r.rank - 1] || r.rank))));
}

export function renderLeague(ctx) {
  const t = today();
  const daysLeft = 7 - weekKeys(t).indexOf(t) - 1;
  const list = h('div', { class: 'stack' });
  const tabs = h('div', { class: 'seg', role: 'tablist' });
  const draw = () => {
    const rows = leaderboard(ctx.db.profiles, (id) => stateOf(ctx.db, id), t, mode);
    const gap = gapToNext(rows, ctx.db.active);
    const me = rows.find((r) => r.profile.id === ctx.db.active);
    tabs.replaceChildren(...[['week', 'Bu hafta'], ['all', 'Tüm zamanlar']].map(([id, label]) =>
      h('button', { role: 'tab', 'aria-selected': String(mode === id), onclick: () => { mode = id; draw(); } }, label)));
    list.replaceChildren(
      rows.length > 1 ? podium(rows) : null,
      me ? h('div', { class: 'card me-card' },
        h('span', { class: 'big-rank' }, `${me.rank}.`),
        h('div', { class: 'grow' },
          h('h3', {}, me.rank === 1 && rows.length > 1 ? 'Zirvedesin! 🏆' : me.rank === 1 ? 'Ligde tek başınasın' : `${me.rank}. sıradasın`),
          h('p', { class: 'small muted' }, gap ? `${gap.name} oyuncusunu geçmek için ${gap.points} puan daha.` : rows.length > 1 ? 'Yerini korumak için bugün de pratik yap.' : 'Bir oyuncu ekle, yarışma başlasın.')),
        h('strong', { class: 'pts' }, me.points)) : null,
      h('ol', { class: 'ranking' }, rows.map((r) => h('li', { class: r.profile.id === ctx.db.active ? 'me' : '' },
        h('span', { class: 'rk' }, r.rank),
        avatar(r.profile, 40),
        h('span', { class: 'grow pname' }, r.profile.name, r.profile.id === ctx.db.active ? h('span', { class: 'you' }, 'sen') : null),
        h('span', { class: 'pts' }, r.points)))));
  };
  draw();
  const rule = (label, n) => h('li', {}, h('span', {}, label), h('strong', {}, `+${n}`));
  return h('div', { class: 'screen' },
    topbar({ subtitle: 'Lig' }),
    h('section', { class: 'league-hero' },
      h('p', { class: 'eyebrow' }, 'Haftalık lig'),
      h('h1', {}, 'Lega della settimana'),
      h('p', {}, daysLeft ? `Lig ${daysLeft} gün sonra, pazar gece yarısı sıfırlanır.` : 'Bugün haftanın son günü! Lig gece yarısı sıfırlanır.')),
    tabs,
    list,
    h('button', { class: 'btn secondary block', onclick: () => ctx.go('profiles') }, icon('users'), 'Oyuncu ekle / değiştir'),
    h('section', { class: 'card stack' },
      h('h3', {}, 'Puanlar nasıl kazanılır?'),
      h('ul', { class: 'rules' },
        rule('Tekrarda doğru cevap', POINTS.reviewOk),
        rule('İpucuyla doğru cevap', POINTS.reviewHint),
        rule('Sohbette yardımsız adım', POINTS.stepSolo),
        rule('Sohbette yardımla adım', POINTS.stepHelp),
        rule('Senaryoyu bitirmek', POINTS.sceneDone),
        rule('Günün dersini tamamlamak', POINTS.dailyDone))));
}
