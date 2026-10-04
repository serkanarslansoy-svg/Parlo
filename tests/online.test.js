import { describe, it, expect, vi } from 'vitest';
import { createClient, normalizeCode, isValidCode, newLeagueCode, newIdentity, scoreRow, onlineRows, errorMessage } from '../src/lib/online.js';

const T = '2026-10-04';

describe('lig kodu', () => {
  it('kodu temizler ve doğrular', () => {
    expect(normalizeCode(' ab-c 12 3x ')).toBe('ABC123');
    expect(isValidCode('ABC123')).toBe(true);
    expect(isValidCode('ABC12')).toBe(false);
  });
  it('rastgele kod ve kimlik üretir', () => {
    const c = newLeagueCode();
    expect(isValidCode(c)).toBe(true);
    expect(c).not.toMatch(/[O0I1]/);
    const id = newIdentity();
    expect(id.secret).toHaveLength(32);
    expect(id.playerId).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe('scoreRow / onlineRows', () => {
  const profile = { name: 'Serkan', avatar: '🦊', color: '#12804A', online: { playerId: 'p1', secret: 's', league: 'ABC123' } };
  it('haftalık ve toplam puanı gönderir', () => {
    const row = scoreRow(profile, { pts: { [T]: 30, '2026-09-20': 100 } }, T);
    expect(row).toMatchObject({ p_week_start: '2026-09-28', p_week_points: 30, p_total_points: 130, p_league: 'ABC123' });
  });
  it('eski haftanın puanını bu hafta 0 sayar ve sıralar', () => {
    const rows = onlineRows([
      { id: 'a', name: 'Ayşe', avatar: '🐙', color: '#E5533D', week_start: '2026-09-28', week_points: 50, total_points: 50 },
      { id: 'b', name: 'Burak', avatar: '🦉', color: '#3866D6', week_start: '2026-09-21', week_points: 300, total_points: 400 },
      { id: 'p1', name: 'Serkan', avatar: '🦊', color: '#12804A', week_start: '2026-09-28', week_points: 50, total_points: 90 },
    ], T, 'week', 'p1');
    expect(rows.map((r) => [r.profile.name, r.points, r.rank, r.self])).toEqual([['Ayşe', 50, 1, false], ['Serkan', 50, 1, true], ['Burak', 0, 3, false]]);
    expect(onlineRows(rows.map(() => null).length ? [{ id: 'b', name: 'Burak', week_start: '2026-09-21', week_points: 300, total_points: 400 }] : [], T, 'all')[0].points).toBe(400);
  });
});

describe('createClient', () => {
  it('ayar yoksa kapalıdır', async () => {
    const c = createClient({ url: '', key: '' });
    expect(c.enabled).toBe(false);
    await expect(c.league('ABC123')).rejects.toThrow('offline-disabled');
  });
  it('RPC isteğini doğru başlıklarla gönderir', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, text: async () => '[{"id":"a"}]' }));
    const c = createClient({ url: 'https://x.supabase.co/', key: 'anon', fetchImpl });
    expect(await c.league('ABC123')).toEqual([{ id: 'a' }]);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://x.supabase.co/rest/v1/rpc/get_league');
    expect(init.headers.apikey).toBe('anon');
    expect(JSON.parse(init.body)).toEqual({ p_league: 'ABC123' });
  });
  it('hataları anlaşılır mesaja çevirir', async () => {
    const down = createClient({ url: 'u', key: 'k', fetchImpl: async () => { throw new TypeError('x'); } });
    await expect(down.league('A')).rejects.toThrow('network');
    const forb = createClient({ url: 'u', key: 'k', fetchImpl: async () => ({ ok: false, status: 400, text: async () => '{"message":"forbidden"}' }) });
    await expect(forb.submit({})).rejects.toThrow('forbidden');
    expect(errorMessage(new Error('network'))).toMatch(/İnternet/);
  });
});

import { divisionRows, tierOf, TIERS } from '../src/lib/online.js';

describe('kademeli lig', () => {
  const mk = (n, tier = 2) => Array.from({ length: n }, (_, i) => ({ tier, id: `p${i}`, name: `O${i}`, avatar: '🦊', color: '#12804A', week_points: 100 - i }));
  it('ilk 7 yükselme, son 5 düşme bölgesinde', () => {
    const { tier, rows } = divisionRows(mk(15), 'p3');
    expect(tier).toBe(2);
    expect(rows.filter((r) => r.zone === 'up')).toHaveLength(7);
    expect(rows.slice(10).every((r) => r.zone === 'down')).toBe(true);
    expect(rows[3].self).toBe(true);
  });
  it('küçük grupta düşme yok, en üst kademede yükselme yok, en altta düşme yok', () => {
    expect(divisionRows(mk(8)).rows.some((r) => r.zone === 'down')).toBe(false);
    expect(divisionRows(mk(15, 9)).rows.some((r) => r.zone === 'up')).toBe(false);
    expect(divisionRows(mk(15, 0)).rows.some((r) => r.zone === 'down')).toBe(false);
  });
  it('kademe adları', () => {
    expect(TIERS).toHaveLength(10);
    expect(tierOf(0).name).toBe('Bronz');
    expect(tierOf(99).name).toBe('Elmas');
  });
});
