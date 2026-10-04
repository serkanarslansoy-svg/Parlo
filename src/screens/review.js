import { h, icon } from '../lib/dom.js';
import { cards, allCardIds, dailyScene, patternById } from '../content/index.js';
import { checkSentence, tilesFor, shuffle, distractorsFor } from '../lib/answer.js';
import { buildQueue, grade, newCard, isDue, addDays } from '../lib/srs.js';
import { speak } from '../lib/speech.js';
import { today, touchDay } from '../lib/store.js';
import { speakBtn } from '../ui.js';
import { award, POINTS } from '../lib/points.js';
import { claimDailyBonus } from './home.js';
import { completeStep, addMistake, learnedBefore } from '../lib/program.js';

function makeQueue(state, mode, progN) {
  const t = today();
  if (progN) {
    // Program: vadesi gelenler (1-3-7 kuralı); yoksa önceki günlerin en zayıf cümleleri.
    const due = Object.entries(state.cards).filter(([id, c]) => cards[id] && isDue(c, t)).sort((a, b) => a[1].due.localeCompare(b[1].due) || a[1].box - b[1].box).map(([id]) => id);
    if (due.length) return due.slice(0, 10);
    return learnedBefore(progN).filter((id) => state.cards[id]).sort((a, b) => state.cards[a].box - state.cards[b].box).slice(0, 5);
  }
  if (mode === 'due') {
    return Object.entries(state.cards)
      .filter(([id, c]) => cards[id] && isDue(c, t))
      .sort((a, b) => a[1].box - b[1].box)
      .slice(0, 10)
      .map(([id]) => id);
  }
  return buildQueue({ srsCards: state.cards, sceneCardIds: dailyScene(t).cards, allCardIds, today: t });
}

