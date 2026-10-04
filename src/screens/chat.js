import { h, icon } from '../lib/dom.js';
import { sceneById } from '../content/index.js';
import { matchIntent, tipsFor } from '../lib/answer.js';
import { speak, canListen, listen } from '../lib/speech.js';
import { newCard, addDays } from '../lib/srs.js';
import { today, touchDay } from '../lib/store.js';
import { speakBtn } from '../ui.js';

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

function aiBubble(scene, text, tr, { slow }) {
  const trEl = h('p', { class: 'tr', hidden: true }, tr);
  const toggle = h('button', { type: 'button', 'aria-expanded': 'false', onclick: () => {
    trEl.hidden = !trEl.hidden;
    toggle.setAttribute('aria-expanded', String(!trEl.hidden));
    toggle.lastChild.textContent = trEl.hidden ? 'Türkçesi' : 'Gizle';
  } }, icon('translate'), 'Türkçesi');
  return h('div', { class: 'msg' },
    h('div', { class: 'avatar sm', 'aria-hidden': 'true' }, scene.persona.avatar),
    h('div', { class: 'bubble' },
      h('p', { class: 'it', lang: 'it' }, text),
      trEl,
      h('div', { class: 'tools' },
        h('button', { type: 'button', onclick: () => speak(text, { slow: slow() }) }, icon('speaker'), 'Dinle'),
        toggle)));
}

function meBubble(text) {
  const note = h('p', { class: 'note' });
  const el = h('div', { class: 'msg me' }, h('div', { class: 'bubble' }, h('p', { class: 'it', lang: 'it' }, text), note));
  el.markOk = () => { note.replaceChildren(icon('check'), 'Anlaşıldı'); };
  el.markRetry = () => { note.replaceChildren(icon('repeat'), 'Tekrar deneyelim'); };
  return el;
}

