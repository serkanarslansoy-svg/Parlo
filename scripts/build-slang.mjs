// content-src/slang/units.json (ChatGPT) + fixes.json → src/content/slang.json
// Kullanım: node scripts/build-slang.mjs [--out dizin]
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const outArg = process.argv.indexOf('--out');
const OUT = outArg > 0 ? process.argv[outArg + 1] : join(ROOT, 'src/content');
const SRC = join(ROOT, 'content-src/slang');
const readJ = (n) => JSON.parse(readFileSync(join(SRC, n), 'utf8'));
const units = readJ('units.json');

// 3. üniteye sonradan gelen maddeler: kendi seviyelerinden "ne kadar ağır?" sorusu üretilir.
if (existsSync(join(SRC, 'unit3-extra.json'))) {
  const u3 = units.find((u) => u.unit === 3);
  const extra = readJ('unit3-extra.json');
  u3.items.push(...extra);
  u3.exercises.push(...extra.map((it) => ({ type: 'level', it: it.it, answer: it.level })));
}
const fixes = JSON.parse(readFileSync(join(ROOT, 'content-src/slang/fixes.json'), 'utf8'));
const problems = [];

const out = units.map((u) => {
  const items = u.items
    .filter((it) => !fixes.remove[it.id])
    .map((it) => {
      const { why, ...patch } = fixes.items[it.id] || {};
      const item = { ...it, ...patch };
      if (!(item.level >= 1 && item.level <= 5)) problems.push(`${item.id}: level 1-5 olmalı`);
      for (const k of ['it', 'meaning', 'tr_equivalent', 'can_i_use', 'context']) if (!item[k]) problems.push(`${item.id}: '${k}' eksik`);
      return item;
    });
  const exercises = u.exercises.map((ex, i) => {
    const e = { ...ex, ...((fixes.exercises[String(u.unit)] || {})[String(i)] || {}) };
    if (e.type === 'meaning' && !(e.answer >= 0 && e.answer < e.options.length)) problems.push(`Ünite ${u.unit} alıştırma ${i}: cevap seçeneklerde yok`);
    if (e.type === 'level' && !(e.answer >= 1 && e.answer <= 5)) problems.push(`Ünite ${u.unit} alıştırma ${i}: seviye 1-5 olmalı`);
    return e;
  });
  return { unit: u.unit, title: u.title, intro: u.intro, items, exercises, gestures: u.gestures || [] };
});

// 6. ünite farklı biçimde geldi (program günü gibi): jestler + sınır koyma cümleleri + sahne.
if (existsSync(join(SRC, 'unit6.json'))) {
  const u = readJ('unit6.json');
  const pats = Object.fromEntries(u.patterns.map((p) => [p.id, p]));
  out.push({
    unit: u.unit,
    title: u.title,
    intro: u.goal,
    items: u.sentences.map((s) => ({
      id: s.id, it: s.it, literal: null, meaning: s.tr, tr_equivalent: s.tr, level: 1, can_i_use: 'evet, rahatça', region: 'her yer',
      context: pats[s.pattern]?.note || 'Gerilimi büyütmeden sınır koymak için.',
      example: [], polite_alternative: s.alt?.length ? { it: s.alt[0], tr: 'Aynı anlamda' } : null,
    })),
    exercises: u.talk.turns.map((t) => ({
      type: 'respond',
      situation: `Biri sana «${t.ai}» (${t.tr}) diyor. ${t.goal}.`,
      answers: t.answers.map((a) => ({ it: a.it, tr: a.tr })),
    })),
    gestures: u.gestures.map((g) => ({ id: g.id, name: g.name, how: g.description_tr, meaning: `${g.meaning_tr}${/[.!?]$/.test(g.meaning_tr) ? '' : '.'} ${g.usage_note}`, level: fixes.gesture_level?.[g.id] || 1 })),
    culture: u.culture,
    mistakes: u.mistakes,
    gate: u.gate,
  });
}

if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
writeFileSync(join(OUT, 'slang.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`Sokak dili: ${out.length} ünite, ${out.reduce((s, u) => s + u.items.length, 0)} ifade, ${out.reduce((s, u) => s + u.exercises.length, 0)} alıştırma → ${OUT}/slang.json`);
