import { h, icon } from '../lib/dom.js';
import { leaderboard, gapToNext, weekKeys, POINTS } from '../lib/points.js';
import { stateOf, saveProfiles } from '../lib/profiles.js';
import { newLeagueCode, normalizeCode, isValidCode, onlineRows, divisionRows, tierOf, TIERS, RULES, errorMessage } from '../lib/online.js';
import { today } from '../lib/store.js';
import { topbar, avatar, confirmButton } from '../ui.js';

let scope = null; // 'division' | 'friends' | 'local'
let mode = 'week';
const MEDALS = ['🥇', '🥈', '🥉'];

function podium(rows) {
  const top = rows.slice(0, 3);
  const order = [top[1], top[0], top[2]].filter(Boolean);
  return h('div', { class: 'podium' }, order.map((r) => h('div', { class: `step-col rank-${Math.min(r.rank, 3)}` },
    avatar(r.profile, r.rank === 1 ? 64 : 52),
    h('span', { class: 'pname' }, r.profile.name),
    h('span', { class: 'ppts' }, `${r.points} XP`),
    h('div', { class: 'block' }, MEDALS[r.rank - 1] || r.rank))));
}

const rankRow = (r, me) => h('li', { class: `${me ? 'me' : ''} ${r.zone ? `zone-${r.zone}` : ''}` },
  h('span', { class: 'rk' }, r.rank),
  avatar(r.profile, 40),
  h('span', { class: 'grow pname' }, r.profile.name, me ? h('span', { class: 'you' }, 'sen') : null),
  h('span', { class: 'pts' }, `${r.points} XP`));

/** Arkadaş ligi ve cihaz ligi için kürsülü tablo. */
function board(rows, isMe, emptyText) {
  const me = rows.find(isMe);
  const gap = me ? gapToNext(rows, me.profile.id) : null;
  return h('div', { class: 'stack' },
    rows.length > 1 ? podium(rows) : null,
    me ? h('div', { class: 'card me-card' },
      h('span', { class: 'big-rank' }, `${me.rank}.`),
      h('div', { class: 'grow' },
        h('h3', {}, me.rank === 1 && rows.length > 1 ? 'Zirvedesin! 🏆' : me.rank === 1 ? 'Ligde tek başınasın' : `${me.rank}. sıradasın`),
        h('p', { class: 'small muted' }, gap ? `${gap.name} oyuncusunu geçmek için ${gap.points} XP daha.` : rows.length > 1 ? 'Yerini korumak için bugün de pratik yap.' : emptyText)),
      h('strong', { class: 'pts' }, me.points)) : null,
    h('ol', { class: 'ranking' }, rows.map((r) => rankRow(r, isMe(r)))));
}

function modeTabs(onChange) {
  return h('div', { class: 'seg', role: 'tablist', 'aria-label': 'Dönem' }, [['week', 'Bu hafta'], ['all', 'Tüm zamanlar']].map(([id, label]) =>
    h('button', { role: 'tab', 'aria-selected': String(mode === id), onclick: () => { mode = id; onChange(); } }, label)));
}

function tierBadge(n, size = 'md') {
  const t = tierOf(n);
  return h('span', { class: `tier-badge ${size}`, style: `--t:${t.color}`, title: `${t.name} Ligi` }, t.icon);
}

/** Tüm kademeler: geçilenler renkli, sıradakiler soluk. */
function tierPath(current) {
  return h('div', { class: 'tier-path', 'aria-label': `Kademe ${current + 1} / ${TIERS.length}` },
    TIERS.map((t, i) => h('span', { class: `tp ${i < current ? 'done' : i === current ? 'now' : ''}`, style: `--t:${t.color}`, title: t.name }, t.icon)));
}

