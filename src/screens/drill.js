import { h, icon } from '../lib/dom.js';
import { checkSentence } from '../lib/answer.js';
import { speak, canListen, listen } from '../lib/speech.js';
import { award, POINTS } from '../lib/points.js';
import { dayPlan, completeStep, addMistake } from '../lib/program.js';
import { today } from '../lib/store.js';
import { speakBtn } from '../ui.js';

/** 3. adım (sahnesiz günler): kısa soru-cevap. Soruyu oku, kendi cevabını yaz, örnek cevaplarla karşılaştır. */
export function renderDrill(ctx, param) {
  const n = Number(param);
  const plan = dayPlan(n);
  if (!plan || !plan.talk.drill) { ctx.go(`day/${n || ''}`); return h('div'); }
  const qs = plan.talk.drill;
  const back = () => ctx.go(`day/${n}`);
  let pos = 0;
  let xp = 0;
  let easy = 0;

  const counter = h('span', { class: 'chip' });
  const segments = h('div', { class: 'segments', style: `grid-template-columns:repeat(${qs.length},1fr)` });
  const body = h('div', { class: 'stack' });

  const finish = () => {
    const t = today();
    const { bonus } = completeStep(ctx.state, n, 'talk', t);
    ctx.persist();
    ctx.flash = `Konuşma tamam: ${easy} / ${qs.length} soruya rahat cevap verdin · +${xp + bonus} XP.`;
    back();
  };

  function show() {
    const q = qs[pos];
    counter.textContent = `${pos + 1} / ${qs.length}`;
    segments.replaceChildren(...qs.map((_, i) => h('i', { class: i < pos ? 'on' : '' })));
    const target = { it: q.models[0], alt: q.models.slice(1) };
    let stop = null;
    let graded = false;

    const trLine = h('p', { class: 'muted', hidden: true }, q.tr);
    const said = h('p', { class: 'small', 'aria-live': 'polite' });
    const input = h('input', { class: 'input', type: 'text', lang: 'it', autocomplete: 'off', autocapitalize: 'sentences', placeholder: 'Cevabını İtalyanca yaz…', 'aria-label': 'Cevabın' });
    const answerBox = h('div', { class: 'stack', hidden: true });

    const grade = (ok) => {
      if (graded) return;
      graded = true;
      const t = today();
      xp += award(ctx.state, ok ? POINTS.drillOk : POINTS.drillHard, t);
      if (ok) easy += 1; else addMistake(ctx.state, n, q.models[0], '');
      ctx.persist();
      pos += 1;
      if (pos < qs.length) show(); else finish();
    };

    const reveal = (text) => {
      if (text != null) said.textContent = text ? `Senin cevabın: «${text}»` : '';
      const hit = text && checkSentence(text, target).ok;
      answerBox.hidden = false;
      answerBox.replaceChildren(
        hit ? h('div', { class: 'card flash' }, icon('check'), h('p', {}, 'Örnek cevapla birebir aynı. Bravo!')) : null,
        h('p', { class: 'eyebrow' }, 'Böyle de cevap verebilirsin'),
        ...q.models.map((m) => h('div', { class: 'card row', style: 'padding:12px 14px' }, h('p', { class: 'grow', lang: 'it' }, m), speakBtn(m))),
        h('p', { class: 'small muted' }, text ? 'Kendi cevabın da doğru olabilir. Nasıl geçti?' : 'Örneklerden birini aklına yaz. Bu soru hata defterine girer.'),
        text
          ? h('div', { class: 'row' },
            h('button', { class: 'btn secondary grow', onclick: () => grade(false) }, `Zorlandım · +${POINTS.drillHard}`),
            h('button', { class: 'btn grow', onclick: () => grade(true) }, `Rahat söyledim · +${POINTS.drillOk}`))
          : h('button', { class: 'btn block', onclick: () => grade(false) }, `Anladım, devam · +${POINTS.drillHard}`));
      controls.hidden = true;
    };

    const mic = canListen() ? h('button', { class: 'btn terra', type: 'button', onclick: () => {
      if (stop) { stop(); return; }
      said.textContent = 'Dinliyorum…';
      mic.classList.add('live');
      stop = listen({
        onText: (txt) => reveal(txt),
        onError: () => { said.textContent = 'Sesini duyamadım. Tekrar dene ya da yaz.'; },
        onEnd: () => { stop = null; mic.classList.remove('live'); },
      });
    } }, icon('mic'), 'Söyle') : null;

    const form = h('form', { class: 'row', onsubmit: (e) => { e.preventDefault(); if (input.value.trim()) reveal(input.value.trim()); } },
      h('div', { class: 'grow' }, input), h('button', { class: 'btn', type: 'submit', 'aria-label': 'Gönder' }, icon('arrow')));
    const controls = h('div', { class: 'stack' },
      h('div', { class: 'row' }, mic, h('button', { class: 'btn ghost grow', type: 'button', onclick: () => reveal('') }, 'Cevabı göster')),
      form);

    body.replaceChildren(
      h('section', { class: 'card learn-card stack' },
        h('div', { class: 'row between' },
          h('span', { class: 'chip green' }, plan.talk.title),
          h('span', { class: 'row' }, speakBtn(q.q), speakBtn(q.q, { slow: true, label: 'Yavaş dinle' }))),
        h('p', { class: 'learn-it', lang: 'it' }, q.q),
        trLine,
        h('button', { class: 'link small', type: 'button', onclick: (e) => { trLine.hidden = !trLine.hidden; e.currentTarget.textContent = trLine.hidden ? 'Türkçesini göster' : 'Türkçesini gizle'; } }, 'Türkçesini göster')),
      said,
      controls,
      answerBox);
    setTimeout(() => speak(q.q, { slow: Boolean(ctx.state.settings?.slow) }), 250);
    window.scrollTo(0, 0);
  }

  show();
  return h('div', { class: 'screen full' },
    h('header', { class: 'topbar' },
      h('div', { class: 'row grow' },
        h('button', { class: 'icon-btn plain', 'aria-label': 'Geri', onclick: back }, icon('back')),
        h('div', {}, h('p', { class: 'small muted' }, `Gün ${n} · 3. adım`), h('h3', {}, 'Konuşma'))),
      counter),
    segments,
    h('p', { class: 'small muted' }, 'Soruyu oku ve kendi hayatına göre İtalyanca cevap yaz. Mükemmel olmak zorunda değil; önemli olan kendi cümleni kurman.'),
    body);
}
