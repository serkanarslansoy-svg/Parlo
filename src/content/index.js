import scenes from './scenarios.json';
import cardList from './cards.json';
import patterns from './patterns.json';
import tips from './tips.json';

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
