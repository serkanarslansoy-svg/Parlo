// Ekranlar arasında paylaşılan küçük bileşenler.
import { h, icon } from './lib/dom.js';
import { speak, canSpeak } from './lib/speech.js';

export function brandMark() {
  const img = h('img', { src: './logo-mark.svg', alt: '', class: 'brand-mark', width: 30, height: 30 });
  return img;
}

export function topbar({ subtitle, right } = {}) {
  return h('header', { class: 'topbar' },
    h('div', { class: 'brand' }, brandMark(),
      h('div', {}, h('span', {}, 'PARLO', h('span', { class: 'bang' }, '!')), subtitle && h('small', {}, subtitle))),
    right || null);
}

/** İtalyanca metni seslendiren buton. Tarayıcı desteklemiyorsa hiç gösterilmez. */
export function speakBtn(text, { slow = false, label = 'Dinle' } = {}) {
  if (!canSpeak()) return null;
  return h('button', {
    class: 'icon-btn', type: 'button', 'aria-label': `${label}: ${text}`,
    onclick: (e) => { e.stopPropagation(); speak(text, { slow }); },
  }, icon(slow ? 'turtle' : 'speaker'));
}

export function dots(pct, total = 5) {
  const on = Math.round((pct / 100) * total);
  return h('span', { class: `dots ${pct < 50 ? 'low' : ''}`, 'aria-label': `Ustalık %${pct}` },
    Array.from({ length: total }, (_, i) => h('i', { class: i < on ? 'on' : '' })));
}

export function masteryLabel(pct) {
  if (pct >= 100) return 'Kalıcı hafızada';
  if (pct >= 60) return 'Usta';
  if (pct >= 20) return 'Öğreniyor';
  return 'Yeni';
}

export function greeting(date = new Date()) {
  const hr = date.getHours();
  if (hr < 5) return 'Buonanotte';
  if (hr < 14) return 'Buongiorno';
  return 'Buonasera';
}

export function levelChip(level) {
  return h('span', { class: 'chip sun' }, level);
}
