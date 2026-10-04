// Küçük DOM yardımcıları. Kullanıcı metni her zaman textContent ile eklenir (innerHTML yok).
import { ICONS } from './icons.js';

/**
 * h('button', {class: 'btn', onclick: fn}, 'Metin', otherNode)
 * attrs içinde: class, style (string), on* (fonksiyon), dataset (obje), diğerleri setAttribute.
 */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'value') el.value = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

/** Satır içi SVG ikon (ikonlar kod içinde sabit, kullanıcı verisi değil). */
export function icon(name, cls = '') {
  const span = document.createElement('span');
  span.className = `ico ${cls}`.trim();
  span.setAttribute('aria-hidden', 'true');
  span.innerHTML = ICONS[name] || '';
  return span;
}

export const $ = (sel, root = document) => root.querySelector(sel);