// ---------- Kademeli haftalık lig ----------
function divisionPanel(ctx) {
  const p = ctx.profile;
  const wrap = h('div', { class: 'stack' }, h('p', { class: 'small muted' }, 'Lig yükleniyor…'));
  const t = today();
  const daysLeft = 7 - weekKeys(t).indexOf(t) - 1;
  const load = async () => {
    try {
      await ctx.syncNow();
      const raw = await ctx.online.division(p.online.playerId, weekKeys(t)[0]);
      const tierNow = raw?.length ? Number(raw[0].tier) : Number(await ctx.online.tier(p.online.playerId) ?? 0);
      const last = p.online.lastTier;
      const tier = tierOf(tierNow);
      const news = last == null || last === tierNow ? null
        : tierNow > last ? h('div', { class: 'card tier-news up' }, '🎉', h('p', {}, h('strong', {}, `${tier.name} Ligi'ne yükseldin!`), h('br'), h('span', { class: 'small' }, 'Geçen haftaki çaban karşılığını buldu.')))
          : h('div', { class: 'card tier-news down' }, '💪', h('p', {}, h('strong', {}, `${tier.name} Ligi'ne düştün.`), h('br'), h('span', { class: 'small' }, 'Bu hafta ilk 7\'ye gir, geri yüksel.')));
      p.online.lastTier = tierNow;

      const head = h('section', { class: 'division-head', style: `--t:${tier.color}` },
        tierBadge(tierNow, 'lg'),
        h('div', { class: 'grow' }, h('p', { class: 'eyebrow' }, `Lega ${tier.it}`), h('h2', {}, `${tier.name} Ligi`),
          h('p', { class: 'small' }, daysLeft ? `${daysLeft} gün kaldı` : 'Son gün! Gece yarısı biter.')),
        null);

      if (!raw?.length) {
        p.online.lastDivision = null;
        saveProfiles(ctx.db);
        wrap.replaceChildren(...[news, head, tierPath(tierNow),
          h('section', { class: 'card stack center' },
            h('p', { style: 'font-size:40px' }, '🏁'),
            h('h3', {}, 'Bu haftanın ligine katıl'),
            h('p', { class: 'small muted' }, `İlk XP'ni kazandığında ${tier.name} Ligi'nde 30 kişilik bir gruba yerleşirsin. İlk ${RULES.promote}'ye girersen bir üst lige çıkarsın.`),
            h('button', { class: 'btn block', onclick: () => ctx.go('home') }, 'Derse başla', icon('arrow')))].filter(Boolean));
        return;
      }
      const { rows } = divisionRows(raw, p.online.playerId);
      const me = rows.find((r) => r.self);
      p.online.lastDivision = { week: weekKeys(t)[0], tier: tierNow, rank: me.rank, size: rows.length };
      saveProfiles(ctx.db);
      const firstDown = rows.findIndex((r) => r.zone === 'down');
      const lastUp = rows.map((r) => r.zone).lastIndexOf('up');
      const list = [];
      rows.forEach((r, i) => {
        if (i === firstDown) list.push(h('li', { class: 'zone-line down' }, '▼ Düşme bölgesi'));
        list.push(rankRow(r, r.self));
        if (i === lastUp) list.push(h('li', { class: 'zone-line up' }, '▲ Yükselme bölgesi'));
      });
      const msg = me.zone === 'up' ? `Yükselme bölgesindesin! ${tierOf(tierNow + 1).name} Ligi'ne çıkmak üzeresin.`
        : me.zone === 'down' ? 'Düşme bölgesindesin. Birkaç ders yap, kurtul!'
          : `İlk ${RULES.promote}'ye gir, ${tierOf(tierNow + 1).name} Ligi'ne yüksel.`;
      wrap.replaceChildren(...[news, head, tierPath(tierNow),
        h('div', { class: `card me-card ${me.zone ? `zone-${me.zone}` : ''}` },
          h('span', { class: 'big-rank' }, `${me.rank}.`),
          h('div', { class: 'grow' }, h('h3', {}, `${rows.length} kişilik grupta ${me.rank}. sıradasın`), h('p', { class: 'small muted' }, msg)),
          h('strong', { class: 'pts' }, me.points)),
        h('ol', { class: 'ranking' }, list),
        h('button', { class: 'link row', onclick: load }, icon('repeat'), 'Yenile')].filter(Boolean));
    } catch (err) {
      wrap.replaceChildren(h('p', { class: 'card small' }, errorMessage(err)), h('button', { class: 'btn secondary block', onclick: load }, icon('repeat'), 'Tekrar dene'));
    }
  };
  load();
  return wrap;
}

