import { h, icon } from '../lib/dom.js';
import { checkSentence, typoNote } from '../lib/answer.js';

/**
 * "Yazarak tekrar et" paneli: cümle bir kez doğru yazılınca onReady() çağrılır.
 * Ses kapalıyken yeni kalıp ve hata düzeltme adımları bunu kullanır.
 */
export function sayPanel(card, onReady) {
  let done = false;
  const input = h('input', { class: 'input', type: 'text', lang: 'it', autocomplete: 'off', autocapitalize: 'sentences', spellcheck: 'false', placeholder: 'İtalyancasını yaz…', 'aria-label': `Yaz: ${card.it}` });
  const status = h('p', { class: 'small muted', 'aria-live': 'polite' }, 'Cümleyi kendin yaz. Büyük harf ve noktalama önemli değil.');
  const mark = h('span', { class: 'say-ok', hidden: true }, icon('check'));
  const check = (e) => {
    e?.preventDefault();
    if (done) return;
    const v = input.value.trim();
    if (!v) { input.focus(); return; }
    const r = checkSentence(v, card);
    if (r.ok) {
      done = true;
      input.disabled = true;
      mark.hidden = false;
      status.textContent = r.typos.length ? typoNote(r.typos) : r.accentNote ? 'Doğru! Küçük not: aksanlara dikkat.' : 'Bravo! Doğru yazdın.';
      onReady?.();
    } else {
      status.textContent = 'Tam değil. Yukarıdaki cümleye bakıp tekrar dene.';
    }
  };
  return h('form', { class: 'card cream stack', onsubmit: check },
    h('div', { class: 'row between' }, h('h3', {}, 'Yazarak tekrar et'), mark),
    status,
    h('div', { class: 'row' }, h('div', { class: 'grow' }, input), h('button', { class: 'btn', type: 'submit', 'aria-label': 'Kontrol et' }, icon('check'))));
}
