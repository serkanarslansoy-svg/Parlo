// content-src/weekN.json (ChatGPT) + content-src/fixes.json → src/content/{program,cards,patterns,scenarios}.json
// Kullanım: node scripts/build-program.mjs [--out dizin]   (varsayılan: src/content)
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SRC = join(ROOT, 'content-src');
const outArg = process.argv.indexOf('--out');
const OUT = outArg > 0 ? process.argv[outArg + 1] : join(ROOT, 'src/content');
const read = (p) => JSON.parse(readFileSync(p, 'utf8'));

const weeks = readdirSync(SRC).filter((f) => /^week\d+\.json$/.test(f)).sort((a, b) => parseInt(a.slice(4)) - parseInt(b.slice(4))).map((f) => read(join(SRC, f)));
const fixes = read(join(SRC, 'fixes.json'));
const old = {
  scenes: read(join(ROOT, 'src/content/scenarios.json')),
  cards: read(join(ROOT, 'src/content/cards.json')),
  patterns: read(join(ROOT, 'src/content/patterns.json')),
};

// --- Metin düzeltmeleri: isim yer tutucusu ve cümle değişimleri ---
const NAME = '{nome}';
const replaceMap = new Map(fixes.replace.map((r) => [r.from, r.to]));
function fixText(s) {
  if (typeof s !== 'string') return s;
  let t = replaceMap.get(s) ?? s;
  for (const n of fixes.name_placeholder || []) t = t.split(n).join(NAME);
  return t;
}
const altsFor = (original, fixed) => {
  const extra = [...(fixes.alt_add[original] || []), ...(fixes.alt_add[fixed] || [])];
  if (original !== fixed && !original.includes('Serkan')) extra.push(original);
  return extra;
};

// --- Kalıplar ---
const patterns = new Map();
for (const w of weeks) {
  for (const p of w.patterns) {
    patterns.set(p.id, { id: p.id, head: p.head, slot: p.slot || '', tr: p.tr, cat: fixes.pattern_cat[p.id] || 'istek', note: p.note });
  }
}

// --- Cümleler (aynı cümle bir kez; ilk görüldüğü id kalır) ---
const cards = [];
const byText = new Map();
function addCard(id, it, tr, pattern, alt = []) {
  if (byText.has(it)) {
    const c = byText.get(it);
    for (const a of alt) if (a !== c.it && !c.alt.includes(a)) c.alt.push(a);
    return { card: c, fresh: false };
  }
  const c = { id, scene: null, pattern: pattern || null, it, tr, alt: alt.filter((a) => a !== it) };
  cards.push(c);
  byText.set(it, c);
  return { card: c, fresh: true };
}

// --- Sahneler ---
const SETTINGS = {
  bar: { it: 'Al bar', cat: 'yeme', emoji: '☕' },
  supermarket: { it: 'Al supermercato', cat: 'yeme', emoji: '🛒' },
  market_stall: { it: 'Al mercato', cat: 'yeme', emoji: '🍅' },
  restaurant: { it: 'Al ristorante', cat: 'yeme', emoji: '🍝' },
  street: { it: 'Per strada', cat: 'gunluk', emoji: '🗺️' },
  school: { it: 'A scuola', cat: 'gunluk', emoji: '🏫' },
  pharmacy: { it: 'In farmacia', cat: 'gunluk', emoji: '💊' },
  bus_stop: { it: 'Alla fermata', cat: 'gunluk', emoji: '🚌' },
  appointment_phone: { it: 'Al telefono', cat: 'gunluk', emoji: '📞' },
  workplace: { it: 'Al lavoro', cat: 'is', emoji: '🏭' },
  mixed_daily_life: { it: 'In città', cat: 'gunluk', emoji: '🏙️' },
};
const FEMALE = new Set('Giorgia Paola Elena Francesca Sara Martina Chiara Giulia Anna Laura Valentina Federica Alessia Silvia Roberta Monica Lucia Maria Teresa Rosa Simona Ilaria Elisa Marta Beatrice Camilla Alice Sofia Aurora Emma Greta Noemi Irene Claudia Barbara Daniela Cristina Patrizia Antonella Stefania Manuela Serena Veronica Gabriella'.split(' '));
const avatarOf = (name) => (FEMALE.has(name) ? '👩🏻' : '👨🏻');
const CLOSING = {
  Lei: { ai: 'Perfetto, grazie a Lei. Arrivederci!', tr: 'Harika, ben teşekkür ederim. Hoşça kalın!' },
  tu: { ai: 'Perfetto, ci vediamo! Ciao!', tr: 'Harika, görüşürüz! Hoşça kal!' },
};

