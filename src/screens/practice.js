import { h, icon } from '../lib/dom.js';
import { cards } from '../content/index.js';
import { today } from '../lib/store.js';
import { grade, isDue } from '../lib/srs.js';
import { buildSession, finishPractice, isPracticeOpen, practiceRec, buildExam, finishExam, examNeed, EXAM_SIZE, EXAM_XP } from '../lib/practice.js';
import { dayPlan, weekOf, isDayDone, examRec, TOTAL_DAYS } from '../lib/program.js';
import { createSession } from './session.js';

/** Bir günün 30 adımlık tekrarı: #/practice/<gün>. */
export function renderPractice(ctx, param) {
  const n = Number(param);
  const plan = dayPlan(n);
  if (!plan) { ctx.go('notebook'); return h('div'); }
  const back = () => ctx.go('notebook');
  const rec = practiceRec(ctx.state, n);

  const header = (right) => h('header', { class: 'topbar' },
    h('div', { class: 'row grow' },
      h('button', { class: 'icon-btn plain', 'aria-label': 'Geri', onclick: back }, icon('back')),
      h('div', {}, h('p', { class: 'small muted' }, `Gün ${n} · ${plan.title}`), h('h3', {}, rec ? 'Tekrar (XP yok)' : 'Tekrar'))),
    right);

  if (!isPracticeOpen(ctx.state, n)) {
    return h('div', { class: 'screen full' }, header(null),
      h('div', { class: 'card empty stack' }, h('p', { style: 'font-size:40px' }, '🔒'), h('h2', {}, `Gün ${n} henüz kilitli`),
        h('p', {}, 'Programda bu günü bitirince tekrarı açılır.'),
        h('button', { class: 'btn block', onclick: () => ctx.go(`day/${n}`) }, `Gün ${n}'e git`, icon('arrow'))));
  }

  function finish({ ok, total, missed }) {
    const { xp, first } = finishPractice(ctx.state, n, ok, total, today());
    ctx.persist();
    const pct = total ? Math.round((ok / total) * 100) : 0;
    const missList = [...missed].map((id) => cards[id]);
    const nextOpen = isPracticeOpen(ctx.state, n + 1);
    body.replaceChildren(h('div', { class: 'stack' },
      h('section', { class: 'card done-card stack' },
        h('p', { style: 'font-size:36px' }, pct >= 80 ? '🏆' : pct >= 50 ? '💪' : '🌱'),
        h('h2', {}, `${ok} / ${total} doğru`),
        h('p', { class: 'small muted' }, first ? `Gün ${n} tekrarı tamam!` : `Bu günün XP'sini daha önce almıştın. En iyi skorun: ${practiceRec(ctx.state, n).best} / ${total}`),
        xp ? h('span', { class: 'chip gold' }, `+${xp} XP`) : null),
      missList.length ? h('section', { class: 'card stack' },
        h('p', { class: 'eyebrow' }, 'Zorlandıkların'),
        ...missList.map((c) => h('div', {}, h('p', { class: 'it', lang: 'it' }, c.it), h('p', { class: 'tr' }, c.tr)))) : null,
      nextOpen ? h('button', { class: 'btn block', onclick: () => ctx.go(`practice/${n + 1}`) }, `Gün ${n + 1} tekrarı`, icon('arrow')) : null,
      h('button', { class: `btn ${nextOpen ? 'secondary' : ''} block`, onclick: back }, 'Yola dön'),
      h('button', { class: 'btn ghost block', onclick: () => ctx.refresh() }, icon('repeat'), 'Baştan tekrar et (XP yok)')));
  }

  // Vadesi gelmiş bir cümleyi yolda doğru bilmek, tekrar kutusunda da ilerletir.
  const onAnswer = (id, good) => {
    const c = ctx.state.cards[id];
    if (good && c && isDue(c, today())) ctx.state.cards[id] = grade(c, true, today());
  };
  const { counter, bar, body, start } = createSession(buildSession(n), { onFinish: finish, onAnswer });
  start();
  return h('div', { class: 'screen full' }, header(counter), bar, body);
}


