import { describe, it, expect } from 'vitest';
import { norm, checkSentence, tilesFor, shuffle, matchIntent, tipsFor, distractorsFor } from '../src/lib/answer.js';

describe('norm', () => {
  it('aksan, noktalama ve büyük harfi temizler; kesme işaretini boşluk yapar', () => {
    expect(norm("Dov'è il bagno?")).toBe('dov e il bagno');
    expect(norm('  Più   PIANO!! ')).toBe('piu piano');
    expect(norm('Quant’è?')).toBe('quant e');
  });
});

describe('checkSentence', () => {
  const card = { it: "Vorrei un'acqua naturale.", alt: [] };
  it('kesme işareti/boşluk farkını hata saymaz', () => {
    expect(checkSentence('vorrei un acqua naturale', card).ok).toBe(true);
    expect(checkSentence("Vorrei un'acqua naturale", card).ok).toBe(true);
  });
  it('aksan eksikse doğru sayar ama not düşer', () => {
    const r = checkSentence('quante', { it: "Quant'è?" });
    expect(r.ok).toBe(true);
    expect(r.accentNote).toBe(true);
    expect(checkSentence("Quant'è?", { it: "Quant'è?" }).accentNote).toBe(false);
  });
  it('yanlış kelime sırasını reddeder', () => {
    expect(checkSentence('naturale acqua vorrei un', card).ok).toBe(false);
  });
  it('alternatif cevapları kabul eder', () => {
    expect(checkSentence('Sono la mamma di Matteo', { it: 'Sono il papà di Matteo.', alt: ['Sono la mamma di Matteo.'] }).ok).toBe(true);
  });
});

describe('tilesFor / shuffle', () => {
  it('kartlarda noktalama göstermez', () => {
    expect(tilesFor('Posso pagare con la carta?')).toEqual(['Posso', 'pagare', 'con', 'la', 'carta']);
    expect(tilesFor("Dov'è il bagno?")).toEqual(["Dov'è", 'il', 'bagno']);
  });
  it('karıştırılmış sıra orijinalle aynı olmaz', () => {
    const list = [0, 1, 2, 3];
    for (let i = 0; i < 50; i++) expect(shuffle(list)).not.toEqual(list);
    expect(shuffle([0, 1, 2], () => 0.999)).not.toEqual([0, 1, 2]);
  });
});

describe('matchIntent', () => {
  const intents = [
    { model: 'Vorrei una pizza.', req: [{ label: 'istek', any: ['vorrei', 'prendo'] }, { label: 'yemek', any: ['pizza', 'pasta'] }] },
    { model: 'Niente, grazie.', neg: true, req: [{ label: 'cevap', any: ['niente', 'no'] }] },
  ];
  it('tüm parçalar varsa eşleşir', () => {
    expect(matchIntent('Vorrei una pizza margherita!', intents).intent).toBe(intents[0]);
  });
  it('eksik parçayı söyler', () => {
    const r = matchIntent('una pizza', intents);
    expect(r.intent).toBeNull();
    expect(r.best).toBe(intents[0]);
    expect(r.groups.map((g) => g.ok)).toEqual([false, true]);
  });
  it('olumsuz cümleyi olumlu niyete saymaz', () => {
    expect(matchIntent('non vorrei una pizza', intents).intent).toBeNull();
  });
  it('kelime sınırına dikkat eder ("no" ≠ "non", "te" ≠ "tetto")', () => {
    expect(matchIntent('non so', [intents[1]]).intent).toBeNull();
    expect(matchIntent('un tetto', [{ model: 'Un tè', req: [{ label: 'x', any: ['te'] }] }]).intent).toBeNull();
  });
  it("kesme işaretli kalıpları farklı yazımlarla yakalar (c'è / ce / c e)", () => {
    const i = [{ model: "C'è un problema", req: [{ label: 'x', any: ['c e un problema'] }] }];
    for (const t of ["C'è un problema", 'ce un problema', 'c e un problema', "c'e un problema"]) expect(matchIntent(t, i).intent).toBe(i[0]);
  });
  it('hiçbir parça tutmazsa best boş döner', () => {
    expect(matchIntent('buongiorno', intents)).toEqual({ intent: null, best: null, groups: [] });
  });
});

describe('tipsFor', () => {
  it('«voglio» için kibarlık notu verir', () => {
    expect(tipsFor('Voglio una pizza', { req: [] })[0]).toMatch(/Vorrei/);
  });
  it('ifNot ipucu sadece kelime yoksa çıkar', () => {
    const intent = { req: [], tips: [{ ifNot: ['etti', 'etto'], say: 'miktar' }] };
    expect(tipsFor('mi dà prosciutto', intent)).toEqual(['miktar']);
    expect(tipsFor('mi dà due etti di prosciutto', intent)).toEqual([]);
  });
});

describe('distractorsFor', () => {
  it('cümlede olmayan kelimeler seçer', () => {
    const d = distractorsFor("Quant'è?", ["Quant'è?", 'Posso pagare con la carta?', 'Mi serve aiuto.'], 2);
    expect(d).toHaveLength(2);
    for (const w of d) expect(["Quant'è"]).not.toContain(w);
  });
  it('büyük/küçük harf farkıyla aynı kelimeyi çeldirici yapmaz', () => {
    const d = distractorsFor('Posso pagare', ['posso PAGARE', 'Vorrei acqua'], 5);
    expect(d.map((w) => w.toLowerCase())).not.toContain('posso');
    expect(d.sort()).toEqual(['Vorrei', 'acqua']);
  });
});
