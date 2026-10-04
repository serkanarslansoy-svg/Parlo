import { h, icon } from '../lib/dom.js';
import { checkSentence } from '../lib/answer.js';
import { canListen, listen } from '../lib/speech.js';

export const SAY_TIMES = 3;

/**
 * "3 kez sesli söyle" paneli. Mikrofonla doğru söylenirse hepsi dolar; yoksa her dokunuş bir sayılır.
 * onReady(), sayaç dolduğunda bir kez çağrılır.
 */
export function sayPanel(card, onReady) {
  let said = 0;
  let stop = null;
  const dots = h('div', { class: 'say-dots', role: 'img' });
  const status = h('p', { class: 'small muted', 'aria-live': 'polite' }, 'Dinle, sonra yüksek sesle söyle.');
  const draw = () => {
    dots.setAttribute('aria-label', `${said} / ${SAY_TIMES} kez söylendi`);
    dots.replaceChildren(...Array.from({ length: SAY_TIMES }, (_, i) => h('i', { class: i < said ? 'on' : '' })));
    if (said >= SAY_TIMES) { status.textContent = 'Harika! Bu cümle artık senin.'; onReady?.(); onReady = null; }
  };
  const once = () => { if (said < SAY_TIMES) { said += 1; draw(); } };

  const mic = canListen() ? h('button', { class: 'btn terra', type: 'button', onclick: () => {
    if (stop) { stop(); return; }
    status.textContent = 'Dinliyorum… cümleyi söyle.';
    mic.classList.add('live');
    stop = listen({
      onText: (txt) => {
        if (checkSentence(txt, card).ok) { said = SAY_TIMES - 1; status.textContent = `Duydum: «${txt}». Mükemmel!`; once(); }
        else { status.textContent = `Duydum: «${txt}». Bir daha dene; doğrusu yukarıda.`; once(); }
      },
      onError: () => { status.textContent = 'Sesini duyamadım. Tekrar dene ya da «Söyledim»e dokun.'; },
      onEnd: () => { stop = null; mic.classList.remove('live'); },
    });
  } }, icon('mic'), 'Söyle') : null;

  draw();
  return h('section', { class: 'card cream stack' },
    h('div', { class: 'row between' }, h('h3', {}, `${SAY_TIMES} kez sesli söyle`), dots),
    status,
    h('div', { class: 'row' }, mic, h('button', { class: 'btn secondary grow', type: 'button', onclick: once }, 'Söyledim ✓')));
}
