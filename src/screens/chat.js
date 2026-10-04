import { h, icon } from '../lib/dom.js';
import { sceneById, cards, patternById } from '../content/index.js';
import { matchIntent, tipsFor } from '../lib/answer.js';
import { speak, canListen, listen } from '../lib/speech.js';
import { newCard, addDays } from '../lib/srs.js';
import { today, touchDay } from '../lib/store.js';
import { speakBtn, brandMark } from '../ui.js';
import { award, POINTS } from '../lib/points.js';
import { claimDailyBonus } from './home.js';

/** Alt sayfa (bottom sheet). Kapatma fonksiyonu döner. */
export function openSheet(...children) {
  const close = () => { scrim.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = (e) => e.key === 'Escape' && close();
  const sheet = h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true', tabindex: '-1' }, h('div', { class: 'grab' }), ...children);
  const scrim = h('div', { class: 'scrim', onclick: (e) => e.target === scrim && close() }, sheet);
  document.addEventListener('keydown', onKey);
  document.body.append(scrim);
  // Paneli açan Enter tuşu odaklanan ilk butonu da tetiklemesin diye odak panelin kendisine verilir.
  sheet.focus();
  return close;
}

const clock = () => new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

/** Ana yol (her düğümde ilk niyet) kaç adım sürüyor: ilerleme çubuğu için. */
export function mainPathLength(scene) {
  let id = scene.start;
  let n = 0;
  const seen = new Set();
  while (!scene.nodes[id].end && !seen.has(id)) {
    seen.add(id);
    n += 1;
    id = scene.nodes[id].intents[0].next;
  }
  return n;
}

function aiMessage(scene, text, tr, { slow }) {
  const trEl = h('p', { class: 'tr', hidden: true }, tr);
  const label = h('span', {}, 'Türkçe anlamını göster');
  const toggle = h('button', { class: 'tr-toggle', type: 'button', 'aria-expanded': 'false', onclick: () => {
    trEl.hidden = !trEl.hidden;
    toggle.setAttribute('aria-expanded', String(!trEl.hidden));
    label.textContent = trEl.hidden ? 'Türkçe anlamını göster' : 'Türkçeyi gizle';
  } }, icon('translate'), label);
  return h('div', { class: 'msg' },
    h('p', { class: 'msg-meta' }, h('strong', {}, scene.persona.name), clock()),
    h('div', { class: 'bubble' },
      h('div', { class: 'row top' },
        h('p', { class: 'it grow', lang: 'it' }, `«${text}»`),
        h('button', { class: 'icon-btn soft', type: 'button', 'aria-label': `Dinle: ${text}`, onclick: () => speak(text, { slow: slow() }) }, icon('speaker'))),
      trEl,
      toggle));
}

function meMessage(text, { voice }) {
  const note = h('p', { class: 'note' });
  const el = h('div', { class: 'msg me' },
    h('p', { class: 'msg-meta' }, clock(), h('strong', {}, 'Sen')),
    h('div', { class: 'bubble' }, h('p', { class: 'it', lang: 'it' }, `«${text}»`), note));
  const mark = (ico, text) => note.replaceChildren(h('span', { class: 'row' }, icon(ico), text), ...(voice ? [h('span', { class: 'pill' }, icon('mic'), 'Sesle')] : []));
  el.markOk = () => mark('check', 'Anlaşıldı');
  el.markRetry = () => mark('repeat', 'Tekrar deneyelim');
  el.addPoints = (n) => note.append(h('span', { class: 'pill gold' }, `+${n}`));
  return el;
}

export function renderChat(ctx, sceneId, query) {
  const scene = sceneById(sceneId);
  if (!scene) { ctx.go('scenes'); return h('div'); }
  const daily = query.get('daily') === '1';

  const run = { node: scene.start, steps: [], helpUsed: false, tries: 0, finished: false };
  const slow = () => Boolean(ctx.state.settings?.slow);
  const mainLen = mainPathLength(scene);
  const log = h('div', { class: 'log', 'aria-live': 'polite' });
  const helpers = h('section', { class: 'helpers-area stack' });
  const stepLabel = h('span', { class: 'step-label' });
  const goalLabel = h('span', { class: 'goal' });
  const bar = h('i');
  const status = h('span', { class: 'status' });
  const input = h('input', { class: 'grow', placeholder: 'İtalyanca cevabını yaz…', autocomplete: 'off', autocapitalize: 'sentences', spellcheck: 'false', lang: 'it', 'aria-label': 'İtalyanca cevabın' });
  let lastVoice = false;

  const node = () => scene.nodes[run.node];
  const scrollDown = () => requestAnimationFrame(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
  const addTip = (text, ico = 'bulb') => { log.append(h('div', { class: 'coach-tip' }, icon(ico), h('span', {}, text))); scrollDown(); };
  const setStatus = (text) => status.replaceChildren(icon('wave'), text);
  const focusInput = () => input.focus({ preventScroll: true });

  function updateHeader() {
    const total = Math.max(mainLen, run.steps.length + (run.finished ? 0 : 1));
    const current = run.finished ? total : run.steps.length + 1;
    stepLabel.textContent = `Adım ${current} / ${total}`;
    goalLabel.textContent = run.finished ? 'Görev tamamlandı' : `Görev: ${node().goal}`;
    bar.style.width = `${Math.round(((run.finished ? total : run.steps.length) / total) * 100)}%`;
  }

  function aiSays(n) {
    log.append(aiMessage(scene, n.ai, n.tr, { slow }));
    speak(n.ai, { slow: slow() });
    updateHeader();
    setStatus(n.end ? `${scene.persona.name} vedalaşıyor` : `${scene.persona.name} seni bekliyor…`);
    drawHelpers();
    scrollDown();
  }

  function finish() {
    run.finished = true;
    updateHeader();
    const st = ctx.state;
    const rec = st.scenes[scene.id] || { runs: 0, cando: [] };
    rec.runs += 1;
    for (const s of run.steps) if (s.cando && !rec.cando.includes(s.cando)) rec.cando.push(s.cando);
    st.scenes[scene.id] = rec;
    const t = today();
    for (const id of scene.cards) if (!st.cards[id]) st.cards[id] = { ...newCard(t), due: addDays(t, 1) };
    touchDay(st, { scene: scene.id });
    const sceneBonus = award(st, POINTS.sceneDone, t);
    const bonus = claimDailyBonus(st, t);
    ctx.persist();
    ctx.lastResult = { type: 'scene', sceneId: scene.id, steps: run.steps, daily, bonus, sceneBonus, points: run.steps.reduce((s, x) => s + x.pts, 0) + sceneBonus + bonus };
    log.append(h('div', { class: 'system' }, 'Görev tamamlandı 🎉'));
    helpers.replaceChildren();
    dock.replaceChildren(h('button', { class: 'btn block', onclick: () => ctx.go('result') }, 'Sonucu gör', icon('arrow')));
    scrollDown();
  }

  function accept(intent, text, bubble) {
    bubble.markOk();
    const solo = !run.helpUsed && run.tries === 0;
    const pts = award(ctx.state, solo ? POINTS.stepSolo : POINTS.stepHelp, today());
    run.steps.push({ said: text, model: intent.model, cando: intent.cando || null, solo, pts });
    bubble.addPoints?.(pts);
    run.helpUsed = false;
    run.tries = 0;
    for (const tip of tipsFor(text, intent)) addTip(tip);
    helpers.replaceChildren();
    setStatus(`${scene.persona.name} yazıyor…`);
    run.node = intent.next;
    const next = scene.nodes[intent.next];
    setTimeout(() => {
      aiSays(next);
      if (next.end) finish();
      else focusInput();
    }, 650);
  }

  function answerCard(target, close) {
    return h('div', { class: 'card cream stack' },
      h('p', { class: 'eyebrow' }, 'Doğal bir cevap'),
      h('div', { class: 'row' }, h('div', { class: 'grow' }, h('p', { class: 'it', lang: 'it' }, target.model), h('p', { class: 'tr' }, target.tr)), speakBtn(target.model)),
      h('button', { class: 'btn soft block', onclick: () => { setInput(target.model); close(); focusInput(); } }, 'Bu cümleyi kullan'));
  }

  /** Öğretmen paneli. text verilirse kullanıcının cümlesini parça parça değerlendirir. */
  function teacher(text, result) {
    const n = node();
    const best = result?.best;
    const parts = result?.groups.length
      ? h('div', { class: 'parts' }, result.groups.map((g) =>
        h('span', { class: `part ${g.ok ? 'ok' : 'miss'}` }, icon(g.ok ? 'check' : 'x'), g.ok ? g.label : `eksik: ${g.label}`)))
      : null;
    let explain;
    if (!text) explain = `${scene.persona.name} şunu soruyor: «${n.tr}» Kısa bir cevap yeter.`;
    else if (result.groups.length) explain = `Doğru yoldasın. Eksik kalan parça: ${result.groups.filter((g) => !g.ok).map((g) => `${g.label} (ör. ${g.show})`).join(', ')}.`;
    else explain = 'Bu cümleyi bu durumla eşleştiremedim. Karşındakinin sorusuna kısa bir cevap vermeyi dene.';
    const answerSlot = h('div');
    let close = null;
    const revealAnswer = () => {
      run.helpUsed = true;
      answerSlot.replaceChildren(answerCard(best || n.intents[0], close));
    };
    close = openSheet(
      h('div', { class: 'row' },
        h('span', { class: 'avatar', style: 'background:var(--sun-tint)' }, icon('teacher')),
        h('div', { class: 'grow' }, h('h3', {}, 'PARLO Öğretmen'), h('p', { class: 'small muted' }, 'Birlikte küçük bir dokunuş yapalım.')),
        h('button', { class: 'icon-btn plain', 'aria-label': 'Kapat', onclick: () => close() }, icon('close'))),
      text ? h('div', { class: 'card cream stack' }, h('p', { class: 'eyebrow' }, 'Senin cümlen'), h('p', { class: 'it', lang: 'it' }, `«${text}»`), parts) : null,
      h('p', {}, explain),
      h('div', { class: 'coach-tip' }, icon('bulb'), h('span', {}, n.hint)),
      answerSlot,
      h('button', { class: 'btn block', onclick: () => { close(); focusInput(); } }, icon('repeat'), text ? 'Tekrar deneyeyim' : 'Kendim deneyeyim'),
      h('button', { class: 'btn secondary block', onclick: revealAnswer }, 'Cevabı göster'));
  }

  function submit() {
    if (run.finished) return;
    const text = input.value.trim();
    if (!text) return focusInput();
    setInput('');
    const bubble = meMessage(text, { voice: lastVoice });
    lastVoice = false;
    log.append(bubble);
    scrollDown();
    const result = matchIntent(text, node().intents);
    if (result.intent) return accept(result.intent, text, bubble);
    run.tries += 1;
    bubble.markRetry();
    teacher(text, result);
  }

  /** Mesajların altındaki ipucu çipleri ve önerilen yanıtlar (her düğümde yenilenir). */
  function drawHelpers() {
    const n = node();
    if (n.end) { helpers.replaceChildren(); return; }
    const patternId = n.intents.map((i) => scene.cards.map((id) => cards[id]).find((c) => c.it === i.model)?.pattern).find(Boolean);
    const hintLabel = patternId ? `İpucu: ${patternById(patternId).head}` : 'İpucu';
    let showTr = true;
    const list = h('div');
    const drawList = () => list.replaceChildren(...n.intents.map((it) =>
      h('button', { class: 'suggest', onclick: () => { run.helpUsed = true; setInput(it.model); focusInput(); } },
        h('span', { class: 'grow' }, h('span', { class: 'it one-line', lang: 'it' }, `«${it.model}»`), showTr ? h('span', { class: 'tr one-line' }, it.tr) : null),
        icon('arrow', 'diag'))));
    drawList();
    const trChip = h('button', { class: 'chip', 'aria-pressed': 'true', onclick: () => {
      showTr = !showTr;
      trChip.setAttribute('aria-pressed', String(showTr));
      drawList();
    } }, icon('translate'), 'Cevap çevirileri');
    const slowChip = h('button', { class: 'chip', 'aria-pressed': String(slow()), onclick: () => {
      ctx.state.settings = { ...ctx.state.settings, slow: !slow() };
      ctx.persist();
      slowChip.setAttribute('aria-pressed', String(slow()));
    } }, icon('turtle'), 'Yavaş');
    helpers.replaceChildren(
      h('div', { class: 'helpers' },
        h('button', { class: 'chip', onclick: () => { run.helpUsed = true; addTip(`İpucu: ${n.hint}`); } }, icon('bulb', 'terra-ico'), hintLabel),
        trChip,
        h('button', { class: 'chip', onclick: () => teacher(null, null) }, icon('teacher'), 'Öğretmen'),
        slowChip),
      h('p', { class: 'small muted' }, 'Önerilen doğal yanıtlar:'),
      list);
  }

  function cultureNote() {
    let close = null;
    close = openSheet(
      h('div', { class: 'row between' }, h('h3', {}, 'Kültür notu'), h('button', { class: 'icon-btn plain', 'aria-label': 'Kapat', onclick: () => close() }, icon('close'))),
      h('p', {}, scene.culture),
      h('div', { class: 'coach-tip' }, icon('bulb'), h('span', {},
        scene.register === 'Lei'
          ? `${scene.persona.name} sana «Lei» (resmî «siz») ile hitap ediyor. Sen de «Può…?», «Mi dà…?» gibi Lei biçimlerini kullan.`
          : `${scene.persona.name} ile «tu» (samimi «sen») kullanıyorsunuz: «Puoi…?», «Mi dai…?».`)));
  }

  // Mikrofon
  let stopListening = null;
  const mic = h('button', { class: 'square mic', type: 'button', 'aria-label': 'Sesli cevap ver', disabled: !canListen(), title: canListen() ? null : 'Bu tarayıcı sesli cevabı desteklemiyor', onclick: () => {
    if (stopListening) { stopListening(); return; }
    mic.classList.add('live');
    mic.setAttribute('aria-label', 'Dinlemeyi durdur');
    setStatus(`${scene.persona.name} seni dinliyor…`);
    stopListening = listen({
      onText: (t) => { setInput(t); lastVoice = true; submit(); },
      onError: (err) => addTip(err === 'not-allowed' ? 'Mikrofon izni verilmedi. Tarayıcı ayarlarından izin verebilir ya da yazarak devam edebilirsin.' : 'Sesini duyamadım. Tekrar dene ya da yaz.', 'mic'),
      onEnd: () => { stopListening = null; mic.classList.remove('live'); mic.setAttribute('aria-label', 'Sesli cevap ver'); if (!run.finished) setStatus(`${scene.persona.name} seni bekliyor…`); },
    });
  } }, icon('mic'));

  const clearBtn = h('button', { class: 'clear', type: 'button', 'aria-label': 'Temizle', hidden: true, onclick: () => { setInput(''); focusInput(); } }, icon('x'));
  function setInput(v) { input.value = v; clearBtn.hidden = !v; }
  input.addEventListener('input', () => { clearBtn.hidden = !input.value; });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });

  const dock = h('div', { class: 'composer2' },
    mic,
    h('div', { class: 'field' }, input, clearBtn),
    h('button', { class: 'square send', 'aria-label': 'Gönder', onclick: submit }, icon('send')));

  const back = () => (daily ? ctx.go('home') : ctx.go('scenes'));
  const view = h('div', { class: 'chat' },
    h('header', { class: 'topbar' },
      h('div', { class: 'row grow' },
        h('button', { class: 'icon-btn plain', 'aria-label': 'Geri', onclick: back }, icon('back')),
        brandMark(), h('h2', {}, 'Sohbet'))),
    h('section', { class: `chat-hero art-${scene.cat}` },
      h('span', { class: 'emoji', 'aria-hidden': 'true' }, scene.emoji),
      h('div', { class: 'content' },
        h('div', { class: 'row between' }, h('span', { class: 'chip glass-dark' }, h('i', { class: 'dot' }), `Canlı simülasyon · ${scene.level}`), stepLabel),
        h('div', { class: 'row between bottom' }, h('h1', {}, scene.tr), goalLabel),
        h('div', { class: 'bar' }, bar))),
    h('section', { class: 'card persona' },
      h('div', { class: 'avatar', 'aria-hidden': 'true' }, scene.persona.avatar, h('span', { class: 'online' })),
      h('div', { class: 'grow' }, h('h3', {}, scene.persona.name, h('span', { class: 'role' }, scene.persona.role)), status),
      h('button', { class: 'chip terra', onclick: cultureNote }, icon('book'), 'Kültür notu')),
    log,
    helpers,
    h('div', { class: 'dock' }, dock));

  updateHeader();
  setStatus(`${scene.persona.name} seni bekliyor…`);
  setTimeout(() => aiSays(node()), 250);
  return view;
}
