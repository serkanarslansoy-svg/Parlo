import { h, icon } from '../lib/dom.js';
import { scenes, cards, CATEGORIES } from '../content/index.js';
import { norm } from '../lib/answer.js';
import { topbar, speakBtn } from '../ui.js';

let filter = 'all';
let search = '';

/** Senaryodaki farklı "gerçek hayat başarısı" sayısına göre tamamlanma yüzdesi. */
export function sceneCompletion(state, scene) {
  const all = new Set(Object.values(scene.nodes).flatMap((n) => (n.intents || []).map((i) => i.cando).filter(Boolean)));
  const got = (state.scenes[scene.id]?.cando || []).filter((c) => all.has(c)).length;
  return all.size ? Math.round((got / all.size) * 100) : 0;
}

const stepCount = (scene) => Object.values(scene.nodes).filter((n) => !n.end).length;

function matches(scene, q) {
  if (!q) return true;
  const text = [scene.it, scene.tr, scene.desc, scene.persona.name, scene.persona.role, ...scene.cards.map((id) => `${cards[id].it} ${cards[id].tr}`)].join(' ');
  return norm(text).includes(q);
}

function featuredCard(ctx, scene) {
  const runs = ctx.state.scenes[scene.id]?.runs || 0;
  const pct = sceneCompletion(ctx.state, scene);
  const key = cards[scene.key];
  return h('article', { class: 'card featured' },
    h('div', { class: `art art-${scene.cat}` },
      h('span', { class: 'emoji', 'aria-hidden': 'true' }, scene.emoji),
      h('div', { class: 'tags' },
        h('span', { class: 'chip glass' }, h('i', { class: 'dot' }), `${scene.level} · ${stepCount(scene)} adım`),
        runs ? h('span', { class: 'chip green' }, icon('check'), `%${pct}`) : null),
      h('div', { class: 'overlay' },
        h('p', { class: 'eyebrow' }, `${scene.it} · ${scene.persona.name}, ${scene.persona.role.toLowerCase()}`),
        h('h2', {}, scene.tr))),
    h('div', { class: 'body stack' },
      h('div', { class: 'keyline' },
        h('span', { class: 'qbadge', 'aria-hidden': 'true' }, icon('quote')),
        h('div', { class: 'grow' },
          h('p', { class: 'small muted' }, 'Önemli diyalog kalıbı'),
          h('p', { class: 'key-it', lang: 'it' }, `«${key.it}»`),
          h('p', { class: 'tr' }, scene.desc)),
        speakBtn(key.it)),
      h('div', { class: 'row between' },
        h('span', { class: 'row small' }, icon('wave'), h('span', {}, 'Canlı simülasyon', h('br'), h('span', { class: 'muted' }, `${scene.minutes} dk · ${scene.register === 'Lei' ? 'resmî' : 'samimi'} hitap`))),
        h('button', { class: 'btn dark', onclick: () => ctx.go(`chat/${scene.id}`) }, runs ? 'Tekrar et' : 'Başla', icon('arrow')))));
}

function compactCard(ctx, scene) {
  const runs = ctx.state.scenes[scene.id]?.runs || 0;
  const pct = sceneCompletion(ctx.state, scene);
  return h('button', { class: 'card compact', onclick: () => ctx.go(`chat/${scene.id}`) },
    h('span', { class: `thumb art-${scene.cat}`, 'aria-hidden': 'true' }, scene.emoji),
    h('span', { class: 'grow' },
      h('span', { class: 'eyebrow terra' }, `${scene.it} · ${scene.level}`),
      h('span', { class: 'title' }, scene.tr),
      h('span', { class: 'desc' }, scene.desc),
      h('span', { class: 'meta' }, icon('clock'), runs ? `Tamamlandı · %${pct}` : `${scene.persona.name} bekliyor · ${scene.minutes} dk`)),
    icon('chevron', 'chev'));
}

function aiCard(ctx) {
  const input = h('textarea', { class: 'input', rows: 2, maxlength: 200, placeholder: 'Örn. Yarın Comune\'de ikamet randevum var', 'aria-label': 'Kendi durumun' });
  const status = h('p', { class: 'small', 'aria-live': 'polite' });
  const count = (ctx.state.wishes || []).length;
  const add = () => {
    const v = input.value.trim();
    if (!v) return input.focus();
    ctx.state.wishes = [...(ctx.state.wishes || []), { text: v, date: new Date().toISOString() }];
    ctx.persist();
    input.value = '';
    status.textContent = `Kaydedildi (${ctx.state.wishes.length} istek). AI koç geldiğinde bu durumlar için sana özel senaryo hazırlanacak.`;
  };
  return h('section', { class: 'ai-card stack' },
    h('span', { class: 'chip glass' }, icon('sparkle'), 'Kişiselleştirilmiş AI · Yakında'),
    h('h2', {}, 'Kendi durumunu yaşa'),
    h('p', {}, 'Yakında bir ev sahibi görüşmen, banka randevun ya da Questura görüşmen mi var? Yaz; AI koçu geldiğinde ilk bunlar için senaryo hazırlanacak.'),
    input,
    h('button', { class: 'btn terra block', onclick: add }, icon('sparkle'), 'Özel senaryo iste'),
    status,
    count ? h('p', { class: 'small' }, `Bekleyen istek: ${count}`) : null);
}

export function renderScenes(ctx) {
  const sections = h('div', { class: 'stack' });
  const chipsEl = h('div', { class: 'chips', role: 'group', 'aria-label': 'Kategori' });
  const searchEl = h('input', { type: 'search', placeholder: 'Senaryo veya mekân ara… (örn. kafe, eczane)', value: search, 'aria-label': 'Senaryo ara' });

  const draw = () => {
    const q = norm(search);
    const groups = CATEGORIES
      .filter((c) => filter === 'all' || c.id === filter)
      .map((c) => ({ cat: c, items: scenes.filter((s) => s.cat === c.id && matches(s, q)) }))
      .filter((g) => g.items.length);
    sections.replaceChildren(...(groups.length
      ? groups.map(({ cat, items }) => h('section', { class: 'stack' },
        h('div', { class: 'group-head' },
          h('h2', { class: 'row' }, icon(cat.icon, 'terra-ico'), cat.title),
          h('span', { class: 'it-label', lang: 'it' }, cat.it)),
        featuredCard(ctx, items[0]),
        items.slice(1).map((s) => compactCard(ctx, s))))
      : [h('p', { class: 'card empty' }, 'Bu aramayla eşleşen senaryo yok. Aşağıdan kendi durumunu yazabilirsin.')]));
    chipsEl.replaceChildren(...[{ id: 'all', label: 'Tümü' }, ...CATEGORIES].map((c) =>
      h('button', { class: 'chip', 'aria-pressed': String(filter === c.id), onclick: () => { filter = c.id; draw(); } }, c.label)));
  };
  searchEl.addEventListener('input', () => { search = searchEl.value; draw(); });
  draw();

  return h('div', { class: 'screen' },
    topbar({ subtitle: 'Senaryolar' }),
    h('section', {},
      h('p', { class: 'eyebrow terra row' }, h('i', { class: 'dot' }), 'Nerede konuşmak istersin?'),
      h('h1', {}, 'Gerçek hayat senaryoları'),
      h('p', { class: 'muted', style: 'margin-top:6px' }, 'Gramer kitaplarını unut; İtalya\'da yaşarken en çok ihtiyaç duyacağın anları konuş.')),
    h('label', { class: 'search' }, icon('search'), searchEl),
    chipsEl,
    sections,
    aiCard(ctx));
}
