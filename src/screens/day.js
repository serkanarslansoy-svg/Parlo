import { h, icon } from '../lib/dom.js';
import { cards, sceneById } from '../content/index.js';
import { DAYS, WEEKS, STEPS, TOTAL_DAYS, dayPlan, weekOf, isStepDone, isDayDone, nextStep, isUnlocked, waitsForTomorrow, currentDay, doneCount } from '../lib/program.js';
import { isDue } from '../lib/srs.js';
import { today } from '../lib/store.js';
import { topbar } from '../ui.js';

/** Bir adımın açıldığı rota. */
export function stepRoute(n, stepId) {
  const plan = dayPlan(n);
  if (stepId === 'review') return `review?program=${n}`;
  if (stepId === 'learn') return `learn/${n}`;
  if (stepId === 'talk') return plan.talk.scene ? `chat/${plan.talk.scene}?program=${n}` : `drill/${n}`;
  return `fix/${n}`;
}

function stepDetail(ctx, n, stepId) {
  const plan = dayPlan(n);
  const t = today();
  if (stepId === 'review') {
    const due = Object.entries(ctx.state.cards).filter(([id, c]) => cards[id] && isDue(c, t)).length;
    return due ? `${due} cümlenin tekrar zamanı geldi (dün, 3 gün ve 7 gün önce)` : 'Dün, 3 gün ve 7 gün önceki cümleler';
  }
  if (stepId === 'learn') {
    if (!plan.learn.length) return 'Bugün yeni cümle yok; konuşmaya odaklan';
    return `${plan.learn.length} yeni cümle: «${cards[plan.learn[0]].it}»…`;
  }
  if (stepId === 'talk') {
    if (plan.talk.scene) {
      const s = sceneById(plan.talk.scene);
      return `${s.persona.name} ile sohbet: ${s.tr}`;
    }
    return `${plan.talk.title}: ${plan.talk.drill.length} soru`;
  }
  const m = ctx.state.program?.days?.[n]?.mistakes?.length || 0;
  return m ? `Bugünün en önemli ${Math.min(3, m)} hatası` : 'Bugünün en önemli 3 hatası';
}

