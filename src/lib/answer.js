// Cevap kontrolü: hem "Hızlı tekrar" (tam cümle) hem "Sohbet" (niyet eşleştirme) burayı kullanır.

/** Küçük harf, aksansız, noktalamasız; kesme işareti boşluğa dönüşür ("Dov'è" → "dov e"). */
export function norm(text) {
  return String(text)
    .toLocaleLowerCase('it')
    .replace(/ı/g, 'i') // Türkçe klavyede noktasız ı
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’'`´]/g, ' ')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Aksanlar korunur, sadece noktalama ve büyük harf yok sayılır. Aksan uyarısı için kullanılır. */
function normKeepAccents(text) {
  return String(text)
    .toLocaleLowerCase('it')
    .normalize('NFC')
    .replace(/[’'`´]/g, '')
    .replace(/[^\p{L}0-9 ]/gu, ' ')
    .replace(/\s+/g, '')
    .trim();
}

const squash = (s) => norm(s).replace(/ /g, '');

// --- Klavye kaynaklı yazım hataları ---
// QWERTY (İtalyanca ve Türkçe Q klavye) tuş konumları; komşu tuşa basmak klavye hatası sayılır.
const KEY_POS = {};
['qwertyuiop', 'asdfghjkl', 'zxcvbnm'].forEach((row, r) => [...row].forEach((k, i) => { KEY_POS[k] = [i + [0, 0.25, 0.75][r], r]; }));
export function adjacentKeys(a, b) {
  const p = KEY_POS[a];
  const q = KEY_POS[b];
  return Boolean(p && q && a !== b && Math.hypot(p[0] - q[0], p[1] - q[1]) <= 1.3);
}

/**
 * Tek kelimede klavye kayması mı? Komşu tuş, yan yana iki harfin yer değiştirmesi
 * ya da fazladan basılan (aynı/komşu) harf. Eksik harf ve uzak harf gerçek hata sayılır.
 */
export function isKeyboardSlip(given, expected) {
  if (given === expected || expected.length < 3) return false;
  const g = given;
  const e = expected;
  if (g.length === e.length) {
    const diff = [...e].map((c, i) => (c !== g[i] ? i : -1)).filter((i) => i >= 0);
    if (diff.length === 1) return adjacentKeys(g[diff[0]], e[diff[0]]);
    if (diff.length === 2 && diff[1] === diff[0] + 1) return g[diff[0]] === e[diff[1]] && g[diff[1]] === e[diff[0]];
    return false;
  }
  if (g.length === e.length + 1) {
    for (let i = 0; i < g.length; i++) {
      if (g.slice(0, i) + g.slice(i + 1) !== e) continue;
      const near = [g[i - 1], g[i + 1]].filter(Boolean);
      if (near.some((c) => c === g[i] || adjacentKeys(c, g[i]))) return true;
    }
  }
  return false;
}

/** Kelime kelime karşılaştırır; en fazla 2 kelimede klavye kayması varsa onları döndürür, yoksa null. */
function keyboardSlips(input, target) {
  const gw = norm(input).split(' ').filter(Boolean);
  const ew = norm(target).split(' ').filter(Boolean);
  if (gw.length !== ew.length) return null;
  const slips = [];
  for (let i = 0; i < ew.length; i++) {
    if (gw[i] === ew[i]) continue;
    if (!isKeyboardSlip(gw[i], ew[i])) return null;
    slips.push({ given: gw[i], expected: ew[i] });
  }
  return slips.length && slips.length <= 2 ? slips : null;
}

/**
 * Tam cümle kontrolü (Hızlı tekrar ve yazma alıştırmaları).
 * Boşluk ve kesme işareti farkları ("un'acqua" / "un acqua", "dov'è" / "dove") hata sayılmaz.
 * Klavye kaymaları (komşu tuş, yer değiştiren harf, çift basış) doğru sayılır ama `typos` ile bildirilir.
 * @returns {{ok: boolean, accentNote: boolean, typos: Array<{given, expected}>}}
 */
export function checkSentence(input, card) {
  const targets = [card.it, ...(card.alt || [])];
  const given = squash(input);
  const hit = targets.find((t) => squash(t) === given);
  if (hit) return { ok: true, accentNote: normKeepAccents(input) !== normKeepAccents(hit), typos: [] };
  for (const t of targets) {
    const typos = keyboardSlips(input, t);
    if (typos) return { ok: true, accentNote: false, typos };
  }
  return { ok: false, accentNote: false, typos: [] };
}

/** Kullanıcıya gösterilecek kısa not: «voglip» → «voglio». */
export const typoNote = (typos) => (typos?.length
  ? `Klavye kayması: ${typos.map((t) => `«${t.given}» → «${t.expected}»`).join(', ')}. Yine de doğru saydım.`
  : '');

/** Bir cümleyi kelime kartlarına böler (noktalama kartlarda gösterilmez). */
export function tilesFor(sentence) {
  return sentence
    .split(/\s+/)
    .map((w) => w.replace(/^[«"¿¡]+|[.,!?;:»"]+$/g, ''))
    .filter(Boolean);
}

/** Kelime dizme için çeldirici kelimeler: cümlede olmayan, havuzdan rastgele n kelime. */
export function distractorsFor(sentence, pool, n = 2, rand = Math.random) {
  const used = new Set(tilesFor(sentence).map(norm));
  const candidates = [...new Set(pool.flatMap(tilesFor))].filter((w) => !used.has(norm(w)) && norm(w).length > 1);
  return shuffle(candidates, rand).slice(0, n);
}

/** Dizi karıştırır; tek kelimeden uzunsa orijinal sırayla aynı kalmamasını garanti eder. */
export function shuffle(list, rand = Math.random) {
  const out = [...list];
  for (let attempt = 0; attempt < 6; attempt++) {
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    if (out.length < 2 || out.some((w, i) => w !== list[i])) return out;
  }
  return out.reverse();
}

// --- Sohbet: niyet eşleştirme ---

const padded = (s) => ` ${s} `;

/** "c e" ile "ce" gibi yazım farklarını da yakalamak için iki biçimde arar. */
function containsPhrase(text, phrase) {
  const t = norm(text);
  const p = norm(phrase);
  if (!p) return false;
  if (padded(t).includes(padded(p))) return true;
  const tj = t.replace(/ (?=\S\b)/g, ''); // tek harfli parçaları birleştir: "dov e" → "dove"
  const pj = p.replace(/ (?=\S\b)/g, '');
  return padded(tj).includes(padded(pj));
}

const hasNegation = (text) => / non /.test(padded(norm(text)));

/**
 * Kullanıcının cevabını bir düğümün niyetleriyle karşılaştırır.
 * @returns {{intent: object|null, best: object|null, groups: Array<{label:string, show?:string, ok:boolean}>}}
 *   intent: tam eşleşen niyet; yoksa best: en çok parçası tutan niyet ve parça parça sonuç.
 */
export function matchIntent(text, intents) {
  let best = null;
  let bestGroups = [];
  let bestScore = -1;
  for (const intent of intents) {
    const groups = intent.req.map((g) => ({
      label: g.label,
      show: g.show,
      ok: g.any.some((phrase) => containsPhrase(text, phrase)),
    }));
    const score = groups.filter((g) => g.ok).length;
    const negBlocked = hasNegation(text) && !intent.neg;
    if (score === groups.length && !negBlocked) return { intent, best: intent, groups };
    if (score > bestScore) {
      best = intent;
      bestGroups = groups;
      bestScore = score;
    }
  }
  return { intent: null, best: bestScore > 0 ? best : null, groups: bestScore > 0 ? bestGroups : [] };
}

const GLOBAL_TIPS = [
  { if: ['voglio'], say: '«Voglio» doğru ama sert duyulur. Dükkânda ve restoranda «Vorrei» daha kibar.' },
];

/** Doğru cevaba eklenecek küçük koç notları. */
export function tipsFor(text, intent) {
  const out = [];
  for (const tip of [...(intent.tips || []), ...GLOBAL_TIPS]) {
    if (tip.if && tip.if.some((p) => containsPhrase(text, p))) out.push(tip.say);
    if (tip.ifNot && !tip.ifNot.some((p) => containsPhrase(text, p))) out.push(tip.say);
  }
  return out;
}
