// Ekranlar arasında paylaşılan küçük bileşenler.
import { h, icon } from './lib/dom.js';
import { speak, canSpeak } from './lib/speech.js';

export function brandMark() {
  const img = h('img', { src: './logo-mark.png', alt: '', class: 'brand-mark', width: 32, height: 32 });
  return img;
}

let defaultRight = null;
/** Tüm ekranların üst çubuğunda sağda gösterilecek öğe (aktif oyuncu rozeti). */
export function setTopbarRight(fn) { defaultRight = fn; }

export function topbar({ subtitle, right } = {}) {
  return h('header', { class: 'topbar' },
    h('div', { class: 'brand' }, brandMark(),
      h('div', {}, h('span', {}, 'PARLO', h('span', { class: 'bang' }, '!')), subtitle && h('small', {}, subtitle))),
    right || defaultRight?.() || null);
}

/** Oyuncu avatarı: renkli daire içinde hayvan emojisi. */
export function avatar(profile, size = 44) {
  return h('span', { class: 'pavatar', style: `--c:${profile.color};width:${size}px;height:${size}px;font-size:${Math.round(size * 0.55)}px`, 'aria-hidden': 'true' }, profile.avatar);
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

/** Tarayıcı onay penceresi yerine iki dokunuşlu onay: ilk dokunuş uyarır, ikincisi işlemi yapar. */
export function confirmButton(attrs, content, armedLabel, action) {
  let armed = false;
  let timer = null;
  const btn = h('button', { ...attrs, onclick: (e) => {
    e.stopPropagation();
    if (armed) { clearTimeout(timer); action(); return; }
    armed = true;
    btn.classList.add('armed');
    btn.replaceChildren(armedLabel);
    timer = setTimeout(() => { armed = false; btn.classList.remove('armed'); btn.replaceChildren(...[].concat(content)); }, 4000);
  } }, ...[].concat(content));
  return btn;
}
