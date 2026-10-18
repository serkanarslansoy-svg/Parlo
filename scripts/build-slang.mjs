// content-src/slang/units.json (ChatGPT) + fixes.json → src/content/slang.json
// Kullanım: node scripts/build-slang.mjs [--out dizin]
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const outArg = process.argv.indexOf('--out');
const OUT = outArg > 0 ? process.argv[outArg + 1] : join(ROOT, 'src/content');
const units = JSON.parse(readFileSync(join(ROOT, 'content-src/slang/units.json'), 'utf8'));
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

if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
writeFileSync(join(OUT, 'slang.json'), JSON.stringify(out, null, 1) + '\n');
console.log(`Sokak dili: ${out.length} ünite, ${out.reduce((s, u) => s + u.items.length, 0)} ifade, ${out.reduce((s, u) => s + u.exercises.length, 0)} alıştırma → ${OUT}/slang.json`);
