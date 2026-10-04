import './styles.css';
import { h, icon, $ } from './lib/dom.js';
import { freshState } from './lib/store.js';
import { loadProfiles, saveProfiles, activeProfile } from './lib/profiles.js';
import { renderHome } from './screens/home.js';
import { setTopbarRight, avatar } from './ui.js';
import { weekPoints } from './lib/points.js';
import { today } from './lib/store.js';
import { renderScenes } from './screens/scenes.js';
import { renderChat } from './screens/chat.js';
import { renderReview } from './screens/review.js';
import { renderNotebook } from './screens/notebook.js';
import { renderProgress } from './screens/progress.js';
import { renderResult } from './screens/result.js';
import { renderProfiles } from './screens/profiles.js';
import { renderLeague } from './screens/league.js';
import { renderDay, renderProgram } from './screens/day.js';
import { renderLearn } from './screens/learn.js';
import { renderDrill } from './screens/drill.js';
import { renderFix } from './screens/fix.js';
import { createClient, scoreRow, normalizeCode, isValidCode, newIdentity } from './lib/online.js';

const TABS = [
  { route: 'home', label: 'Bugün', icon: 'home' },
  { route: 'scenes', label: 'Senaryolar', icon: 'compass' },
  { route: 'league', label: 'Lig', icon: 'trophy' },
  { route: 'notebook', label: 'Cümlelerim', icon: 'book' },
  { route: 'progress', label: 'Gelişim', icon: 'chart' },
];

// Tam ekran akışlar: alt menü gizlenir, böylece yazı kutusu ve butonlar menünün altında kalmaz.
const FULLSCREEN = new Set(['chat', 'review', 'result', 'profiles', 'learn', 'drill', 'fix']);

const db = loadProfiles();

const online = createClient();
let syncTimer = null;

const ctx = {
  db,
  online,
  pendingJoin: null,
  state: db.active ? db.data[db.active] : freshState(),
  get profile() { return activeProfile(db); },
  lastResult: null,
  flash: null, // bir sonraki ekranda bir kez gösterilen kısa mesaj
  persist() {
    if (db.active) db.data[db.active] = ctx.state;
    saveProfiles(db);
    // XP'yi birkaç saniye içinde sunucuya da gönder (haftalık lig ve arkadaş ligi için).
    if (online.enabled && ctx.profile) {
      clearTimeout(syncTimer);
      syncTimer = setTimeout(() => ctx.syncNow().catch(() => {}), 1500);
    }
  },
  /** Aktif oyuncunun puanını hemen sunucuya gönderir. */
  async syncNow() {
    const p = ctx.profile;
    if (!online.enabled || !p) return;
    clearTimeout(syncTimer);
    if (!p.online) { p.online = newIdentity(); saveProfiles(db); }
    await online.submit(scoreRow(p, ctx.state, today()));
  },
  /** Aktif oyuncuyu değiştirir (null: profil seçim ekranı). */
  switchProfile(id) {
    db.active = id;
    ctx.state = id ? db.data[id] : freshState();
    ctx.lastResult = null;
    saveProfiles(db);
  },
  go(path) {
    // Aynı adrese gidilirse hashchange tetiklenmez (ör. #/home'da açılan giriş ekranı); o zaman elle çiz.
    if (location.hash === `#/${path}`) render();
    else location.hash = `#/${path}`;
  },
  refresh() { render(); },
};

setTopbarRight(() => (ctx.profile
  ? h('button', { class: 'me-chip', 'aria-label': `${ctx.profile.name}: oyuncu değiştir`, onclick: () => ctx.go('profiles') },
    h('span', { class: 'mp' }, `${weekPoints(ctx.state, today())}`, h('small', {}, 'XP')), avatar(ctx.profile, 34))
  : null));

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, query = ''] = raw.split('?');
  const [route = 'home', param] = path.split('/');
  return { route: route || 'home', param, query: new URLSearchParams(query) };
}

const nav = h('nav', { class: 'nav', 'aria-label': 'Ana menü' },
  TABS.map((t) => h('a', { href: `#/${t.route}`, dataset: { route: t.route } }, icon(t.icon), t.label)));

const main = h('main', { id: 'app' });
$('#root').append(h('div', { class: 'shell' }, main, nav));

function render() {
  let { route, param, query } = parseHash();
  if (route === 'join') {
    // Davet linki: #/join/KOD → oyuncu seçildikten sonra çevrim içi lig sekmesinde açılır.
    const code = normalizeCode(param);
    if (isValidCode(code)) ctx.pendingJoin = code;
    location.replace(`#/${ctx.profile ? 'league' : 'profiles'}`);
    return;
  }
  if (!ctx.profile && route !== 'profiles') route = 'profiles';
  const screens = {
    profiles: () => renderProfiles(ctx),
    league: () => renderLeague(ctx),
    home: () => renderHome(ctx),
    scenes: () => renderScenes(ctx),
    chat: () => renderChat(ctx, param, query),
    review: () => renderReview(ctx, query),
    notebook: () => renderNotebook(ctx),
    progress: () => renderProgress(ctx),
    result: () => renderResult(ctx),
    day: () => renderDay(ctx, param),
    program: () => renderProgram(ctx),
    learn: () => renderLearn(ctx, param),
    drill: () => renderDrill(ctx, param),
    fix: () => renderFix(ctx, param),
  };
  const view = (screens[route] || screens.home)();
  main.replaceChildren(view);
  nav.classList.toggle('hidden', FULLSCREEN.has(route));
  for (const a of nav.querySelectorAll('a')) {
    if (a.dataset.route === route) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', render);
render();

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
