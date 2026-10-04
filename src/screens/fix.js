import { h, icon } from '../lib/dom.js';
import { cards } from '../content/index.js';
import { speak } from '../lib/speech.js';
import { dayPlan, dayRec, completeStep } from '../lib/program.js';
import { today } from '../lib/store.js';
import { speakBtn } from '../ui.js';
import { sayPanel } from './say.js';

const FIX_MAX = 3;
const cardByIt = (it) => Object.values(cards).find((c) => c.it === it) || null;

/** 4. adım: günün en önemli 3 hatası. Doğrusunu yazarak tekrar et; kart değilse Cümlelerim'e eklenir. */
export function renderFix(ctx, param) {
  const n = Number(param);
  const plan = dayPlan(n);
  if (!plan) { ctx.go('program'); return h('div'); }
  const back = () => ctx.go(`day/${n}`);
  // Konuşmada takılınan cümleler önce: kart cümleleri zaten tekrar kutusunda geri gelecek.
  const all = dayRec(ctx.state, n).mistakes;
  const list = [...all.filter((m) => !cardByIt(m.it)), ...all.filter((m) => cardByIt(m.it))].slice(0, FIX_MAX);

  const finish = () => {
    const t = today();
    const personal = ctx.state.personal || [];
    let saved = 0;
    for (const m of list) {
      // Kart cümleleri tekrar kutusunda zaten yarına planlandı; diğerleri Cümlelerim'e girer.
      if (!cardByIt(m.it) && !personal.some((p) => p.it === m.it)) {
        personal.unshift({ id: Date.now().toString(36) + saved, it: m.it, note: `Hata defteri · Gün ${n}`, date: new Date().toISOString() });
        saved += 1;
      }
    }
    ctx.state.personal = personal;
    const { dayDone, bonus } = completeStep(ctx.state, n, 'fix', t);
    ctx.persist();
    ctx.flash = [
      list.length ? `${list.length} hatayı düzelttin.` : 'Bugün düzeltilecek hata yoktu.',
      saved ? `${saved} cümle Cümlelerim'e eklendi.` : '',
      dayDone ? `Gün ${n} tamam!${bonus ? ` +${bonus} XP günlük bonus.` : ''}` : '',
    ].filter(Boolean).join(' ');
    back();
  };

  const header = h('header', { class: 'topbar' },
    h('div', { class: 'row grow' },
      h('button', { class: 'icon-btn plain', 'aria-label': 'Geri', onclick: back }, icon('back')),
      h('div', {}, h('p', { class: 'small muted' }, `Gün ${n} · 4. adım`), h('h3', {}, 'Hata düzeltme'))),
    list.length ? h('span', { class: 'chip' }, `${list.length} cümle`) : null);

  if (!list.length) {
    return h('div', { class: 'screen full' }, header,
      h('div', { class: 'card empty stack' }, h('p', { style: 'font-size:40px' }, '🌟'), h('h2', {}, 'Bugün hata yok'),
        h('p', {}, 'Tekrarda ve konuşmada zorlandığın cümleler burada toplanır. Bugün hepsini rahat söyledin.'),
        h('button', { class: 'btn block', onclick: finish }, 'Günü bitir', icon('arrow'))));
  }

  let ready = 0;
  const done = h('button', { class: 'btn block', disabled: true, onclick: finish }, 'Günü bitir', icon('arrow'));
  const items = list.map((m, i) => h('div', { class: 'stack' },
    h('section', { class: 'card learn-card stack' },
      h('div', { class: 'row between' },
        h('span', { class: 'chip terra' }, `Hata ${i + 1}`),
        h('span', { class: 'row' }, speakBtn(m.it), speakBtn(m.it, { slow: true, label: 'Yavaş dinle' }))),
      h('p', { class: 'learn-it', lang: 'it' }, m.it),
      m.tr ? h('p', { class: 'muted' }, m.tr) : null),
    sayPanel(cardByIt(m.it) || { it: m.it }, () => { ready += 1; done.disabled = ready < list.length; })));
  setTimeout(() => speak(list[0].it, { slow: true }), 250);
  return h('div', { class: 'screen full' }, header,
    h('p', { class: 'small muted' }, 'Bugün zorlandığın cümleler. Doğrusunu oku, sonra kendin yaz.'),
    ...items,
    done);
}
