// İçerik bütünlüğü: senaryo grafı, örnek cevaplar ve cümle kartları birbiriyle tutarlı olmalı.
import { describe, it, expect } from 'vitest';
import { scenes, cards, patterns, patternById, dailyScene, CATEGORIES } from '../src/content/index.js';
import { matchIntent, checkSentence } from '../src/lib/answer.js';
import { DAYS } from '../src/lib/program.js';

describe.each(scenes.map((s) => [s.id, s]))('senaryo %s', (_, scene) => {
  const nodes = scene.nodes;

  it('başlangıç düğümü var, her "next" mevcut bir düğüme gidiyor', () => {
    expect(nodes[scene.start]).toBeTruthy();
    for (const [id, n] of Object.entries(nodes)) {
      if (n.end) continue;
      expect(n.intents?.length, `${id} niyet içermeli`).toBeGreaterThan(0);
      expect(n.hint, `${id} ipucu içermeli`).toBeTruthy();
      expect(n.goal, `${id} görev içermeli`).toBeTruthy();
      for (const it of n.intents) expect(nodes[it.next], `${id} → ${it.next}`).toBeTruthy();
    }
  });

  it('her düğüme ulaşılabiliyor ve her yol bir sona çıkıyor', () => {
    const seen = new Set();
    const stack = [scene.start];
    while (stack.length) {
      const id = stack.pop();
      if (seen.has(id)) continue;
      seen.add(id);
      for (const it of nodes[id].intents || []) stack.push(it.next);
    }
    expect([...seen].sort()).toEqual(Object.keys(nodes).sort());
    const canEnd = (id, path = new Set()) => nodes[id].end || (!path.has(id) && nodes[id].intents.some((it) => canEnd(it.next, new Set([...path, id]))));
    for (const id of Object.keys(nodes)) expect(canEnd(id), `${id} bir sona ulaşmalı`).toBe(true);
  });

  it('her örnek cevap (model) kendi niyetiyle eşleşiyor', () => {
    for (const [id, n] of Object.entries(nodes)) {
      for (const intent of n.intents || []) {
        const r = matchIntent(intent.model, n.intents);
        expect(r.intent, `${id}: «${intent.model}»`).toBe(intent);
      }
    }
  });

  it('kart ve kalıp referansları geçerli', () => {
    for (const id of scene.cards) expect(cards[id], id).toBeTruthy();
    expect(scene.cards, 'key, senaryonun kartlarından biri olmalı').toContain(scene.key);
    expect(CATEGORIES.map((c) => c.id)).toContain(scene.cat);
    expect(['Lei', 'tu']).toContain(scene.register);
    expect(scene.mission, 'ana sayfa misyon başlığı').toBeTruthy();
  });
});

describe('cümle kartları', () => {
  it('her kart kendi cümlesiyle doğru sayılıyor ve kalıbı mevcut', () => {
    for (const c of Object.values(cards)) {
      expect(checkSentence(c.it, c).ok, c.id).toBe(true);
      if (c.pattern) expect(patternById(c.pattern), `${c.id} → ${c.pattern}`).toBeTruthy();
      expect(scenes.some((s) => s.cards.includes(c.id)) || DAYS.some((d) => d.learn.includes(c.id)), `${c.id} bir senaryoda ya da programda kullanılmalı`).toBe(true);
    }
  });
  it('her kalıbın en az bir örneği var', () => {
    for (const p of patterns) expect(Object.values(cards).some((c) => c.pattern === p.id), p.id).toBe(true);
  });
});

describe('dailyScene', () => {
  it('ardışık günlerde farklı senaryo verir', () => {
    expect(dailyScene('2026-10-04').id).not.toBe(dailyScene('2026-10-05').id);
  });
});

describe('mainPathLength', async () => {
  const { mainPathLength } = await import('../src/screens/chat.js').catch(() => ({}));
  it.skipIf(!mainPathLength)('ana yol en az 3 adım', () => {
    for (const s of scenes) expect(mainPathLength(s), s.id).toBeGreaterThanOrEqual(3);
  });
});
