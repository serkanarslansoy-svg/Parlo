// Aralıklı tekrar (Leitner kutuları). Kutu 0 = yeni/yanlış, kutu 5 = kalıcı hafıza.

export const INTERVALS = [0, 1, 3, 7, 14, 30]; // gün
export const MAX_BOX = INTERVALS.length - 1;

/** Yerel saatle YYYY-MM-DD. */
export function dayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(key, n) {
  const [y, m, d] = key.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d + n));
}

export function newCard(today) {
  return { box: 0, due: today, right: 0, wrong: 0 };
}

/** Bir cevaptan sonra kartın yeni durumu. */
export function grade(card, ok, today) {
  if (ok) {
    const box = Math.min(card.box + 1, MAX_BOX);
    return { ...card, box, due: addDays(today, INTERVALS[box]), right: card.right + 1 };
  }
  return { ...card, box: 0, due: today, wrong: card.wrong + 1 };
}

export const isDue = (card, today) => card.due <= today;

/** 0–100 arası ustalık yüzdesi. */
export const mastery = (card) => (card ? Math.round((card.box / MAX_BOX) * 100) : 0);

/**
 * Günlük tekrar listesi: önce vadesi gelenler (en eskisi önce), sonra bugünün senaryosundaki
 * henüz görülmemiş cümleler. Böylece ~%80 pekiştirme, ~%20 yeni kalıp olur.
 */
export function buildQueue({ srsCards, sceneCardIds, allCardIds, today, size = 5 }) {
  const due = Object.entries(srsCards)
    .filter(([id, c]) => allCardIds.includes(id) && isDue(c, today))
    .sort((a, b) => (a[1].due < b[1].due ? -1 : a[1].due > b[1].due ? 1 : a[1].box - b[1].box))
    .map(([id]) => id);
  const fresh = sceneCardIds.filter((id) => !srsCards[id]);
  const newSlots = Math.max(1, size - Math.min(due.length, size - 1));
  const queue = [...due.slice(0, size - Math.min(newSlots, fresh.length)), ...fresh.slice(0, newSlots)];
  // Hâlâ boşluk varsa: bugünün senaryosundan zaten bilinenler (en düşük kutudan).
  for (const id of [...sceneCardIds].sort((a, b) => (srsCards[a]?.box ?? 0) - (srsCards[b]?.box ?? 0))) {
    if (queue.length >= size) break;
    if (!queue.includes(id)) queue.push(id);
  }
  return queue.slice(0, size);
}