// ---------- Arkadaş ligi (kodlu) ----------
const inviteLink = (code) => `${location.origin}${location.pathname}#/join/${code}`;

async function share(code, status) {
  const url = inviteLink(code);
  const text = `PARLO! ile İtalyanca ligime katıl. Lig kodu: ${code}`;
  try {
    if (navigator.share) { await navigator.share({ title: 'PARLO! ligi', text, url }); return; }
  } catch { /* paylaşım iptal edildi ya da desteklenmiyor */ }
  try {
    await navigator.clipboard.writeText(`${text}\n${url}`);
    status.textContent = 'Davet linki kopyalandı. WhatsApp\'a yapıştırıp gönderebilirsin.';
  } catch {
    status.textContent = `Bu linki arkadaşlarına gönder: ${url}`;
  }
}

function joinForm(ctx, redraw, prefill = '') {
  const status = h('p', { class: 'small error', 'aria-live': 'polite' });
  const input = h('input', { class: 'input code-input', id: 'league-code', maxlength: 7, placeholder: 'ABC123', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', value: prefill, 'aria-label': 'Lig kodu' });
  input.addEventListener('input', () => { input.value = normalizeCode(input.value); });

  const start = async (code, mustExist) => {
    status.textContent = '';
    if (!isValidCode(code)) { status.textContent = 'Lig kodu 6 karakter olmalı.'; input.focus(); return; }
    const p = ctx.profile;
    const before = p.online?.league || null;
    try {
      if (mustExist) {
        const rows = await ctx.online.league(code);
        if (!rows?.length) { status.textContent = 'Bu kodla bir lig bulunamadı. Kodu kontrol et.'; return; }
      }
      await ctx.syncNow(); // kimliği oluşturur
      p.online.league = code;
      await ctx.syncNow();
      saveProfiles(ctx.db);
      ctx.pendingJoin = null;
      redraw();
    } catch (err) {
      if (p.online) p.online.league = before;
      status.textContent = errorMessage(err);
    }
  };
  const joinBtn = h('button', { class: 'btn', onclick: () => start(normalizeCode(input.value), true) }, 'Katıl');
  input.addEventListener('keydown', (e) => e.key === 'Enter' && joinBtn.click());
  return h('div', { class: 'stack' },
    h('section', { class: 'card stack' },
      h('h3', {}, prefill ? `${prefill} ligine davet edildin` : 'Arkadaşının ligine katıl'),
      h('p', { class: 'small muted' }, prefill ? `${ctx.profile.name} olarak katılacaksın.` : 'Arkadaşının gönderdiği 6 haneli kodu yaz.'),
      h('div', { class: 'row' }, input, joinBtn),
      status),
    prefill ? null : h('section', { class: 'card cream stack' },
      h('h3', {}, 'Arkadaş ligi kur'),
      h('p', { class: 'small muted' }, 'Aile ve arkadaşlarınla ayrı bir tablo. Sana bir kod verilir; kodu ya da davet linkini gönderirsin.'),
      h('button', { class: 'btn soft block', onclick: () => start(newLeagueCode(), false) }, icon('plus'), 'Lig kur')));
}

function friendsPanel(ctx, redraw) {
  const p = ctx.profile;
  if (!p.online?.league) return joinForm(ctx, redraw, ctx.pendingJoin || '');

  const code = p.online.league;
  const status = h('p', { class: 'small muted', 'aria-live': 'polite' }, 'Lig yükleniyor…');
  const list = h('div', { class: 'stack' });
  const load = async () => {
    status.textContent = 'Lig yükleniyor…';
    try {
      await ctx.syncNow();
      const rows = onlineRows(await ctx.online.league(code), today(), mode, p.online.playerId);
      list.replaceChildren(board(rows, (r) => r.self, 'Arkadaşlarını davet et, yarışma başlasın.'));
      status.textContent = `Güncellendi: ${new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
    } catch (err) {
      status.textContent = errorMessage(err);
    }
  };
  load();
  const shareStatus = h('p', { class: 'small', 'aria-live': 'polite' });
  return h('div', { class: 'stack' },
    h('section', { class: 'card code-card' },
      h('div', { class: 'grow' }, h('p', { class: 'eyebrow' }, 'Arkadaş ligi kodu'), h('p', { class: 'code' }, code)),
      h('button', { class: 'btn small', onclick: () => share(code, shareStatus) }, icon('users'), 'Davet et')),
    shareStatus,
    modeTabs(redraw),
    list,
    h('div', { class: 'row between' }, status, h('button', { class: 'link row', onclick: load }, icon('repeat'), 'Yenile')),
    confirmButton({ class: 'btn ghost block' }, 'Bu arkadaş liginden ayrıl', 'Emin misin? Tekrar dokun', async () => {
      p.online.league = null;
      saveProfiles(ctx.db);
      try { await ctx.syncNow(); } catch { /* bağlantı yoksa sonraki senkronda gider */ }
      redraw();
    }));
}

// ---------- Bu cihaz ----------
function localPanel(ctx, redraw) {
  const rows = leaderboard(ctx.db.profiles, (id) => stateOf(ctx.db, id), today(), mode);
  return h('div', { class: 'stack' },
    modeTabs(redraw),
    board(rows, (r) => r.profile.id === ctx.db.active, 'Bir oyuncu ekle, yarışma başlasın.'),
    h('button', { class: 'btn secondary block', onclick: () => ctx.go('profiles') }, icon('users'), 'Bu cihaza oyuncu ekle / değiştir'));
}

export function renderLeague(ctx) {
  const tabsDef = ctx.online.enabled
    ? [['division', 'Lig'], ['friends', 'Arkadaşlar'], ['local', 'Bu cihaz']]
    : [['local', 'Bu cihaz']];
  if (ctx.pendingJoin && ctx.online.enabled) scope = 'friends';
  if (!tabsDef.some(([id]) => id === scope)) scope = tabsDef[0][0];

  const panel = h('div');
  const scopeTabs = h('div', { class: `seg big n${tabsDef.length}`, role: 'tablist', 'aria-label': 'Lig türü' });
  const redraw = () => {
    scopeTabs.replaceChildren(...tabsDef.map(([id, label]) =>
      h('button', { role: 'tab', 'aria-selected': String(scope === id), onclick: () => { scope = id; redraw(); } }, label)));
    panel.replaceChildren(scope === 'division' ? divisionPanel(ctx) : scope === 'friends' ? friendsPanel(ctx, redraw) : localPanel(ctx, redraw));
  };
  redraw();
  const rule = (label, n) => h('li', {}, h('span', {}, label), h('strong', {}, `+${n} XP`));
  return h('div', { class: 'screen' },
    topbar({ subtitle: 'Lig' }),
    tabsDef.length > 1 ? scopeTabs : null,
    panel,
    ctx.online.enabled ? null : h('p', { class: 'small muted' }, 'Farklı telefonlardan yarışma (kademeli lig ve arkadaş ligi) sunucu bağlantısı kurulunca açılacak.'),
    h('section', { class: 'card stack' },
      h('h3', {}, 'XP nasıl kazanılır?'),
      h('ul', { class: 'rules' },
        rule('Tekrarda doğru cevap', POINTS.reviewOk),
        rule('İpucuyla doğru cevap', POINTS.reviewHint),
        rule('Sohbette yardımsız adım', POINTS.stepSolo),
        rule('Sohbette yardımla adım', POINTS.stepHelp),
        rule('Senaryoyu bitirmek', POINTS.sceneDone),
        rule('Günün dersini tamamlamak', POINTS.dailyDone)),
      ctx.online.enabled ? h('p', { class: 'small muted' }, `Haftalık ligde ilk ${RULES.promote} bir üst lige çıkar, son ${RULES.demote} bir alt lige düşer. Lig her pazartesi yeniden başlar.`) : null));
}
