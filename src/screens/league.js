import { h, icon } from '../lib/dom.js';
import { leaderboard, gapToNext, weekKeys, POINTS } from '../lib/points.js';
import { stateOf, saveProfiles } from '../lib/profiles.js';
import { newLeagueCode, newIdentity, normalizeCode, isValidCode, onlineRows, errorMessage } from '../lib/online.js';
import { today } from '../lib/store.js';
import { topbar, avatar, confirmButton } from '../ui.js';

let scope = 'local'; // 'local' | 'online'
let mode = 'week';
const MEDALS = ['🥇', '🥈', '🥉'];

function podium(rows) {
  const top = rows.slice(0, 3);
  const order = [top[1], top[0], top[2]].filter(Boolean);
  return h('div', { class: 'podium' }, order.map((r) => h('div', { class: `step-col rank-${Math.min(r.rank, 3)}` },
    avatar(r.profile, r.rank === 1 ? 64 : 52),
    h('span', { class: 'pname' }, r.profile.name),
    h('span', { class: 'ppts' }, `${r.points} puan`),
    h('div', { class: 'block' }, MEDALS[r.rank - 1] || r.rank))));
}

/** Sıralama tablosu (yerel ya da çevrim içi satırlar aynı biçimde). */
function board(rows, isMe, emptyText) {
  const me = rows.find(isMe);
  const gap = me ? gapToNext(rows, me.profile.id) : null;
  return h('div', { class: 'stack' },
    rows.length > 1 ? podium(rows) : null,
    me ? h('div', { class: 'card me-card' },
      h('span', { class: 'big-rank' }, `${me.rank}.`),
      h('div', { class: 'grow' },
        h('h3', {}, me.rank === 1 && rows.length > 1 ? 'Zirvedesin! 🏆' : me.rank === 1 ? 'Ligde tek başınasın' : `${me.rank}. sıradasın`),
        h('p', { class: 'small muted' }, gap ? `${gap.name} oyuncusunu geçmek için ${gap.points} puan daha.` : rows.length > 1 ? 'Yerini korumak için bugün de pratik yap.' : emptyText)),
      h('strong', { class: 'pts' }, me.points)) : null,
    h('ol', { class: 'ranking' }, rows.map((r) => h('li', { class: isMe(r) ? 'me' : '' },
      h('span', { class: 'rk' }, r.rank),
      avatar(r.profile, 40),
      h('span', { class: 'grow pname' }, r.profile.name, isMe(r) ? h('span', { class: 'you' }, 'sen') : null),
      h('span', { class: 'pts' }, r.points)))));
}

function modeTabs(onChange) {
  return h('div', { class: 'seg', role: 'tablist', 'aria-label': 'Dönem' }, [['week', 'Bu hafta'], ['all', 'Tüm zamanlar']].map(([id, label]) =>
    h('button', { role: 'tab', 'aria-selected': String(mode === id), onclick: () => { mode = id; onChange(); } }, label)));
}

function localPanel(ctx, redraw) {
  const rows = leaderboard(ctx.db.profiles, (id) => stateOf(ctx.db, id), today(), mode);
  return h('div', { class: 'stack' },
    modeTabs(redraw),
    board(rows, (r) => r.profile.id === ctx.db.active, 'Bir oyuncu ekle, yarışma başlasın.'),
    h('button', { class: 'btn secondary block', onclick: () => ctx.go('profiles') }, icon('users'), 'Bu cihaza oyuncu ekle / değiştir'));
}

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
    try {
      if (mustExist) {
        const rows = await ctx.online.league(code);
        if (!rows?.length) { status.textContent = 'Bu kodla bir lig bulunamadı. Kodu kontrol et.'; return; }
      }
      p.online = { ...newIdentity(), league: code };
      await ctx.syncNow();
      saveProfiles(ctx.db);
      ctx.pendingJoin = null;
      redraw();
    } catch (err) {
      delete p.online;
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
      h('h3', {}, 'Yeni bir lig kur'),
      h('p', { class: 'small muted' }, 'Sana bir lig kodu verilir; kodu ya da davet linkini aile ve arkadaşlarına gönderirsin.'),
      h('button', { class: 'btn soft block', onclick: () => start(newLeagueCode(), false) }, icon('plus'), 'Lig kur')));
}

function onlinePanel(ctx, redraw) {
  if (!ctx.online.enabled) {
    return h('section', { class: 'card cream stack' },
      h('h3', {}, 'Çevrim içi lig yakında'),
      h('p', { class: 'small muted' }, 'Farklı telefonlardan yarışmak için sunucu bağlantısı henüz kurulmadı. Şimdilik bu cihazdaki oyuncularla yarışabilirsin.'));
  }
  const p = ctx.profile;
  if (!p.online) return joinForm(ctx, redraw, ctx.pendingJoin || '');

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
      h('div', { class: 'grow' }, h('p', { class: 'eyebrow' }, 'Lig kodu'), h('p', { class: 'code' }, code)),
      h('button', { class: 'btn small', onclick: () => share(code, shareStatus) }, icon('users'), 'Davet et')),
    shareStatus,
    modeTabs(redraw),
    list,
    h('div', { class: 'row between' }, status, h('button', { class: 'link row', onclick: load }, icon('repeat'), 'Yenile')),
    confirmButton({ class: 'btn ghost block' }, 'Bu ligden ayrıl', 'Emin misin? Puanın ligden silinir', async () => {
      try { await ctx.online.leave(p.online.playerId, p.online.secret); } catch { /* sunucuya ulaşılamasa da yerelde ayrıl */ }
      delete p.online;
      saveProfiles(ctx.db);
      redraw();
    }));
}

export function renderLeague(ctx) {
  if (ctx.pendingJoin) scope = 'online';
  const t = today();
  const daysLeft = 7 - weekKeys(t).indexOf(t) - 1;
  const panel = h('div');
  const scopeTabs = h('div', { class: 'seg big', role: 'tablist', 'aria-label': 'Lig türü' });
  const redraw = () => {
    scopeTabs.replaceChildren(...[['local', 'Bu cihaz'], ['online', 'Çevrim içi']].map(([id, label]) =>
      h('button', { role: 'tab', 'aria-selected': String(scope === id), onclick: () => { scope = id; redraw(); } }, label)));
    panel.replaceChildren(scope === 'online' ? onlinePanel(ctx, redraw) : localPanel(ctx, redraw));
  };
  redraw();
  const rule = (label, n) => h('li', {}, h('span', {}, label), h('strong', {}, `+${n}`));
  return h('div', { class: 'screen' },
    topbar({ subtitle: 'Lig' }),
    h('section', { class: 'league-hero' },
      h('p', { class: 'eyebrow' }, 'Haftalık lig'),
      h('h1', {}, 'Lega della settimana'),
      h('p', {}, daysLeft ? `Haftalık puanlar ${daysLeft} gün sonra, pazar gece yarısı sıfırlanır.` : 'Bugün haftanın son günü! Haftalık puanlar gece yarısı sıfırlanır.')),
    scopeTabs,
    panel,
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
