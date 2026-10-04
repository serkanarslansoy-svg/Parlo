// Cevap kontrolü: hem "Hızlı tekrar" (tam cümle) hem "Sohbet" (niyet eşleştirme) burayı kullanır.

/** Küçük harf, aksansız, noktalamasız; kesme işareti boşluğa dönüşür ("Dov'è" → "dov e"). */
export function norm(text) {
  return String(text)
    .toLocaleLowerCase('it')
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

/**
 * Tam cümle kontrolü (Hızlı tekrar).
 * Boşluk ve kesme işareti farkları ("un'acqua" / "un acqua", "dov'è" / "dove") hata sayılmaz.
 * @returns {{ok: boolean, accentNote: boolean}}
 */
export function checkSentence(input, card) {
  const targets = [card.it, ...(card.alt || [])];
  const given = squash(input);
  const hit = targets.find((t) => squash(t) === given);
  if (!hit) return { ok: false, accentNote: false };
  return { ok: true, accentNote: normKeepAccents(input) !== normKeepAccents(hit) };
}

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