/** Hafta kontrol sınavı: #/exam/<gün>. 20 soru, %80 ile geçilir; geçince sonraki hafta açılır. */
export function renderExam(ctx, param) {
  const n = Number(param);
  const plan = dayPlan(n);
  if (!plan?.gate) { ctx.go('program'); return h('div'); }
  const week = weekOf(n);
  const last = n === TOTAL_DAYS;
  const back = () => ctx.go(`day/${n}`);
  const rec = examRec(ctx.state, n);
  const need = examNeed();
  const header = (right) => h('header', { class: 'topbar' },
    h('div', { class: 'row grow' },
      h('button', { class: 'icon-btn plain', 'aria-label': 'Geri', onclick: back }, icon('back')),
      h('div', {}, h('p', { class: 'small muted' }, `Gün ${n} · ${week.week}. hafta`), h('h3', {}, last ? 'Final sınavı' : 'Kontrol sınavı'))),
    right);

  if (!isDayDone(ctx.state, n)) {
    return h('div', { class: 'screen full' }, header(null),
      h('div', { class: 'card empty stack' }, h('p', { style: 'font-size:40px' }, '🔒'), h('h2', {}, 'Önce günü bitir'),
        h('p', {}, `Gün ${n}'in dört adımını bitirince sınav açılır.`),
        h('button', { class: 'btn block', onclick: back }, `Gün ${n}'e git`, icon('arrow'))));
  }

  const screen = h('div', { class: 'screen full' });
  const begin = () => {
    const { counter, bar, body, start } = createSession(buildExam(n), { onFinish: finish });
    screen.replaceChildren(header(counter), bar, body);
    start();
    function finish({ ok, total, missed }) {
      const { passed, firstPass, xp } = finishExam(ctx.state, n, ok, total, today());
      ctx.persist();
      const missList = missed.map((id) => cards[id]);
      body.replaceChildren(h('div', { class: 'stack' },
        h('section', { class: `card ${passed ? 'done-card' : 'exam-fail'} stack` },
          h('p', { style: 'font-size:40px' }, passed ? '🎉' : '📚'),
          h('h2', {}, `${ok} / ${total} doğru`),
          h('p', {}, passed
            ? (last ? '30 günlük programı bitirdin. Complimenti!' : `Geçtin! ${week.week + 1}. hafta açıldı.`)
            : `Geçmek için ${need} doğru gerekiyor. Zorlandığın cümleleri çalışıp yeniden dene.`),
          xp ? h('span', { class: 'chip gold' }, `+${xp} XP`) : null,
          passed && !firstPass ? h('p', { class: 'small muted' }, 'Bu sınavı daha önce geçmiştin; XP bir kez verilir.') : null),
        missList.length ? h('section', { class: 'card stack' },
          h('p', { class: 'eyebrow' }, 'Zorlandıkların'),
          ...missList.map((c) => h('div', {}, h('p', { class: 'it', lang: 'it' }, c.it), h('p', { class: 'tr' }, c.tr)))) : null,
        passed && !last ? h('button', { class: 'btn block', onclick: () => ctx.go(`day/${n + 1}`) }, `Gün ${n + 1}'e geç`, icon('arrow')) : null,
        !passed ? h('button', { class: 'btn block', onclick: () => ctx.go('notebook') }, icon('repeat'), 'Tekrar yolunda çalış') : null,
        h('button', { class: `btn ${passed ? 'ghost' : 'secondary'} block`, onclick: () => ctx.refresh() }, 'Yeniden dene')));
    }
  };

  screen.replaceChildren(header(null),
    h('section', { class: 'card stack exam-intro' },
      h('p', { class: 'eyebrow' }, last ? 'Final' : `${week.week}. hafta kontrolü`),
      h('h2', {}, `${EXAM_SIZE} soru · ${need} doğru ile geçersin`),
      h('p', {}, plan.gate),
      h('p', { class: 'small muted' }, last
        ? 'Tüm programdan cümleler gelir. Seçmeli, boşluk doldurma ve yazmalı sorular var; ipucu kullanırsan o soru doğru sayılmaz.'
        : `Bu haftanın cümlelerinden gelir. Geçince ${week.week + 1}. hafta açılır. Seçmeli, boşluk doldurma ve yazmalı sorular var; ipucu kullanırsan o soru doğru sayılmaz.`),
      rec ? h('p', { class: 'small' }, rec.passed ? `✓ Geçtin · en iyi ${rec.best} / ${rec.total}` : `Önceki deneme: en iyi ${rec.best} / ${rec.total}`) : null,
      !rec?.passed ? h('span', { class: 'chip gold' }, `İlk geçişte +${EXAM_XP} XP`) : null),
    h('button', { class: 'btn block', onclick: begin }, rec ? 'Yeniden başla' : 'Sınava başla', icon('arrow')));
  return screen;
}