export function renderDay(ctx, param) {
  const n = Number(param) || currentDay(ctx.state) || TOTAL_DAYS;
  const plan = dayPlan(n);
  if (!plan) { ctx.go('program'); return h('div'); }
  const week = weekOf(n);
  const t = today();
  const unlocked = isUnlocked(ctx.state, n);
  const done = isDayDone(ctx.state, n);
  const nxt = nextStep(ctx.state, n);
  const flash = ctx.flash;
  ctx.flash = null;
  const minutes = STEPS.reduce((s, x) => s + x.min, 0);

  const stepRow = (s, i) => {
    const ok = isStepDone(ctx.state, n, s.id);
    const current = unlocked && nxt?.id === s.id;
    return h('button', { class: `day-step ${ok ? 'done' : ''} ${current ? 'current' : ''}`, disabled: !unlocked, onclick: () => ctx.go(stepRoute(n, s.id)) },
      h('span', { class: 'ds-num' }, ok ? icon('check') : String(i + 1)),
      h('span', { class: 'grow' },
        h('span', { class: 'ds-title' }, s.label, h('span', { class: 'ds-min' }, `${s.min} dk`)),
        h('span', { class: 'ds-sub' }, stepDetail(ctx, n, s.id))),
      current ? h('span', { class: 'chip gold' }, 'Başla') : icon('chevron', 'chev'));
  };

  const rec = ctx.state.program?.days?.[n];
  return h('div', { class: 'screen' },
    topbar({ subtitle: '30 günlük program' }),
    flash ? h('div', { class: 'card flash' }, icon('sparkle'), h('p', {}, flash)) : null,
    h('section', { class: 'day-hero' },
      h('div', { class: 'row between' },
        h('p', { class: 'eyebrow' }, `${week.week}. hafta · ${week.title}`),
        h('span', { class: 'chip glass-dark' }, `${minutes} dk`)),
      h('h1', {}, h('span', { class: 'day-n' }, `Gün ${n}`), h('span', { class: 'day-of' }, ` / ${TOTAL_DAYS}`)),
      h('h2', {}, plan.title),
      h('p', {}, plan.focus),
      h('div', { class: 'day-track' }, DAYS.map((d) => h('i', { class: `${isDayDone(ctx.state, d.day) ? 'on' : ''} ${d.day === n ? 'now' : ''}` })))),
    !unlocked ? h('div', { class: 'card cream' }, `Bu gün, ${n - 1}. gün bitince açılır.`) : null,
    unlocked && waitsForTomorrow(ctx.state, n, t)
      ? h('div', { class: 'card sun stack' }, h('h3', {}, 'Bugünlük harika iş çıkardın'), h('p', { class: 'small' }, 'Tekrar kuralı en iyi ertesi gün çalışır. Yine de devam etmek istersen başlayabilirsin.'))
      : null,
    done ? h('div', { class: 'card done-card stack' },
      h('p', { style: 'font-size:36px' }, '🎉'),
      h('h3', {}, `Gün ${n} tamam!`),
      dayPlan(n + 1) ? h('p', { class: 'small muted' }, `Sıradaki: Gün ${n + 1} · ${dayPlan(n + 1).title}`) : h('p', { class: 'small muted' }, '30 günü bitirdin. Complimenti!'),
      dayPlan(n + 1) ? h('button', { class: 'btn soft block', onclick: () => ctx.go(`day/${n + 1}`) }, `Gün ${n + 1}'e geç`, icon('arrow')) : null) : null,
    h('section', { class: 'stack' }, STEPS.map(stepRow)),
    plan.words ? h('section', { class: 'card cream stack' }, h('p', { class: 'eyebrow' }, 'Bugünün kelimeleri'), h('p', { class: 'small', lang: 'it' }, plan.words)) : null,
    plan.change ? h('section', { class: 'card stack' }, h('p', { class: 'eyebrow' }, '3. tur değişikliği'), h('p', {}, plan.change), h('p', { class: 'small muted' }, 'Sahneyi önce ipucuyla, sonra ipucusuz, sonra bu değişiklikle oyna.')) : null,
    plan.gate ? h('section', { class: 'card gate stack' }, h('p', { class: 'eyebrow' }, `${week.week}. hafta kontrolü`), h('p', {}, plan.gate)) : null,
    rec?.mistakes?.length ? h('p', { class: 'small muted' }, `Bugün not edilen hata: ${rec.mistakes.length}`) : null,
    h('button', { class: 'btn ghost block', onclick: () => ctx.go('program') }, 'Tüm program', icon('chevron')));
}

export function renderProgram(ctx) {
  const cur = currentDay(ctx.state);
  const doneN = doneCount(ctx.state);
  return h('div', { class: 'screen' },
    topbar({ subtitle: '30 günlük program' }),
    h('section', {},
      h('p', { class: 'eyebrow' }, 'Günde 15 dakika'),
      h('h1', {}, '30 günde konuşmaya'),
      h('p', { class: 'muted', style: 'margin-top:6px' }, 'Gramerden değil konuşma ihtiyacından başla: 10 kalıp, 100 kelime, 7 sahne, serbest konuşma.')),
    h('div', { class: 'card row' },
      h('div', { class: 'grow' }, h('p', { class: 'eyebrow' }, 'İlerleme'), h('h2', {}, `${doneN} / ${TOTAL_DAYS} gün`)),
      cur ? h('button', { class: 'btn', onclick: () => ctx.go(`day/${cur}`) }, `Gün ${cur}`, icon('arrow')) : h('span', { class: 'chip gold' }, 'Tamamlandı 🏆')),
    WEEKS.map((w) => h('section', { class: 'stack' },
      h('div', {}, h('h2', {}, `${w.week}. hafta · ${w.title}`), h('p', { class: 'small muted' }, w.goal)),
      h('div', { class: 'day-grid' }, DAYS.filter((d) => d.week === w.week).map((d) => {
        const ok = isDayDone(ctx.state, d.day);
        const open = isUnlocked(ctx.state, d.day);
        return h('button', { class: `day-chip ${ok ? 'done' : ''} ${d.day === cur ? 'now' : ''}`, disabled: !open, onclick: () => ctx.go(`day/${d.day}`), 'aria-label': `Gün ${d.day}: ${d.title}${ok ? ', tamamlandı' : open ? '' : ', kilitli'}` },
          h('span', { class: 'dc-n' }, ok ? '✓' : d.day),
          h('span', { class: 'dc-t' }, d.title),
          d.gate ? h('span', { class: 'dc-gate' }, 'kontrol') : null);
      })))));
}

