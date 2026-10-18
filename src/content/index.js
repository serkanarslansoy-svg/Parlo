import scenes from './scenarios.json';
import cardList from './cards.json';
import patterns from './patterns.json';
import tips from './tips.json';
import program from './program.json';

export { scenes, patterns, tips };
export const cards = Object.fromEntries(cardList.map((c) => [c.id, c]));
export const allCardIds = cardList.map((c) => c.id);
export const sceneById = (id) => scenes.find((s) => s.id === id);
export const patternById = (id) => patterns.find((p) => p.id === id);

export const CATEGORIES = [
  { id: 'yeme', label: 'Yeme & İçme', title: 'Yeme & İçme Ritüelleri', it: 'Gastronomia', icon: 'fork' },
  { id: 'gunluk', label: 'Günlük yaşam', title: 'Şehirde Günlük Yaşam', it: 'Vita quotidiana', icon: 'city' },
  { id: 'is', label: 'İş', title: 'İş Hayatı', it: 'Lavoro', icon: 'briefcase' },
];

export const PATTERN_CATS = [
  { id: 'istek', label: 'İstek' },
  { id: 'izin', label: 'İzin & Rica' },
  { id: 'ihtiyac', label: 'İhtiyaç' },
  { id: 'soru', label: 'Soru & Yer' },
  { id: 'kendini_anlat', label: 'Kendini anlat' },
];

/** Günün senaryosu: her gün sıradaki senaryo (yerel tarihe göre). */
export function dailyScene(todayKey) {
  const [y, m, d] = todayKey.split('-').map(Number);
  const dayNumber = Math.floor(Date.UTC(y, m - 1, d) / 86400000);
  return scenes[dayNumber % scenes.length];
}

/** Bir kalıbın örnek cümleleri. */
export const cardsOfPattern = (patternId) => cardList.filter((c) => c.pattern === patternId);

// --- Kişiselleştirme: içerikteki {nome} yer tutucusu oyuncunun adıyla değişir ---
const NAME = '{nome}';
const slots = [];
function collect(obj) {
  if (!obj || typeof obj !== 'object') return;
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string' && v.includes(NAME)) slots.push({ obj, k, tpl: v });
    else if (Array.isArray(v) && v.some((x) => typeof x === 'string' && x.includes(NAME))) slots.push({ obj, k, tpl: [...v] });
    else if (v && typeof v === 'object') collect(v);
  }
}
collect(cardList);
collect(scenes);
collect(program.days);

/** İçerikteki {nome}'u verilen adla doldurur (ad yoksa "Marco"). Oyuncu değişince yeniden çağrılır. */
export function personalize(name) {
  const n = (name || '').trim() || 'Marco';
  for (const s of slots) {
    s.obj[s.k] = Array.isArray(s.tpl) ? s.tpl.map((x) => (typeof x === 'string' ? x.split(NAME).join(n) : x)) : s.tpl.split(NAME).join(n);
  }
}
