// supabase/schema.sql gerçek bir Postgres'te (PGlite) çalıştırılarak test edilir.
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';

const SQL = readFileSync(new URL('../supabase/schema.sql', import.meta.url), 'utf8');
const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const SECRET_A = 'a'.repeat(32);
const SECRET_B = 'b'.repeat(32);
let db;

const submit = (id, secret, league, name, week, total) =>
  db.query('select public.submit_score($1,$2,$3,$4,$5,$6,$7,$8,$9)', [id, secret, league, name, '🦊', '#12804A', '2026-09-28', week, total]);

describe('supabase/schema.sql', () => {
  beforeAll(async () => {
    db = await PGlite.create({ extensions: { pgcrypto } });
    await db.exec('create role anon; create role authenticated;');
    await db.exec(SQL);
    await db.exec(SQL); // ikinci kez çalıştırmak güvenli olmalı
  }, 60000);

  it('oyuncu oluşturur ve ligi döndürür (gizli alan olmadan)', async () => {
    await submit(A, SECRET_A, 'abc123', 'Serkan', 40, 120);
    await submit(B, SECRET_B, 'ABC123', 'Ayşe', 85, 85);
    const { rows } = await db.query("select * from public.get_league('abc123')");
    expect(rows.map((r) => r.name)).toEqual(['Serkan', 'Ayşe']);
    expect(Object.keys(rows[0])).not.toContain('secret_hash');
  });

  it('doğru gizli anahtarla günceller', async () => {
    await submit(A, SECRET_A, 'ABC123', 'Serkan', 60, 140);
    const { rows } = await db.query("select week_points from public.get_league('ABC123') where name = 'Serkan'");
    expect(rows[0].week_points).toBe(60);
  });

  it('yanlış gizli anahtarla başkasının puanını değiştiremez', async () => {
    await expect(submit(A, 'x'.repeat(32), 'ABC123', 'Hacker', 9999, 9999)).rejects.toThrow(/forbidden/);
  });

  it('geçersiz verileri reddeder', async () => {
    await expect(submit('33333333-3333-4333-8333-333333333333', SECRET_A, 'AB', 'X', 1, 1)).rejects.toThrow();
    await expect(submit('33333333-3333-4333-8333-333333333333', 'short', 'ABC123', 'X', 1, 1)).rejects.toThrow(/invalid secret/);
  });

  it('anon rolü tabloyu doğrudan okuyamaz ama fonksiyonu çağırabilir', async () => {
    await db.exec('set role anon');
    await expect(db.query('select * from public.players')).rejects.toThrow(/permission denied/);
    const { rows } = await db.query("select name from public.get_league('ABC123')");
    expect(rows).toHaveLength(2);
    await db.exec('reset role');
  });

  it('ligden ayrılma sadece doğru anahtarla çalışır', async () => {
    await db.query('select public.leave_league($1,$2)', [B, 'y'.repeat(32)]);
    expect((await db.query("select * from public.get_league('ABC123')")).rows).toHaveLength(2);
    await db.query('select public.leave_league($1,$2)', [B, SECRET_B]);
    expect((await db.query("select * from public.get_league('ABC123')")).rows).toHaveLength(1);
  });
});