function buildScene(day, talk, dayCards) {
  const fx = fixes.scene[String(day.day)] || {};
  const persona = { ...talk.persona, ...(fx.persona || {}) };
  const set = SETTINGS[talk.setting] || { it: talk.title, cat: 'gunluk', emoji: '💬' };
  const id = `${talk.setting || 'scene'}_${day.day}`;
  const nodes = {};
  const sceneCards = [];
  talk.turns.forEach((turn0, i) => {
    const turn = { ...turn0, ...((fx.turns || {})[String(i)] || {}) };
    const nextId = i + 1 < talk.turns.length ? `n${i + 2}` : 'end';
    const intents = turn.answers.map((a) => {
      const it = fixText(a.it);
      const c = byText.get(it);
      if (c && !sceneCards.includes(c.id)) sceneCards.push(c.id);
      return {
        model: it,
        tr: a.tr,
        req: a.keywords.map((g) => ({ label: g[0], show: g.join(' / '), any: g.map((x) => x.toLowerCase()) })),
        next: nextId,
        ...(nextId === 'end' ? { cando: talk.mission } : {}),
        ...(/^no\b/i.test(it) ? { neg: true } : {}),
      };
    });
    const first = turn.answers[0];
    nodes[`n${i + 1}`] = {
      ai: turn.ai,
      tr: turn.tr,
      goal: turn.goal,
      hint: first.keywords.map((g) => g[0]).join(' + ') + ` — ya da — ${fixText(first.it)}`,
      intents,
    };
  });
  nodes.end = { ...CLOSING[talk.register === 'tu' ? 'tu' : 'Lei'], end: true };
  for (const id2 of dayCards) if (!sceneCards.includes(id2)) sceneCards.push(id2);
  for (const id2 of sceneCards) { const c = cards.find((x) => x.id === id2); if (c && !c.scene) c.scene = id; }
  return {
    id,
    it: set.it,
    tr: talk.title,
    mission: talk.mission,
    cat: set.cat,
    emoji: set.emoji,
    level: String(day.level).split('+').pop(),
    minutes: Math.max(3, talk.turns.length),
    desc: `${talk.mission}.`,
    persona: { name: persona.name, role: persona.role, avatar: avatarOf(persona.name) },
    register: talk.register === 'tu' ? 'tu' : 'Lei',
    culture: day.culture || '',
    cards: sceneCards,
    key: sceneCards[0],
    start: 'n1',
    nodes,
    program: day.day,
  };
}

// --- Günler ---
const days = [];
const scenes = [];
for (const w of weeks) {
  for (const d of w.days) {
    const learn = [];
    const dayCards = [];
    for (const s of d.sentences) {
      const it = fixText(s.it);
      const alt = [...(s.alt || []).map(fixText), ...altsFor(s.it, it)];
      const { card, fresh } = addCard(s.id, it, s.tr, s.pattern, alt);
      if (fresh) learn.push(card.id);
      dayCards.push(card.id);
    }
    const words = [...(d.words || []), ...(fixes.words_add[String(d.day)] || [])];
    let talk;
    if (d.talk.type === 'scene') {
      const sc = buildScene(d, d.talk, dayCards);
      scenes.push(sc);
      talk = { scene: sc.id };
    } else {
      talk = {
        title: d.talk.title,
        drill: d.talk.questions.map((q) => {
          const models = q.answers.map(fixText);
          for (const m of [...models]) for (const a of fixes.alt_add[m] || []) if (!models.includes(a)) models.push(a);
          return { q: fixText(q.q), tr: q.tr, models };
        }),
      };
    }
    days.push({
      day: d.day,
      week: w.week,
      level: d.level,
      title: d.title,
      focus: d.focus,
      learn,
      review: dayCards.filter((id) => !learn.includes(id)),
      talk,
      ...(words.length ? { words: words.map((x) => `${x.it} (${x.tr})`).join(' · ') } : {}),
      ...(d.grammar_note ? { grammar: d.grammar_note } : {}),
      ...(d.mistakes?.length ? { mistakes: d.mistakes } : {}),
      ...(d.culture ? { culture: d.culture } : {}),
      ...(d.gate ? { gate: d.gate } : {}),
    });
  }
}

// --- Eski içerikten kalanlar (yeni programda karşılığı olmayan sahneler) ---
for (const sid of fixes.keep_old_scenes) {
  const sc = old.scenes.find((s) => s.id === sid);
  if (!sc) continue;
  scenes.push(sc);
  for (const cid of sc.cards) {
    const c = old.cards.find((x) => x.id === cid);
    if (c && !cards.some((x) => x.id === c.id)) {
      cards.push(c);
      if (c.pattern && !patterns.has(c.pattern)) {
        const p = old.patterns.find((x) => x.id === c.pattern);
        if (p) patterns.set(p.id, p);
      }
    }
  }
}

// Kullanılmayan kalıpları at (her kalıbın en az bir örneği olmalı)
for (const id of [...patterns.keys()]) if (!cards.some((c) => c.pattern === id)) patterns.delete(id);

const program = { version: 2, weeks: weeks.map((w) => ({ week: w.week, title: w.title, goal: w.goal })), days };
mkdirSync(OUT, { recursive: true });
const write = (name, data) => writeFileSync(join(OUT, name), JSON.stringify(data, null, 1) + '\n');
write('program.json', program);
write('cards.json', cards);
write('patterns.json', [...patterns.values()]);
write('scenarios.json', scenes);
console.log(`Hafta ${weeks.length}, gün ${days.length}, cümle ${cards.length}, kalıp ${patterns.size}, sahne ${scenes.length} → ${OUT}`);
