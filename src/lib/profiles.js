// Aynı cihazda birden fazla oyuncu. Her profilin kendi ilerlemesi (state) ayrı saklanır.
import { freshState } from './store.js';

const KEY = 'parlo_profiles_v1';
const LEGACY_KEY = 'parlo_v3';

export const AVATARS = ['🦊', '🐼', '🦁', '🐙', '🦉', '🐢', '🐝', '🐬', '🦄', '🐸'];
export const COLORS = ['#12804A', '#E5533D', '#3866D6', '#9B4BD1', '#E39A1B', '#1C9AA8'];

const empty = () => ({ profiles: [], active: null, data: {} });

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Profilleri yükler; eski tek kullanıcılı veri varsa onu ilk profile taşır. */
export function loadProfiles() {
  const db = read(KEY);
  if (db?.profiles) return { ...empty(), ...db };
  const legacy = read(LEGACY_KEY);
  if (!legacy) return empty();
  const p = makeProfile(legacy.name || 'Ben', AVATARS[0], COLORS[0]);
  return { profiles: [p], active: p.id, data: { [p.id]: { ...freshState(), ...legacy, name: p.name } } };
}

export function saveProfiles(db) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* gizli mod / dolu depolama */
  }
}

export function makeProfile(name, avatar, color) {
  return { id: `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, name: name.trim().slice(0, 24), avatar, color, created: new Date().toISOString() };
}

export function addProfile(db, { name, avatar, color }) {
  const p = makeProfile(name, avatar, color);
  db.profiles.push(p);
  db.data[p.id] = { ...freshState(), name: p.name };
  db.active = p.id;
  return p;
}

export function removeProfile(db, id) {
  db.profiles = db.profiles.filter((p) => p.id !== id);
  delete db.data[id];
  if (db.active === id) db.active = null;
}

export const activeProfile = (db) => db.profiles.find((p) => p.id === db.active) || null;
export const stateOf = (db, id) => db.data[id] || freshState();