export function renderChat(ctx, sceneId, query) {
  const scene = sceneById(sceneId);
  if (!scene) { ctx.go('scenes'); return h('div'); }
  const daily = query.get('daily') === '1';

  const run = { node: scene.start, steps: [], helpUsed: false, tries: 0, finished: false };
  const slow = () => Boolean(ctx.state.settings?.slow);
  const log = h('div', { class: 'log', 'aria-live': 'polite' });
  const progress = h('span', { class: 'chip green' });
  const input = h('input', { class: 'grow', placeholder: 'İtalyanca cevabını yaz…', autocomplete: 'off', autocapitalize: 'sentences', spellcheck: 'false', lang: 'it', 'aria-label': 'İtalyanca cevabın' });

  const node = () => scene.nodes[run.node];
  const scrollDown = () => requestAnimationFrame(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }));
  const updateProgress = () => { progress.textContent = `Adım ${run.steps.length + (run.finished ? 0 : 1)}`; };
  const addTip = (text, ico = 'bulb') => { log.append(h('div', { class: 'coach-tip' }, icon(ico), h('span', {}, text))); scrollDown(); };

  function aiSays(n) {
    log.append(aiBubble(scene, n.ai, n.tr, { slow }));
    speak(n.ai, { slow: slow() });
    updateProgress();
    scrollDown();
  }

  function finish() {
    run.finished = true;
    updateProgress();
    const st = ctx.state;
    const rec = st.scenes[scene.id] || { runs: 0, cando: [] };
    rec.runs += 1;
    for (const s of run.steps) if (s.cando && !rec.cando.includes(s.cando)) rec.cando.push(s.cando);
    st.scenes[scene.id] = rec;
    const t = today();
    for (const id of scene.cards) if (!st.cards[id]) st.cards[id] = { ...newCard(t), due: addDays(t, 1) };
    touchDay(st, { scene: scene.id });
    ctx.persist();
    ctx.lastResult = { type: 'scene', sceneId: scene.id, steps: run.steps, daily };
    log.append(h('div', { class: 'system' }, 'Görev tamamlandı 🎉'));
    dock.replaceChildren(h('button', { class: 'btn block', onclick: () => ctx.go('result') }, 'Sonucu gör', icon('arrow')));
    scrollDown();
  }

  function accept(intent, text, bubble) {
    bubble.markOk();
    run.steps.push({ said: text, model: intent.model, cando: intent.cando || null, solo: !run.helpUsed && run.tries === 0 });
    run.helpUsed = false;
    run.tries = 0;
    for (const tip of tipsFor(text, intent)) addTip(tip);
    const next = scene.nodes[intent.next];
    run.node = intent.next;
    setTimeout(() => {
      aiSays(next);
      if (next.end) finish();
      else input.focus({ preventScroll: true });
    }, 650);
  }

  function teacher(text, result) {
    const n = node();
    const best = result.best;
    const parts = result.groups.length
      ? h('div', { class: 'parts' }, result.groups.map((g) =>
        h('span', { class: `part ${g.ok ? 'ok' : 'miss'}` }, icon(g.ok ? 'check' : 'x'), g.ok ? g.label : `eksik: ${g.label}`)))
      : null;
    const explain = result.groups.length
      ? `Doğru yoldasın. Eksik kalan parça: ${result.groups.filter((g) => !g.ok).map((g) => `${g.label} (ör. ${g.show})`).join(', ')}.`
      : 'Bu cümleyi bu durumla eşleştiremedim. Karşındakinin sorusuna kısa bir cevap vermeyi dene.';
    const answerSlot = h('div');
    let close = null;
    const revealAnswer = () => {
      run.helpUsed = true;
      const target = best || n.intents[0];
      answerSlot.replaceChildren(h('div', { class: 'card cream stack' },
        h('p', { class: 'eyebrow' }, 'Doğal bir cevap'),
        h('div', { class: 'row' }, h('div', { class: 'grow' }, h('p', { class: 'it', lang: 'it' }, target.model), h('p', { class: 'tr' }, target.tr)), speakBtn(target.model)),
        h('button', { class: 'btn soft block', onclick: () => { input.value = target.model; close(); input.focus({ preventScroll: true }); } }, 'Bu cümleyi kullan')));
    };
    close = openSheet(
      h('div', { class: 'row' },
        h('span', { class: 'avatar', style: 'background:var(--sun-tint)' }, icon('teacher')),
        h('div', { class: 'grow' }, h('h3', {}, 'PARLO Öğretmen'), h('p', { class: 'small muted' }, 'Birlikte küçük bir dokunuş yapalım.')),
        h('button', { class: 'icon-btn plain', 'aria-label': 'Kapat', onclick: () => close() }, icon('close'))),
      h('div', { class: 'card cream stack' },
        h('p', { class: 'eyebrow' }, 'Senin cümlen'),
        h('p', { class: 'it', lang: 'it' }, `«${text}»`),
        parts),
      h('p', {}, explain),
      h('div', { class: 'coach-tip' }, icon('bulb'), h('span', {}, n.hint)),
      answerSlot,
      h('button', { class: 'btn block', onclick: () => { close(); input.focus({ preventScroll: true }); } }, icon('repeat'), 'Tekrar deneyeyim'),
      h('button', { class: 'btn secondary block', onclick: revealAnswer }, 'Cevabı göster'));
  }

  function submit() {
    if (run.finished) return;
    const text = input.value.trim();
    if (!text) return input.focus({ preventScroll: true });
    input.value = '';
    const bubble = meBubble(text);
    log.append(bubble);
    scrollDown();
    const result = matchIntent(text, node().intents);
    if (result.intent) return accept(result.intent, text, bubble);
    run.tries += 1;
    bubble.markRetry();
    teacher(text, result);
  }

  function showHint() {
    run.helpUsed = true;
    addTip(`İpucu: ${node().hint}`);
  }

  function showSuggestions() {
    const n = node();
    let close = null;
    close = openSheet(
      h('div', { class: 'row between' }, h('h3', {}, 'Önerilen cevaplar'), h('button', { class: 'icon-btn plain', 'aria-label': 'Kapat', onclick: () => close() }, icon('close'))),
      h('p', { class: 'small muted' }, 'Birini seç, yazı kutusuna gelsin. İstersen değiştirip öyle gönder.'),
      h('div', {}, n.intents.map((it) =>
        h('button', { class: 'suggest', onclick: () => { run.helpUsed = true; input.value = it.model; close(); input.focus({ preventScroll: true }); } },
          h('span', { class: 'grow' }, h('p', { class: 'it', lang: 'it' }, it.model), h('p', { class: 'tr' }, it.tr)),
          icon('arrow')))));
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
  const mic = canListen()
    ? h('button', { class: 'icon-btn mic', type: 'button', 'aria-label': 'Sesli cevap ver', onclick: () => {
      if (stopListening) { stopListening(); return; }
      mic.classList.add('live');
      mic.setAttribute('aria-label', 'Dinlemeyi durdur');
      stopListening = listen({
        onText: (t) => { input.value = t; submit(); },
        onError: (err) => addTip(err === 'not-allowed' ? 'Mikrofon izni verilmedi. Tarayıcı ayarlarından izin verebilir ya da yazarak devam edebilirsin.' : 'Sesini duyamadım. Tekrar dene ya da yaz.', 'mic'),
        onEnd: () => { stopListening = null; mic.classList.remove('live'); mic.setAttribute('aria-label', 'Sesli cevap ver'); },
      });
    } }, icon('mic'))
    : null;

  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });

  const slowBtn = h('button', { class: `chip ${slow() ? 'sun' : ''}`, 'aria-pressed': String(slow()), onclick: () => {
    ctx.state.settings = { ...ctx.state.settings, slow: !slow() };
    ctx.persist();
    slowBtn.classList.toggle('sun', slow());
    slowBtn.setAttribute('aria-pressed', String(slow()));
  } }, icon('turtle'), 'Yavaş');

  const dock = h('div', { class: 'stack' },
    h('div', { class: 'helpers' },
      h('button', { class: 'chip', onclick: showHint }, icon('bulb'), 'İpucu'),
      h('button', { class: 'chip', onclick: showSuggestions }, icon('sparkle'), 'Önerilen cevaplar'),
      slowBtn),
    h('div', { class: 'composer' }, mic, input,
      h('button', { class: 'icon-btn go', 'aria-label': 'Gönder', onclick: submit }, icon('send'))),
    canListen() ? null : h('p', { class: 'small muted', style: 'text-align:center' }, 'Bu tarayıcı sesli cevabı desteklemiyor; yazarak devam edebilirsin.'));

  const back = () => (daily ? ctx.go('home') : ctx.go('scenes'));
  const view = h('div', { class: 'chat' },
    h('header', { class: 'topbar' },
      h('div', { class: 'row grow' },
        h('button', { class: 'icon-btn plain', 'aria-label': 'Geri', onclick: back }, icon('back')),
        h('div', { class: 'grow' }, h('h3', {}, `${scene.it} ${scene.emoji}`), h('p', { class: 'small muted' }, scene.desc))),
      progress),
    h('section', { class: 'card chat-head', style: 'margin-top:14px' },
      h('div', { class: 'avatar', 'aria-hidden': 'true' }, scene.persona.avatar, h('span', { class: 'online' })),
      h('div', { class: 'grow' }, h('h3', {}, scene.persona.name, h('span', { class: 'small muted' }, ` · ${scene.persona.role}`)),
        h('p', { class: 'small muted' }, scene.register === 'Lei' ? 'Resmî hitap: Lei' : 'Samimi hitap: tu')),
      h('button', { class: 'chip terra', onclick: cultureNote }, icon('book'), 'Kültür notu')),
    log,
    h('div', { class: 'dock' }, dock));

  setTimeout(() => aiSays(node()), 250);
  return view;
}
