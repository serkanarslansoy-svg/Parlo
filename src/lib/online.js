// Çevrim içi lig: farklı telefonlardaki oyuncular aynı lig koduyla yarışır (Supabase RPC).
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config.js';
import { weekKeys, weekPoints, totalPoints } from './points.js';

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // karışan harfler (O/0, I/1) yok

export function createClient({ url = SUPABASE_URL, key = SUPABASE_ANON_KEY, fetchImpl = globalThis.fetch } = {}) {
  const enabled = Boolean(url && key);
  async function rpc(fn, body) {
    if (!enabled) throw new Error('offline-disabled');
    let res;
    try {
      res = await fetchImpl(`${url.replace(/\/$/, '')}/rest/v1/rpc/${fn}`, {
        method: 'POST',
        headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch {
      throw new Error('network');
    }
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(/forbidden/.test(text) ? 'forbidden' : `http-${res.status}`);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }
  return {
    enabled,
    submit: (row) => rpc('submit_score', row),
    league: (code) => rpc('get_league', { p_league: code }),
    division: (id, weekStart) => rpc('get_division', { p_id: id, p_week_start: weekStart }),
    tier: (id) => rpc('get_tier', { p_id: id }),
    leave: (id, secret) => rpc('leave_league', { p_id: id, p_secret: secret }),
  };
}

export function normalizeCode(text) {
  return String(text || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}
export const isValidCode = (code) => /^[A-Z0-9]{6}$/.test(code);

function randomString(chars, n) {
  const bytes = new Uint8Array(n);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}
export const newLeagueCode = () => randomString(CODE_CHARS, 6);
export const newIdentity = () => ({
  playerId: globalThis.crypto.randomUUID(),
  secret: randomString('abcdefghijklmnopqrstuvwxyz0123456789', 32),
});

/** Profilin sunucuya gönderilecek satırı. */
export function scoreRow(profile, state, day) {
  return {
    p_id: profile.online.playerId,
    p_secret: profile.online.secret,
    p_league: profile.online.league || null,
    p_name: profile.name,
    p_avatar: profile.avatar,
    p_color: profile.color,
    p_week_start: weekKeys(day)[0],
    p_week_points: weekPoints(state, day),
    p_total_points: totalPoints(state),
  };
}

/** Sunucudan gelen satırları lig sıralamasına çevirir. Eski haftanın puanı bu hafta 0 sayılır. */
export function onlineRows(rows, day, mode = 'week', selfId = null) {
  const monday = weekKeys(day)[0];
  const list = (rows || []).map((r) => ({
    profile: { id: r.id, name: r.name, avatar: r.avatar, color: r.color },
    points: mode === 'week' ? (String(r.week_start).slice(0, 10) === monday ? r.week_points : 0) : r.total_points,
    self: r.id === selfId,
  })).sort((a, b) => b.points - a.points || a.profile.name.localeCompare(b.profile.name, 'tr'));
  let rank = 0;
  let prev = null;
  list.forEach((r, i) => { if (r.points !== prev) rank = i + 1; r.rank = rank; prev = r.points; });
  return list;
}

/** Duolingo tarzı kademeler (sunucudaki tier 0–9). */
export const TIERS = [
  { name: 'Bronz', it: 'Bronzo', color: '#B8733A', icon: '🥉' },
  { name: 'Gümüş', it: 'Argento', color: '#8C9AA3', icon: '🥈' },
  { name: 'Altın', it: 'Oro', color: '#E2A400', icon: '🥇' },
  { name: 'Safir', it: 'Zaffiro', color: '#2F5FD0', icon: '🔷' },
  { name: 'Yakut', it: 'Rubino', color: '#C8243F', icon: '🔴' },
  { name: 'Zümrüt', it: 'Smeraldo', color: '#13955B', icon: '🟢' },
  { name: 'Ametist', it: 'Ametista', color: '#8A43C9', icon: '🟣' },
  { name: 'İnci', it: 'Perla', color: '#C9A98F', icon: '⚪' },
  { name: 'Obsidyen', it: 'Ossidiana', color: '#2B2D35', icon: '⚫' },
  { name: 'Elmas', it: 'Diamante', color: '#3AB3D8', icon: '💎' },
];
export const RULES = { promote: 7, demote: 5, minForDemote: 10, groupSize: 30 };
export const tierOf = (n) => TIERS[Math.max(0, Math.min(TIERS.length - 1, Number(n) || 0))];

/**
 * Grup satırlarını sıralar ve bölgeleri işaretler: 'up' (yükselme), 'down' (düşme) ya da null.
 * Sunucudaki kuralla aynı: ilk 7 (XP > 0) yükselir; 10+ kişilik grupta son 5 düşer; en üst/alt kademe sınırları.
 */
export function divisionRows(rows, selfId) {
  const list = (rows || []).map((r) => ({
    profile: { id: r.id, name: r.name, avatar: r.avatar, color: r.color },
    points: r.week_points,
    self: r.id === selfId,
  }));
  const tier = Number(rows?.[0]?.tier ?? 0);
  const size = list.length;
  list.forEach((r, i) => {
    r.rank = i + 1;
    if (i < RULES.promote && r.points > 0 && size > 1 && tier < TIERS.length - 1) r.zone = 'up';
    else if (size >= RULES.minForDemote && i >= size - RULES.demote && tier > 0) r.zone = 'down';
    else r.zone = null;
  });
  return { tier, rows: list };
}

export function errorMessage(err) {
  switch (err?.message) {
    case 'network': return 'İnternet bağlantısı yok gibi görünüyor. Bağlanınca tekrar dene.';
    case 'forbidden': return 'Bu oyuncu kaydı başka bir cihaza ait.';
    case 'offline-disabled': return 'Çevrim içi lig henüz kurulmadı.';
    default: return 'Sunucuya ulaşılamadı. Biraz sonra tekrar dene.';
  }
}
