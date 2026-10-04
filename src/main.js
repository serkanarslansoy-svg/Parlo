import './styles.css';
import { h, icon, $ } from './lib/dom.js';
import { load, save } from './lib/store.js';
import { renderHome } from './screens/home.js';
import { renderScenes } from './screens/scenes.js';
import { renderChat } from './screens/chat.js';
import { renderReview } from './screens/review.js';
import { renderNotebook } from './screens/notebook.js';
import { renderProgress } from './screens/progress.js';
import { renderResult } from './screens/result.js';

const TABS = [
  { route: 'home', label: 'Bugün', icon: 'home' },
  { route: 'scenes', label: 'Senaryolar', icon: 'compass' },
  { route: 'notebook', label: 'Cümlelerim', icon: 'book' },
  { route: 'progress', label: 'Gelişim', icon: 'chart' },
];

// Tam ekran akışlar: alt menü gizlenir, böylece yazı kutusu ve butonlar menünün altında kalmaz.
const FULLSCREEN = new Set(['chat', 'review', 'result']);

const ctx = {
  state: load(),
  lastResult: null,
  persist() { save(ctx.state); },
  go(path) { location.hash = `#/${path}`; },
  refresh() { render(); },
};

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
  const { route, param, query } = parseHash();
  const screens = {
    home: () => renderHome(ctx),
    scenes: () => renderScenes(ctx),
    chat: () => renderChat(ctx, param, query),
    review: () => renderReview(ctx, query),
    notebook: () => renderNotebook(ctx),
    progress: () => renderProgress(ctx),
    result: () => renderResult(ctx),
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
