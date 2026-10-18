// ChatGPT'den gelen hafta JSON'larını kontrol eder: node scripts/check-weeks.mjs content-src/week1.json [week2.json …]
import { readFileSync } from 'node:fs';
import { matchIntent, norm, hasNegation } from '../src/lib/answer.js';

const files = process.argv.slice(2);
const errors = [];
const warns = [];
const info = [];
const err = (m) => errors.push(m);
const warn = (m) => warns.push(m);

const patterns = new Map();
const seenIds = new Set();
const textFirst = new Map(); // it -> ilk id
const known = new Set(); // şimdiye kadar öğrenilen kelimeler
const GATES = [7, 14, 21, 30];
// Sahnede bilinmesi beklenmeyen ama sorun olmayan kısa kelimeler
const FREE = new Set('a al alla allo ai agli anche c che ci con da del della di e il i in la le lo l gli ma mi mio mia no non per qui si sì un una uno grazie prego scusi buongiorno buonasera ciao certo va bene ok'.split(' '));
const words = (s) => norm(s).split(' ').filter(Boolean);
const ACCENT = /\b(caffe|citta|perche|piu|gia|cosi|puo|lunedi|martedi|mercoledi|giovedi|venerdi|universita|eta|meta|tiramisu)\b/i;

let expectDay = null;
for (const f of files) {
  let w;
  try { w = JSON.parse(readFileSync(f, 'utf8')); } catch (e) { err(`${f}: geçersiz JSON (${e.message})`); continue; }
  const W = `Hafta ${w.week}`;
  for (const k of ['week', 'title', 'goal', 'patterns', 'days']) if (w[k] == null) err(`${W}: '${k}' eksik`);
  for (const p of w.patterns || []) {
    if (!/^[a-z][a-z0-9_]*$/.test(p.id)) err(`${W}: kalıp id biçimi: ${p.id}`);
    if (patterns.has(p.id)) err(`${W}: kalıp iki kez tanımlı: ${p.id}`);
    for (const k of ['head', 'slot', 'tr', 'note']) if (p[k] == null) err(`${W}: kalıp ${p.id} '${k}' eksik`);
    patterns.set(p.id, { ...p, used: 0 });
  }
  for (const d of w.days || []) {
    const D = `Gün ${d.day}`;
    if (expectDay != null && d.day !== expectDay) err(`${D}: gün sırası bozuk (beklenen ${expectDay})`);
    expectDay = d.day + 1;
    for (const k of ['level', 'title', 'focus', 'sentences', 'words', 'talk', 'mistakes']) if (d[k] == null) err(`${D}: '${k}' eksik`);
    if (GATES.includes(d.day) !== Boolean(d.gate)) err(`${D}: gate alanı ${GATES.includes(d.day) ? 'eksik' : 'olmamalı'}`);
    let fresh = 0;
    for (const s of d.sentences || []) {
      const want = `d${String(d.day).padStart(2, '0')}_`;
      if (!s.id?.startsWith(want)) err(`${D}: cümle id ${s.id} '${want}' ile başlamalı`);
      if (seenIds.has(s.id)) err(`${D}: tekrarlanan id ${s.id}`);
      seenIds.add(s.id);
      if (!s.it || !s.tr) err(`${D}: ${s.id} it/tr eksik`);
      if (!patterns.has(s.pattern) && s.pattern != null) err(`${D}: ${s.id} tanımsız kalıp '${s.pattern}'`);
      else if (s.pattern) patterns.get(s.pattern).used++;
      if (words(s.it).length > 10) warn(`${D}: ${s.id} 10 kelimeden uzun: «${s.it}»`);
      if (ACCENT.test(s.it)) warn(`${D}: ${s.id} aksan eksik olabilir: «${s.it}»`);
      for (const a of s.alt || []) if (ACCENT.test(a)) warn(`${D}: ${s.id} alt cevapta aksan eksik olabilir: «${a}»`);
      if (textFirst.has(s.it)) info.push(`${D}: ${s.id} = ${textFirst.get(s.it)} (aynı cümle tekrar)`);
      else { textFirst.set(s.it, s.id); fresh++; }
      words(s.it).forEach((x) => known.add(x));
      for (const a of s.alt || []) words(a).forEach((x) => known.add(x));
    }
    for (const x of d.words || []) words(x.it).forEach((y) => known.add(y));
    if (fresh < 3 && !GATES.includes(d.day)) warn(`${D}: sadece ${fresh} yeni cümle (en az 3-4 beklenir)`);
    info.push(`${D}: ${fresh} yeni cümle, ${(d.sentences || []).length - fresh} tekrar`);

    const t = d.talk || {};
    const unknownIn = (text) => words(text).filter((x) => !known.has(x) && !FREE.has(x) && !/^\d+$/.test(x));
    if (t.type === 'scene') {
      if (!t.persona?.name || !['Lei', 'tu'].includes(t.register)) err(`${D}: sahne persona/register eksik ya da hatalı`);
      (t.turns || []).forEach((turn, i) => {
        const T = `${D} sahne tur ${i + 1}`;
        if (!turn.ai || !turn.tr || !turn.goal || !turn.answers?.length) err(`${T}: ai/tr/goal/answers eksik`);
        const intents = (turn.answers || []).map((a) => ({ model: a.it, neg: hasNegation(a.it) || /^no\b/i.test(a.it), req: (a.keywords || []).map((g, j) => ({ label: `g${j}`, show: g[0], any: g })) }));
        for (const a of turn.answers || []) {
          if (!a.keywords?.length) { err(`${T}: «${a.it}» keywords yok`); continue; }
          const r = matchIntent(a.it, intents);
          if (!r.intent) err(`${T}: model cevap kendi anahtar kelimeleriyle eşleşmiyor: «${a.it}»`);
          for (const g of a.keywords) if (!g.some((p) => matchIntent(a.it, [{ model: a.it, neg: true, req: [{ label: 'x', show: p, any: [p] }] }]).intent)) err(`${T}: «${a.it}» cevabında şu gruptan hiçbiri yok: ${JSON.stringify(g)}`);
          if (ACCENT.test(a.it)) warn(`${T}: aksan eksik olabilir: «${a.it}»`);
          const u = unknownIn(a.it);
          if (u.length) warn(`${T}: o güne kadar öğrenilmemiş kelime: ${u.join(', ')} («${a.it}»)`);
        }
      });
    } else if (t.type === 'drill') {
      for (const q of t.questions || []) {
        if (!q.q || !q.tr || !q.answers?.length) err(`${D}: soru eksik alan`);
        for (const a of q.answers || []) { const u = unknownIn(a); if (u.length) warn(`${D} soru «${q.q}»: öğrenilmemiş kelime: ${u.join(', ')} («${a}»)`); }
      }
    } else err(`${D}: talk.type 'scene' ya da 'drill' olmalı`);
  }
}
for (const [id, p] of patterns) if (!p.used) warn(`Kalıp '${id}' tanımlı ama hiçbir cümlede kullanılmıyor`);

const out = (title, list) => { if (list.length) console.log(`\n## ${title} (${list.length})\n${list.map((x) => `- ${x}`).join('\n')}`); };
out('HATA', errors);
out('UYARI', warns);
out('BİLGİ', info);
console.log(`\nToplam: ${errors.length} hata, ${warns.length} uyarı. Benzersiz cümle: ${textFirst.size}, kalıp: ${patterns.size}.`);
process.exit(errors.length ? 1 : 0);
