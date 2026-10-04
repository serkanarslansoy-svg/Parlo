import { h, icon } from '../lib/dom.js';
import { sceneById, cards } from '../content/index.js';
import { speakBtn } from '../ui.js';
import { dailyStatus } from './home.js';

function sentenceRow(card, extra) {
  return h('div', { class: 'example' },
    h('div', { class: 'grow' }, h('p', { class: 'it', lang: 'it' }, card.it), h('p', { class: 'tr' }, card.tr), extra),
    speakBtn(card.it));
}

function reviewResult(ctx, r) {
  const right = r.results.filter((x) => x.ok).length;
  const { scene, chatDone } = dailyStatus(ctx.state);
  const nextBtn = r.daily && !chatDone
    ? h('button', { class: 'btn block', onclick: () => ctx.go(`chat/${scene.id}?daily=1`) }, icon('mic'), `Şimdi ${scene.persona.name} ile konuş`, icon('arrow'))
    : h('button', { class: 'btn block', onclick: () => ctx.go('home') }, 'Ana sayfaya dön');
  return h('div', { class: 'screen full' },
    h('section', { class: 'hero-result', style: 'margin-top:20px' },
      h('span', { class: 'big', 'aria-hidden': 'true' }, '🧠'),
      h('p', { class: 'eyebrow' }, r.daily ? 'Günün dersi · 1/2 tamam' : 'Tekrar kutusu'),
      h('h1', {}, 'Tekrar tamamlandı!'),
      h('p', { style: 'margin-top:6px;color:#e3f1ea' }, r.daily ? `Isındın. Şimdi bu kalıpları ${scene.persona.name} ile gerçek bir konuşmada kullan.` : 'Unutmak üzere olduğun cümleleri tazeledin.')),
    h('div', { class: 'stats' },
      h('div', { class: 'stat' }, h('strong', {}, `${right}/${r.results.length}`), h('span', {}, 'doğru')),
      h('div', { class: 'stat' }, h('strong', {}, String(r.results.filter((x) => x.hinted).length)), h('span', {}, 'ipucu')),
      h('div', { class: 'stat' }, h('strong', {}, String(r.results.filter((x) => !x.ok).length)), h('span', {}, 'tekrar edilecek'))),
    h('section', { class: 'stack' }, h('h2', {}, 'Bugünün cümleleri'),
      r.results.map((x) => sentenceRow(cards[x.id], h('span', { class: `chip ${x.ok ? 'green' : 'terra'}`, style: 'margin-top:6px' }, x.ok ? 'Bildin' : 'Tekrar edilecek')))),
    nextBtn);
}

function sceneResult(ctx, r) {
  const scene = sceneById(r.sceneId);
  const solo = r.steps.filter((s) => s.solo).length;
  const { reviewDone } = dailyStatus(ctx.state);
  const candos = r.steps.filter((s) => s.cando);
  const dailyDone = r.daily && reviewDone;
  return h('div', { class: 'screen full' },
    h('section', { class: 'hero-result', style: 'margin-top:20px' },
      h('span', { class: 'big', 'aria-hidden': 'true' }, scene.emoji),
      h('p', { class: 'eyebrow' }, dailyDone ? 'Günün görevi tamamlandı' : `${scene.tr} · tamamlandı`),
      h('h1', {}, 'Missione completata!'),
      h('p', { style: 'margin-top:6px;color:#e3f1ea' }, `${scene.persona.name} ile İtalyanca derdini anlattın.`)),
    h('div', { class: 'stats' },
      h('div', { class: 'stat' }, h('strong', {}, String(r.steps.length)), h('span', {}, 'konuşma adımı')),
      h('div', { class: 'stat' }, h('strong', {}, `${solo}/${r.steps.length}`), h('span', {}, 'yardımsız')),
      h('div', { class: 'stat' }, h('strong', {}, String(scene.cards.length)), h('span', {}, 'cümle tekrar kutunda'))),
    h('section', { class: 'stack' }, h('h2', {}, 'Gerçek hayat başarıları'),
      candos.map((s) => h('article', { class: 'card cando' }, h('span', { class: 'tick' }, icon('check')),
        h('div', { class: 'grow' }, h('h3', {}, s.cando), h('p', { class: 'small muted', lang: 'it' }, `«${s.said}»`),
          !s.solo ? h('p', { class: 'small muted' }, 'Yardımla — sorun değil, iletişimi kurdun.') : null)))),
    h('section', { class: 'stack' }, h('h2', {}, 'Yarın tekrar edeceğin cümleler'),
      scene.cards.slice(0, 3).map((id) => sentenceRow(cards[id]))),
    h('div', { class: 'card terra stack' },
      h('p', { class: 'it', lang: 'it' }, '«Non importa fare errori, l\'importante è farsi capire!»'),
      h('p', { class: 'small' }, 'Hata yapmak önemli değil; önemli olan derdini anlatabilmek.')),
    h('button', { class: 'btn block', onclick: () => ctx.go('home') }, 'Bugünlük tamam', icon('arrow')),
    h('button', { class: 'btn soft block', onclick: () => ctx.go('scenes') }, 'Bir senaryo daha'));
}

export function renderResult(ctx) {
  const r = ctx.lastResult;
  if (!r) { setTimeout(() => ctx.go('home')); return h('div'); }
  return r.type === 'review' ? reviewResult(ctx, r) : sceneResult(ctx, r);
}
