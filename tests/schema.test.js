// supabase/schema.sql gerçek bir Postgres'te (PGlite) çalıştırılarak test edilir.
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';

const SQL = readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8');
const W1 = '2026-09-28';
const W2 = '2026-10-05';
const secretOf = (id) => `s-${id}`.padEnd(32, 'x');
let db;

const submit = (id, { league = null, name = 'Oyuncu', week = W1, xp = 10, total = xp, secret = secretOf(id) } = {}) =>
  db.query('select public.submit_score($1,$2,$3,$4,$5,$6,$7,$8,$9)', [id, secret, league, name, '🦊', '#12804A', week, xp, total]);
const division = async (id, week = W1) => (await db.query('select * from public.get_division($1,$2)', [id, week])).rows;
const tier = async (id) => (await db.query('select public.get_tier($1) as t', [id])).rows[0].t;

describe('supabase/schema.sql', () => {
  beforeAll(async () => {
    db = await PGlite.create({ extensions: { pgcrypto } });
    await db.exec('create role anon; create role authenticated;');
    await db.exec(SQL);
    await db.exec(SQL); // ikinci kez çalıştırmak güvenli olmalı
  }, 60000);

  describe('arkadaş ligi', () => {
    const A = randomUUID();
    const B = randomUUID();
    it('lig koduyla oyuncuları döndürür (gizli alan olmadan)', async () => {
      await submit(A, { league: 'abc123', name: 'Serkan', xp: 40, total: 120 });
      await submit(B, { league: 'ABC123', name: 'Ayşe', xp: 85 });
      const { rows } = await db.query("select * from public.get_league('abc123')");
      expect(rows.map((r) => r.name)).toEqual(['Serkan', 'Ayşe']);
      expect(Object.keys(rows[0])).not.toContain('secret_hash');
    });
    it('yanlış gizli anahtarla başkasının puanını değiştiremez', async () => {
      await expect(submit(A, { secret: 'y'.repeat(32), xp: 9999 })).rejects.toThrow(/forbidden/);
    });
    it('geçersiz verileri reddeder', async () => {
      await expect(submit(randomUUID(), { league: 'AB' })).rejects.toThrow();
      await expect(submit(randomUUID(), { secret: 'short' })).rejects.toThrow(/invalid secret/);
      await expect(submit(randomUUID(), { week: '2026-09-30' })).rejects.toThrow(/monday/);
    });
    it('anon rolü tablolara doğrudan erişemez ama fonksiyonları çağırabilir', async () => {
      await db.exec('set role anon');
      await expect(db.query('select * from public.players')).rejects.toThrow(/permission denied/);
      await expect(db.query('select * from public.memberships')).rejects.toThrow(/permission denied/);
      expect((await db.query("select name from public.get_league('ABC123')")).rows).toHaveLength(2);
      await db.exec('reset role');
    });
    it('hesap silme sadece doğru anahtarla çalışır', async () => {
      await db.query('select public.leave_league($1,$2)', [B, 'z'.repeat(32)]);
      expect((await db.query("select * from public.get_league('ABC123')")).rows).toHaveLength(2);
      await db.query('select public.leave_league($1,$2)', [B, secretOf(B)]);
      expect((await db.query("select * from public.get_league('ABC123')")).rows).toHaveLength(1);
    });
  });

  describe('kademeli haftalık lig', () => {
    it('XP kazanmadan gruba girmez, kazanınca Bronz gruba yerleşir', async () => {
      const id = randomUUID();
      await submit(id, { xp: 0 });
      expect(await division(id)).toHaveLength(0);
      await submit(id, { xp: 15 });
      const rows = await division(id);
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0].tier).toBe(0);
      await submit(id, { xp: 40 });
      expect((await division(id)).find((r) => r.id === id).week_points).toBe(40);
    });

    it('gruplar en fazla 30 kişi olur', async () => {
      const week = '2026-08-03';
      const ids = Array.from({ length: 35 }, () => randomUUID());
      for (const id of ids) await submit(id, { week, xp: 5 });
      const first = await division(ids[0], week);
      const last = await division(ids[34], week);
      expect(first).toHaveLength(30);
      expect(last).toHaveLength(5);
      expect(first[0].division_id).not.toBe(last[0].division_id);
    });

    it('hafta sonunda ilk 7 yükselir, son 5 düşer, ortadakiler kalır', async () => {
      const ids = Array.from({ length: 15 }, () => randomUUID());
      // Hepsi önce Gümüş kademesinde olsun
      for (const id of ids) await submit(id, { week: '2026-07-06', xp: 0 });
      await db.query('update public.players set tier = 1 where id = any($1)', [ids]);
      // W1: Gümüş grubunda farklı XP'ler (ids[0] en yüksek)
      for (const [i, id] of ids.entries()) await submit(id, { week: '2026-07-13', xp: 1000 - i * 10 });
      const g = await division(ids[0], '2026-07-13');
      expect(g[0].tier).toBe(1);
      expect(g).toHaveLength(15);
      // W2: yeni haftada ilk XP ile yeni kademe belirlenir
      for (const id of ids) await submit(id, { week: '2026-07-20', xp: 5 });
      const tiers = await Promise.all(ids.map(tier));
      expect(tiers.slice(0, 7)).toEqual(Array(7).fill(2)); // Altın
      expect(tiers.slice(7, 10)).toEqual(Array(3).fill(1)); // Gümüş'te kalır
      expect(tiers.slice(10)).toEqual(Array(5).fill(0)); // Bronz
      expect((await division(ids[0], '2026-07-20'))[0].tier).toBe(2);
    });

    it('küçük grupta (10 kişiden az) kimse düşmez; tek kişi yükselmez', async () => {
      const ids = Array.from({ length: 3 }, () => randomUUID());
      for (const id of ids) await submit(id, { week: '2026-06-01', xp: 0 });
      await db.query('update public.players set tier = 3 where id = any($1)', [ids]);
      for (const [i, id] of ids.entries()) await submit(id, { week: '2026-06-08', xp: 10 * (i + 1) });
      for (const id of ids) await submit(id, { week: '2026-06-15', xp: 1 });
      expect(await Promise.all(ids.map(tier))).toEqual([4, 4, 4]);
      const solo = randomUUID();
      await submit(solo, { week: '2026-05-04', xp: 0 });
      await db.query('update public.players set tier = 5 where id = $1', [solo]);
      await submit(solo, { week: '2026-05-11', xp: 50 });
      await submit(solo, { week: '2026-05-18', xp: 1 });
      expect(await tier(solo)).toBe(5);
    });

    it('en üst kademede kalır, en alttan aşağı inmez', async () => {
      const ids = Array.from({ length: 12 }, () => randomUUID());
      for (const id of ids) await submit(id, { week: '2026-04-06', xp: 0 });
      await db.query('update public.players set tier = 9 where id = any($1)', [ids.slice(0, 6)]);
      for (const [i, id] of ids.slice(0, 6).entries()) await submit(id, { week: '2026-04-13', xp: 100 - i });
      for (const id of ids.slice(0, 6)) await submit(id, { week: '2026-04-20', xp: 1 });
      expect(await tier(ids[0])).toBe(9);
    });
  });
});
