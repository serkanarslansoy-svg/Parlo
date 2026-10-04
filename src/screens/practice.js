import { h, icon } from '../lib/dom.js';
import { cards } from '../content/index.js';
import { checkSentence, shuffle, tilesFor } from '../lib/answer.js';
import { today } from '../lib/store.js';
import { MODES, ROUND_SIZE, MATCH_SIZE, modeById, unlockedIds, pickRound, recordPractice, choicesFor } from '../lib/practice.js';

const MIX = { id: 'mix', label: 'Karışık', icon: 'shuffle' };
const MIX_KINDS = ['write', 'choose', 'swipe'];
const allCards = Object.values(cards);

/** Cümlelerim pratik turu: #/practice/<write|choose|swipe|match|mix>. */
export function renderPractice(ctx, param) {
  const mode = param === 'mix' ? MIX : modeById(param);
  if (!mode) { ctx.go('notebook'); return h('div'); }
  const back = () => ctx.go('notebook');
  const ids = unlockedIds(ctx.state);

  const header = (right) => h('header', { class: 'topbar' },
    h('div', { class: 'row grow' },
      h('button', { class: 'icon-btn plain', 'aria-label': 'Geri', onclick: back }, icon('back')),
      h('div', {}, h('p', { class: 'small muted' }, 'Cümlelerim · pratik'), h('h3', {}, mode.label))),
    right);

  if (!ids.length) {
    return h('div', { class: 'screen full' }, header(null),
      h('div', { class: 'card empty stack' }, h('p', { style: 'font-size:40px' }, '🔒'), h('h2', {}, 'Henüz açık cümle yok'),
        h('p', {}, 'Programda bir günü bitirince o günün cümleleri burada açılır.'),
        h('button', { class: 'btn block', onclick: () => ctx.go('day') }, 'Programa git', icon('arrow'))));
  }

  // Tur kuyruğu. Yanlış bilinen her öğe turun sonuna bir kez daha eklenir.
  const round = pickRound(ctx.state, ids, ROUND_SIZE);
  let queue;
  if (mode.id === 'match') {
    const uniq = [...new Set(round)];
    const extra = shuffle(ids).filter((id) => !uniq.includes(id));
    const pool = [...uniq, ...extra];
    const size = Math.min(MATCH_SIZE, ids.length);
    queue = [0, 1].map((b) => ({ kind: 'match', ids: pool.length >= size * 2 ? pool.slice(b * size, b * size + size) : shuffle(pool).slice(0, size) }));
  } else {
    queue = round.map((id, i) => ({ kind: mode.id === 'mix' ? MIX_KINDS[Math.floor(Math.random() * MIX_KINDS.length)] : mode.id, id, dir: i % 2 ? 'tr' : 'it' }));
  }
  const requeued = new Set();
  let pos = 0;
  let ok = 0;
  let total = 0;
  let xp = 0;
  const missed = new Set();

  const counter = h('span', { class: 'chip' });
  const barFill = h('i');
  const body = h('div', { class: 'stack' });

  const record = (id, good) => {
    total += 1;
    if (good) ok += 1; else missed.add(id);
    xp += recordPractice(ctx.state, id, good, today());
    ctx.persist();
  };
  const next = () => { pos += 1; if (pos < queue.length) show(); else finish(); };
  const again = (item) => {
    const key = item.id;
    if (requeued.has(key)) return;
    requeued.add(key);
    queue.push({ ...item, kind: item.kind === 'swipe' ? 'swipe' : 'write' });
  };

  function show() {
    const item = queue[pos];
    counter.textContent = `${pos + 1} / ${queue.length}`;
    barFill.style.width = `${Math.round((pos / queue.length) * 100)}%`;
    const view = { write: writeItem, choose: chooseItem, swipe: swipeItem, match: matchItem }[item.kind](item);
    body.replaceChildren(view);
    window.scrollTo(0, 0);
    view.querySelector('input')?.focus();
  }

  // --- Yazmalı: Türkçesini gör, İtalyancasını yaz ---
  function writeItem(item) {
    const card = cards[item.id];
    const words = tilesFor(card.it);
    let shown = 0;
    let done = false;
    const input = h('input', { class: 'input', type: 'text', lang: 'it', autocomplete: 'off', autocapitalize: 'sentences', spellcheck: 'false', placeholder: 'İtalyancasını yaz…', 'aria-label': 'İtalyanca cevabın' });
    const hint = h('p', { class: 'small muted', hidden: true });
    const feedback = h('div', { 'aria-live': 'polite' });
    const hintBtn = h('button', { class: 'btn secondary', type: 'button', onclick: () => {
      shown = Math.min(words.length, shown + 1);
      hint.hidden = false;
      hint.textContent = `İpucu: ${words.slice(0, shown).join(' ')}${shown < words.length ? ' …' : ''}`;
      if (shown >= words.length) hintBtn.disabled = true;
    } }, icon('bulb'), 'İpucu');
    const checkBtn = h('button', { class: 'btn grow', type: 'submit' }, 'Kontrol et');
    const actions = h('div', { class: 'row' }, hintBtn, checkBtn);
    const submit = (e) => {
      e.preventDefault();
      if (done) return next();
      const v = input.value.trim();
      if (!v) return input.focus();
      done = true;
      const r = checkSentence(v, card);
      const good = r.ok && shown < words.length;
      record(card.id, good);
      if (!good) again(item);
      input.disabled = true;
      feedback.replaceChildren(h('div', { class: `feedback ${r.ok ? 'good' : 'bad'} stack` },
        h('p', { class: 'title' }, r.ok ? (good ? 'Bravo! ✓' : 'Doğru, ipucuyla') : 'Neredeyse! Doğrusu:'),
        h('p', { class: 'it', lang: 'it' }, card.it),
        r.ok && r.accentNote ? h('p', { class: 'small' }, 'Küçük not: aksanlara dikkat.') : null,
        !good ? h('p', { class: 'small' }, 'Bu cümle turun sonunda tekrar gelecek.') : null));
      actions.replaceChildren(h('button', { class: 'btn block', type: 'submit' }, 'Devam et', icon('arrow')));
      actions.querySelector('button').focus();
    };
    return h('form', { class: 'stack', onsubmit: submit },
      h('section', { class: 'card stack' },
        h('p', { class: 'eyebrow' }, 'İtalyanca nasıl söylersin?'),
        h('p', { class: 'prompt' }, card.tr)),
      input, hint, feedback, actions);
  }

  // --- Seçmeli: 4 seçenek; sırayla Türkçe→İtalyanca ve İtalyanca→Türkçe ---
  function chooseItem(item) {
    const card = cards[item.id];
    const ask = item.dir === 'it' ? 'tr' : 'it';
    const answerField = item.dir;
    const opts = choicesFor(card, allCards, answerField);
    const feedback = h('div', { 'aria-live': 'polite' });
    const list = h('div', { class: 'stack' });
    let done = false;
    const pick = (value, btn) => {
      if (done) return;
      done = true;
      const good = value === card[answerField];
      record(card.id, good);
      if (!good) again(item);
      for (const b of list.querySelectorAll('button')) {
        b.disabled = true;
        if (b.dataset.v === card[answerField]) b.classList.add('right');
      }
      if (!good) btn.classList.add('wrong');
      feedback.replaceChildren(
        good ? null : h('div', { class: 'feedback bad stack' }, h('p', { class: 'title' }, 'Doğrusu yeşil olan.'), h('p', { class: 'small' }, `${card.it} = ${card.tr}`)),
        h('button', { class: 'btn block', onclick: next }, 'Devam et', icon('arrow')));
      if (good) setTimeout(() => { if (queue[pos] === item) next(); }, 700);
    };
    list.replaceChildren(...opts.map((v) => {
      const b = h('button', { class: 'opt', lang: answerField === 'it' ? 'it' : 'tr', dataset: { v }, onclick: () => pick(v, b) }, v);
      return b;
    }));
    return h('div', { class: 'stack' },
      h('section', { class: 'card stack' },
        h('p', { class: 'eyebrow' }, ask === 'tr' ? 'İtalyancası hangisi?' : 'Ne demek?'),
        h('p', { class: 'prompt', lang: ask === 'it' ? 'it' : 'tr' }, card[ask])),
      list, feedback);
  }

  // --- Kaydırmalı: kartı çevir; biliyorsan sağa, bilmiyorsan sola ---
  function swipeItem(item) {
    const card = cards[item.id];
    let flipped = false;
    let done = false;
    const back = h('p', { class: 'flash-tr', hidden: true }, card.tr);
    const tap = h('p', { class: 'small muted' }, 'Anlamını hatırla, sonra kartı çevirmek için dokun');
    const face = h('div', { class: 'flashcard', role: 'button', tabindex: 0, 'aria-label': 'Kartı çevir' },
      h('p', { class: 'flash-it', lang: 'it' }, card.it), back, tap);
    const decide = (good) => {
      if (done) return;
      done = true;
      record(card.id, good);
      if (!good) again(item);
      face.classList.add(good ? 'gone-right' : 'gone-left');
      setTimeout(next, 260);
    };
    const flip = () => { if (flipped) return; flipped = true; back.hidden = false; tap.textContent = 'Bildin mi? Sağa: biliyorum · Sola: tekrar'; };
    face.addEventListener('click', flip);
    face.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); }
      if (e.key === 'ArrowRight') decide(true);
      if (e.key === 'ArrowLeft') decide(false);
    });
    // Parmakla sürükleme
    let startX = null;
    let dx = 0;
    face.addEventListener('pointerdown', (e) => { startX = e.clientX; dx = 0; face.setPointerCapture?.(e.pointerId); });
    face.addEventListener('pointermove', (e) => {
      if (startX == null) return;
      dx = e.clientX - startX;
      face.style.transform = `translateX(${dx}px) rotate(${dx / 20}deg)`;
      face.classList.toggle('lean-right', dx > 40);
      face.classList.toggle('lean-left', dx < -40);
    });
    const release = () => {
      if (startX == null) return;
      startX = null;
      if (Math.abs(dx) > 90) { decide(dx > 0); return; }
      face.style.transform = '';
      face.classList.remove('lean-right', 'lean-left');
      if (Math.abs(dx) > 8) face.addEventListener('click', (e) => e.stopImmediatePropagation(), { once: true, capture: true });
    };
    face.addEventListener('pointerup', release);
    face.addEventListener('pointercancel', release);
    return h('div', { class: 'stack' },
      face,
      h('div', { class: 'row' },
        h('button', { class: 'btn secondary grow swipe-no', onclick: () => decide(false) }, icon('back'), 'Tekrar'),
        h('button', { class: 'btn grow', onclick: () => decide(true) }, 'Biliyorum', icon('arrow'))));
  }

  // --- Eşleştirme: soldan İtalyanca, sağdan Türkçe seç ---
  function matchItem(item) {
    const left = shuffle(item.ids);
    const right = shuffle(item.ids);
    const missedHere = new Set();
    let sel = null;
    let matched = 0;
    const status = h('p', { class: 'small muted', 'aria-live': 'polite' }, 'Bir İtalyanca cümle seç, sonra Türkçe karşılığına dokun.');
    const btn = (id, side) => h('button', { class: `mt ${side}`, lang: side === 'l' ? 'it' : 'tr', dataset: { id, side }, onclick: (e) => choose(e.currentTarget) },
      side === 'l' ? cards[id].it : cards[id].tr);
    const grid = h('div', { class: 'match-grid' },
      h('div', { class: 'stack' }, left.map((id) => btn(id, 'l'))),
      h('div', { class: 'stack' }, right.map((id) => btn(id, 'r'))));
    function choose(b) {
      if (b.disabled) return;
      if (!sel || sel.dataset.side === b.dataset.side) {
        sel?.classList.remove('sel');
        sel = b;
        b.classList.add('sel');
        return;
      }
      const a = sel;
      sel = null;
      a.classList.remove('sel');
      if (a.dataset.id === b.dataset.id) {
        const id = a.dataset.id;
        for (const x of [a, b]) { x.disabled = true; x.classList.add('done'); }
        record(id, !missedHere.has(id));
        matched += 1;
        if (matched === item.ids.length) {
          status.textContent = missedHere.size ? `Tamam! ${missedHere.size} eşleşmede zorlandın.` : 'Hepsi ilk seferde doğru! 🎉';
          grid.after(h('button', { class: 'btn block', onclick: next }, pos + 1 < queue.length ? 'Sonraki tablo' : 'Bitir', icon('arrow')));
        }
      } else {
        missedHere.add(a.dataset.side === 'l' ? a.dataset.id : b.dataset.id);
        for (const x of [a, b]) { x.classList.add('bad'); setTimeout(() => x.classList.remove('bad'), 450); }
        status.textContent = 'Bu ikisi eşleşmiyor, tekrar dene.';
      }
    }
    return h('div', { class: 'stack' }, status, grid);
  }

  function finish() {
    barFill.style.width = '100%';
    counter.textContent = 'Bitti';
    const pct = total ? Math.round((ok / total) * 100) : 0;
    const missList = [...missed].map((id) => cards[id]);
    body.replaceChildren(h('div', { class: 'stack' },
      h('section', { class: 'card done-card stack' },
        h('p', { style: 'font-size:36px' }, pct >= 80 ? '🏆' : pct >= 50 ? '💪' : '🌱'),
        h('h2', {}, `${ok} / ${total} doğru`),
        h('p', { class: 'small muted' }, pct >= 80 ? 'Harika gidiyorsun!' : 'Tekrar ettikçe oturacak. Bir tur daha?'),
        xp ? h('span', { class: 'chip gold' }, `+${xp} XP`) : null),
      missList.length ? h('section', { class: 'card stack' },
        h('p', { class: 'eyebrow' }, 'Zorlandıkların (bir sonraki turda daha sık gelecek)'),
        ...missList.map((c) => h('div', {}, h('p', { class: 'it', lang: 'it' }, c.it), h('p', { class: 'tr' }, c.tr)))) : null,
      h('button', { class: 'btn block', onclick: () => ctx.refresh() }, icon('repeat'), 'Bir tur daha'),
      h('button', { class: 'btn secondary block', onclick: () => ctx.go(`practice/${mode.id === 'mix' ? 'write' : 'mix'}`) }, mode.id === 'mix' ? 'Yazmalı tur' : 'Karışık tur'),
      h('button', { class: 'btn ghost block', onclick: back }, 'Cümlelerim\'e dön')));
  }

  show();
  return h('div', { class: 'screen full' },
    header(counter),
    h('div', { class: 'bar' }, barFill),
    body);
}

export { MODES, MIX };
