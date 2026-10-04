import { h, icon } from '../lib/dom.js';
import { AVATARS, COLORS, addProfile, removeProfile, saveProfiles, stateOf } from '../lib/profiles.js';
import { weekPoints } from '../lib/points.js';
import { today } from '../lib/store.js';
import { avatar, brandMark } from '../ui.js';

let editing = false;

function newPlayerForm(ctx, onCancel) {
  let pick = AVATARS.find((a) => !ctx.db.profiles.some((p) => p.avatar === a)) || AVATARS[0];
  let color = COLORS[ctx.db.profiles.length % COLORS.length];
  const name = h('input', { class: 'input', id: 'player-name', maxlength: 24, placeholder: 'Adın (örn. Serkan)', autocomplete: 'given-name', 'aria-label': 'Oyuncu adı' });
  const preview = h('div', { class: 'center' });
  const avatars = h('div', { class: 'picker', role: 'radiogroup', 'aria-label': 'Avatar' });
  const colors = h('div', { class: 'picker', role: 'radiogroup', 'aria-label': 'Renk' });
  const error = h('p', { class: 'small error', 'aria-live': 'polite' });
  const draw = () => {
    preview.replaceChildren(avatar({ avatar: pick, color }, 84));
    avatars.replaceChildren(...AVATARS.map((a) => h('button', { type: 'button', class: 'pick', role: 'radio', 'aria-checked': String(a === pick), 'aria-label': a, onclick: () => { pick = a; draw(); } }, a)));
    colors.replaceChildren(...COLORS.map((c) => h('button', { type: 'button', class: 'pick swatch', style: `--c:${c}`, role: 'radio', 'aria-checked': String(c === color), 'aria-label': `Renk ${c}`, onclick: () => { color = c; draw(); } })));
  };
  draw();
  const create = () => {
    const v = name.value.trim();
    if (!v) { error.textContent = 'Bir ad yaz.'; name.focus(); return; }
    if (ctx.db.profiles.some((p) => p.name.toLocaleLowerCase('tr') === v.toLocaleLowerCase('tr'))) { error.textContent = 'Bu adla bir oyuncu zaten var.'; name.focus(); return; }
    const p = addProfile(ctx.db, { name: v, avatar: pick, color });
    ctx.switchProfile(p.id);
    ctx.go(ctx.pendingJoin ? 'league' : 'home');
  };
  name.addEventListener('keydown', (e) => e.key === 'Enter' && create());
  setTimeout(() => name.focus(), 50);
  return h('section', { class: 'card stack new-player' },
    preview,
    h('label', { class: 'small strong', for: 'player-name' }, 'Adın'),
    name,
    h('p', { class: 'small strong' }, 'Avatarını seç'),
    avatars,
    h('p', { class: 'small strong' }, 'Rengin'),
    colors,
    error,
    h('button', { class: 'btn block', onclick: create }, 'Oyuna katıl', icon('arrow')),
    ctx.db.profiles.length ? h('button', { class: 'btn ghost block', onclick: onCancel }, 'Vazgeç') : null);
}

export function renderProfiles(ctx) {
  const t = today();
  const body = h('div', { class: 'stack' });
  const draw = (adding = !ctx.db.profiles.length) => {
    if (adding) { body.replaceChildren(newPlayerForm(ctx, () => draw(false))); return; }
    const tiles = ctx.db.profiles.map((p) => {
      const pts = weekPoints(stateOf(ctx.db, p.id), t);
      let armed = false;
      const del = h('button', { class: 'tile-del', type: 'button', 'aria-label': `${p.name} oyuncusunu sil`, onclick: (e) => {
        e.stopPropagation();
        if (!armed) { armed = true; del.textContent = 'Emin misin?'; del.classList.add('armed'); return; }
        removeProfile(ctx.db, p.id);
        if (!ctx.db.active) ctx.switchProfile(null);
        saveProfiles(ctx.db);
        draw(false);
      } }, icon('trash'));
      return h('div', { class: 'player-tile' },
        h('button', { class: `player ${p.id === ctx.db.active ? 'current' : ''}`, onclick: () => { ctx.switchProfile(p.id); ctx.go(ctx.pendingJoin ? 'league' : 'home'); } },
          avatar(p, 76),
          h('span', { class: 'pname' }, p.name),
          h('span', { class: 'ppts' }, `${pts} puan · bu hafta`)),
        editing ? del : null);
    });
    body.replaceChildren(
      h('div', { class: 'players' }, tiles,
        h('button', { class: 'player add', onclick: () => draw(true) }, h('span', { class: 'pavatar add-ico' }, icon('plus')), h('span', { class: 'pname' }, 'Oyuncu ekle'), h('span', { class: 'ppts' }, 'Ailen, arkadaşın…'))),
      h('button', { class: 'btn ghost block', onclick: () => { editing = !editing; draw(false); } }, editing ? 'Bitti' : 'Oyuncuları düzenle'));
  };
  draw();
  return h('div', { class: 'screen full profiles-screen' },
    h('div', { class: 'profiles-head' },
      brandMark(),
      h('h1', {}, ctx.db.profiles.length ? 'Kim çalışıyor?' : 'Benvenuto!'),
      ctx.pendingJoin ? h('p', { class: 'chip gold' }, `${ctx.pendingJoin} ligine davet edildin. Önce oyuncunu seç.`) : null,
      h('p', { class: 'muted' }, ctx.db.profiles.length
        ? 'Profilini seç. Herkesin ilerlemesi ayrı tutulur, puanlar haftalık ligde yarışır.'
        : 'PARLO\'ya hoş geldin. Önce bir oyuncu oluştur; sonra ailenden ya da arkadaşlarından başkalarını da ekleyip yarışabilirsiniz.')),
    body,
    h('p', { class: 'small muted center' }, 'Profiller bu cihazda saklanır. Aynı telefonu ya da tableti paylaşan herkes katılabilir.'));
}
