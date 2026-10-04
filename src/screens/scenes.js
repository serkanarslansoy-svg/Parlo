import { h, icon } from '../lib/dom.js';
import { scenes, CATEGORIES } from '../content/index.js';
import { topbar, speakBtn } from '../ui.js';

let filter = 'all';

function sceneCard(ctx, scene) {
  const runs = ctx.state.scenes[scene.id]?.runs || 0;
  const firstLine = scene.nodes[scene.start].intents[0];
  return h('article', { class: 'card scene' },
    h('div', { class: `art art-${scene.cat}`, 'aria-hidden': 'true' },
      h('div', { class: 'tags' }, h('span', { class: 'chip' }, scene.it.toUpperCase()), h('span', { class: 'chip sun' }, scene.level)),
      scene.emoji,
      h('span', { class: 'chip time' }, icon('clock'), `${scene.minutes} dk`)),
    h('div', { class: 'body stack' },
      h('div', { class: 'row between' },
        h('h3', {}, scene.tr),
        runs ? h('span', { class: 'chip green' }, icon('check'), runs > 1 ? `${runs} kez` : 'Tamamlandı') : null),
      h('div', { class: 'line' },
        speakBtn(firstLine.model),
        h('div', { class: 'grow' }, h('p', { class: 'it' }, `«${firstLine.model}»`), h('p', { class: 'tr' }, firstLine.tr))),
      h('p', { class: 'small muted' }, scene.desc),
      h('div', { class: 'row between' },
        h('span', { class: 'small muted row' }, icon('mic'), `${scene.persona.name} · ${scene.persona.role}`),
        h('button', { class: 'btn small', onclick: () => ctx.go(`chat/${scene.id}`) }, runs ? 'Tekrar et' : 'Pratiğe başla', icon('arrow')))));
}

function wishCard(ctx) {
  const input = h('textarea', { class: 'input', rows: 2, maxlength: 200, placeholder: 'Örn. Yarın Comune\'de ikamet randevum var', 'aria-label': 'Kendi durumun' });
  const status = h('p', { class: 'small muted', 'aria-live': 'polite' });
  const add = () => {
    const v = input.value.trim();
    if (!v) return input.focus();
    ctx.state.wishes = [...(ctx.state.wishes || []), { text: v, date: new Date().toISOString() }];
    ctx.persist();
    input.value = '';
    status.textContent = 'Kaydedildi. Yapay zekâ koçu geldiğinde bu durumlar için sana özel senaryo hazırlanacak.';
  };
  return h('section', { class: 'card sun stack' },
    h('div', { class: 'row' }, icon('sparkle'), h('h3', {}, 'Kendi durumunu yaz')),
    h('p', { class: 'small' }, 'Doktor randevusu, Questura, kira sözleşmesi… Hangi durumda konuşman gerekiyor?'),
    input,
    h('button', { class: 'btn terra block', onclick: add }, 'Listeme ekle'),
    status,
    (ctx.state.wishes || []).length ? h('p', { class: 'small muted' }, `Bekleyen istek: ${ctx.state.wishes.length}`) : null);
}

export function renderScenes(ctx) {
  const list = h('div', { class: 'stack' });
  const chipsEl = h('div', { class: 'chips', role: 'group', 'aria-label': 'Kategori' });
  const draw = () => {
    const items = scenes.filter((s) => filter === 'all' || s.cat === filter);
    list.replaceChildren(...items.map((s) => sceneCard(ctx, s)));
    chipsEl.replaceChildren(...[{ id: 'all', label: `Tümü (${scenes.length})` }, ...CATEGORIES].map((c) =>
      h('button', { class: 'chip', 'aria-pressed': String(filter === c.id), onclick: () => { filter = c.id; draw(); } }, c.label)));
  };
  draw();
  return h('div', { class: 'screen' },
    topbar({ subtitle: 'Senaryolar' }),
    h('section', {},
      h('p', { class: 'eyebrow' }, 'Gerçek hayattan'),
      h('h1', {}, 'Nerede konuşmak istersin?'),
      h('p', { class: 'muted', style: 'margin-top:6px' }, 'Bir durum seç; bildiğin İtalyancayla derdini anlat. Takılırsan öğretmen yanında.')),
    chipsEl,
    list,
    wishCard(ctx));
}