export function renderReview(ctx, query) {
  const daily = query.get('daily') === '1';
  const progN = Number(query.get('program')) || null;
  const queue = makeQueue(ctx.state, query.get('mode'), progN);
  const back = () => ctx.go(progN ? `day/${progN}` : 'home');

  if (!queue.length && progN) {
    const skip = () => {
      completeStep(ctx.state, progN, 'review', today());
      ctx.persist();
      ctx.flash = 'Tekrar adımı tamam. Bugün tekrar edilecek cümle yoktu.';
      ctx.go(`day/${progN}`);
    };
    return h('div', { class: 'screen full' },
      h('header', { class: 'topbar' }, h('button', { class: 'icon-btn plain', 'aria-label': 'Geri', onclick: back }, icon('back')), h('h3', { class: 'grow' }, `Gün ${progN} · Tekrar`)),
      h('div', { class: 'card empty stack' }, h('p', { style: 'font-size:40px' }, '🌱'), h('h2', {}, 'Henüz tekrar edilecek cümle yok'),
        h('p', {}, 'Bugün öğrendiğin cümleler yarın, 3 gün ve 7 gün sonra burada tekrar karşına çıkacak.'),
        h('button', { class: 'btn block', onclick: skip }, 'Sonraki adım', icon('arrow'))));
  }

  if (!queue.length) {
    return h('div', { class: 'screen full' },
      h('header', { class: 'topbar' }, h('button', { class: 'icon-btn plain', 'aria-label': 'Geri', onclick: back }, icon('back')), h('h3', { class: 'grow' }, 'Hızlı tekrar')),
      h('div', { class: 'card empty stack' }, h('p', { style: 'font-size:40px' }, '🎉'), h('h2', {}, 'Tekrar kutun boş'), h('p', {}, 'Bugün tekrar edilecek cümle kalmadı. Bravissimo!'),
        h('button', { class: 'btn block', onclick: back }, 'Ana sayfaya dön')));
  }

  let pos = 0;
  const results = [];
  const counter = h('span', { class: 'chip' });
  const segments = h('div', { class: 'segments', style: `grid-template-columns:repeat(${queue.length},1fr)` });
  const body = h('div', { class: 'stack' });

  function question() {
    const id = queue[pos];
    const card = cards[id];
    const known = ctx.state.cards[id];
    const mode = known && known.box >= 2 ? 'type' : 'build';
    const pattern = card.pattern ? patternById(card.pattern) : null;
    let picks = [];
    let hinted = false;
    let answered = false;
    // Kısa cümlelerde dizme anlamsız kalmasın diye her zaman 2 çeldirici kelime eklenir.
    const words = [...tilesFor(card.it), ...distractorsFor(card.it, Object.values(cards).map((c) => c.it))];
    const order = shuffle(words.map((_, i) => i));

    counter.textContent = `${pos + 1} / ${queue.length}`;
    segments.replaceChildren(...queue.map((_, i) => h('i', { class: i < pos ? 'on' : '' })));

    const answerBox = h('div', { class: 'answer-box', 'aria-label': 'Cevabın' });
    const tilesEl = h('div', { class: 'tiles' });
    const typed = h('input', { class: 'input', placeholder: 'İtalyancasını yaz…', autocomplete: 'off', spellcheck: 'false', lang: 'it', 'aria-label': 'İtalyanca cevabın' });
    const hintSlot = h('div');
    const feedback = h('div', { 'aria-live': 'polite' });
    const checkBtn = h('button', { class: 'btn block grow', disabled: true, onclick: check }, 'Kontrol et', icon('arrow'));
    const hintBtn = h('button', { class: 'btn secondary', onclick: showHint }, icon('bulb'), 'İpucu');
    const actions = h('div', { class: 'row' }, hintBtn, checkBtn);

    function drawTiles() {
      answerBox.replaceChildren(...(picks.length
        ? picks.map((wi, k) => h('button', { class: 'tile', disabled: answered, onclick: () => { picks.splice(k, 1); drawTiles(); } }, words[wi]))
        : [h('span', { class: 'placeholder' }, 'Kelimelere dokunarak cümleyi kur')]));
      tilesEl.replaceChildren(...order.map((wi) => h('button', { class: 'tile', disabled: answered || picks.includes(wi), onclick: () => { picks.push(wi); drawTiles(); } }, words[wi])));
      checkBtn.disabled = picks.length === 0;
    }
    typed.addEventListener('input', () => { checkBtn.disabled = !typed.value.trim(); });
    typed.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !checkBtn.disabled && !answered) check(); });

    function showHint() {
      hinted = true;
      hintBtn.disabled = true;
      const first = words[0];
      hintSlot.replaceChildren(h('div', { class: 'coach-tip' }, icon('bulb'), h('span', {},
        pattern ? `Kalıp: ${pattern.head} ${pattern.slot} — ${pattern.tr}. ` : '', `Cümle «${first}» ile başlıyor.`)));
    }

    function check() {
      if (answered) return;
      answered = true;
      const value = mode === 'type' ? typed.value : picks.map((i) => words[i]).join(' ');
      const { ok, accentNote } = checkSentence(value, card);
      const t = today();
      const prev = ctx.state.cards[id] || newCard(t);
      // İpucuyla doğru: kutu yükselmez, yarın tekrar sorulur.
      ctx.state.cards[id] = ok && hinted ? { ...prev, due: addDays(t, 1), right: prev.right + 1 } : grade(prev, ok, t);
      const pts = award(ctx.state, ok ? (hinted ? POINTS.reviewHint : POINTS.reviewOk) : 0, t);
      results.push({ id, ok, hinted, pts });
      ctx.persist();
      speak(card.it, { slow: Boolean(ctx.state.settings?.slow) });
      if (mode === 'type') typed.disabled = true;
      else drawTiles();
      feedback.replaceChildren(h('div', { class: `feedback ${ok ? 'good' : 'bad'} stack` },
        h('div', { class: 'row between' }, h('p', { class: 'title' }, ok ? (hinted ? 'Doğru! (ipucuyla)' : 'Bravissimo! ✓') : 'Neredeyse! Doğru hâli:'), pts ? h('span', { class: 'chip gold' }, `+${pts} XP`) : null),
        h('div', { class: 'row' }, h('div', { class: 'grow' }, h('p', { class: 'it', lang: 'it' }, card.it), h('p', { class: 'tr' }, card.tr)), speakBtn(card.it), speakBtn(card.it, { slow: true, label: 'Yavaş dinle' })),
        ok && accentNote ? h('p', { class: 'small' }, 'Küçük not: aksan ve kesme işaretlerine dikkat — yazılışı yukarıdaki gibi.') : null,
        !ok ? h('p', { class: 'small' }, 'Bu cümle yakında tekrar karşına çıkacak.') : null));
      actions.replaceChildren(h('button', { class: 'btn block', onclick: next }, pos + 1 < queue.length ? 'Devam et' : 'Bitir', icon('arrow')));
      actions.querySelector('button').focus();
    }

    body.replaceChildren(
      h('section', { class: 'card stack' },
        h('div', { class: 'row between' },
          pattern ? h('span', { class: 'chip green' }, `${pattern.head} ${pattern.slot}`.trim()) : h('span', { class: 'chip' }, 'Günlük ifade'),
          known ? null : h('span', { class: 'chip terra' }, 'Yeni')),
        h('p', { class: 'eyebrow' }, mode === 'type' ? 'Kendin yaz' : 'Kelimeleri sırala'),
        h('p', { class: 'prompt' }, `«${card.tr}»`),
        hintSlot,
        mode === 'type' ? typed : h('div', { class: 'stack' }, answerBox, tilesEl),
        feedback),
      actions);
    if (mode === 'build') drawTiles();
    else setTimeout(() => typed.focus(), 50);
  }

  function next() {
    pos += 1;
    if (pos < queue.length) { question(); window.scrollTo(0, 0); return; }
    touchDay(ctx.state, { review: results.length, dailyReview: daily });
    if (progN) {
      for (const r of results) if (!r.ok) addMistake(ctx.state, progN, cards[r.id].it, cards[r.id].tr);
      const { bonus } = completeStep(ctx.state, progN, 'review', today());
      ctx.persist();
      const xp = results.reduce((s, r) => s + r.pts, 0) + bonus;
      ctx.flash = `Tekrar tamam: ${results.filter((r) => r.ok).length}/${results.length} doğru · +${xp} XP`;
      ctx.go(`day/${progN}`);
      return;
    }
    const bonus = claimDailyBonus(ctx.state);
    ctx.persist();
    ctx.lastResult = { type: 'review', results, daily, bonus, points: results.reduce((s, r) => s + r.pts, 0) + bonus };
    ctx.go('result');
  }

  question();
  return h('div', { class: 'screen full' },
    h('header', { class: 'topbar' },
      h('div', { class: 'row grow' },
        h('button', { class: 'icon-btn plain', 'aria-label': 'Geri', onclick: back }, icon('back')),
        h('div', {}, h('p', { class: 'small muted' }, progN ? `Gün ${progN} · 1. adım` : daily ? 'Günün dersi · 1/2' : 'Tekrar kutusu'), h('h3', {}, 'Hızlı tekrar'))),
      counter),
    segments,
    h('h1', {}, 'Hadi hatırlayalım!'),
    body);
}
