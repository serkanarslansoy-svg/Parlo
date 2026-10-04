import { h, icon } from '../lib/dom.js';
import { scenes, cards } from '../content/index.js';
import { streak, reset } from '../lib/store.js';
import { topbar } from '../ui.js';

const BUCKETS = [
  { label: 'Yeni', test: (b) => b === 0 },
  { label: 'Öğreniyor', test: (b) => b >= 1 && b <= 2 },
  { label: 'Usta', test: (b) => b >= 3 && b <= 4 },
  { label: 'Kalıcı hafızada', test: (b) => b >= 5 },
];

export function renderProgress(ctx) {
  const { state } = ctx;
  const known = Object.entries(state.cards).filter(([id]) => cards[id]);
  const strong = known.filter(([, c]) => c.box >= 3).length;
  const runs = Object.values(state.scenes).reduce((s, x) => s + x.runs, 0);
  const stat = (value, label) => h('div', { class: 'stat' }, h('strong', {}, String(value)), h('span', {}, label));

  const cando = scenes.filter((s) => state.scenes[s.id]?.cando?.length);
  const candoSection = h('section', { class: 'stack' },
    h('h2', {}, 'Artık bunları yapabiliyorsun'),
    cando.length
      ? cando.map((s) => h('article', { class: 'card stack' },
        h('div', { class: 'row' }, h('span', { style: 'font-size:22px', 'aria-hidden': 'true' }, s.emoji), h('h3', { class: 'grow' }, s.tr), h('span', { class: 'small muted' }, `${state.scenes[s.id].runs} kez`)),
        state.scenes[s.id].cando.map((c) => h('div', { class: 'cando' }, h('span', { class: 'tick' }, icon('check')), h('p', {}, c)))))
      : h('div', { class: 'card empty' }, 'İlk senaryonu tamamladığında burada gerçek hayatta yapabildiğin şeyler listelenecek.'));

  const total = known.length || 1;
  const memory = h('section', { class: 'card stack' },
    h('h3', {}, 'Cümle hafızası'),
    BUCKETS.map((b) => {
      const n = known.filter(([, c]) => b.test(c.box)).length;
      return h('div', { class: 'stack' },
        h('div', { class: 'row between small' }, h('span', {}, b.label), h('span', { class: 'muted' }, String(n))),
        h('div', { class: 'bar' }, h('i', { style: `width:${Math.round((n / total) * 100)}%` })));
    }),
    h('p', { class: 'small muted' }, 'Doğru bildiğin cümle bir sonraki kutuya geçer ve daha seyrek sorulur (1 → 3 → 7 → 14 → 30 gün). Yanlışta başa döner.'));

  return h('div', { class: 'screen' },
    topbar({ subtitle: 'Gelişim' }),
    h('section', {}, h('p', { class: 'eyebrow' }, 'İlerlemem'), h('h1', {}, 'Gelişim'),
      h('p', { class: 'muted', style: 'margin-top:6px' }, 'Puan değil, gerçekten kurabildiğin cümleler önemli.')),
    h('div', { class: 'stats' }, stat(streak(state), 'gün seri'), stat(strong, 'cümle hafızada'), stat(runs, 'konuşma')),
    candoSection,
    memory,
    h('section', { class: 'card cream stack' },
      h('p', { class: 'small muted' }, 'Verilerin sadece bu cihazda, bu tarayıcıda saklanır.'),
      h('button', { class: 'btn secondary block', onclick: () => {
        if (!confirm('Tüm ilerleme ve notların silinsin mi? Bu geri alınamaz.')) return;
        reset();
        location.hash = '#/home';
        location.reload();
      } }, 'Verilerimi sıfırla')));
}
