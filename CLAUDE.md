# PARLO — geliştirici notları

Vite + vanilla JS PWA. Framework yok; ekranlar `src/lib/dom.js` içindeki `h()` yardımcısıyla DOM üretir.

## Komutlar
- `npm test`: vitest (her değişiklikten sonra çalıştır)
- `npm run build`: üretim derlemesi
- `npm run dev`: geliştirme sunucusu

## Kurallar
- Kullanıcı metni asla `innerHTML` ile eklenmez; `h()` her zaman textContent kullanır. `innerHTML` sadece `icons.js` içindeki sabit SVG'ler için kullanılır.
- Arayüz metni Türkçe, öğretilen dil İtalyanca. İtalyanca metin içeren elemanlara `lang="it"` verilir.
- Renk, yazı tipi ve köşe yuvarlaklığı `styles.css` içindeki `:root` token'larından gelir (kaynak: `docs/design/DESIGN.md`).
- Sohbet, tekrar ve sonuç ekranları tam ekrandır (alt menü gizli); yeni tam ekran rota eklerken `main.js` → `FULLSCREEN` listesine ekle.

## İçerik şeması (`src/content/`)
- `cards.json`: `{id, scene, pattern|null, it, tr, alt?[]}`. Hızlı tekrarda tam cümle olarak sorulur. Kesme işareti, boşluk ve aksan farkı hata sayılmaz (aksan için not düşülür).
- `scenarios.json`: senaryo bir düğüm grafıdır. `start` → `nodes[id] = {ai, tr, hint, intents[]}` ya da `{ai, tr, end: true}`.
  - intent: `{model, tr, req: [{label, show, any[]}], next, cando?, neg?, tips?}`
  - `req` içindeki **her** grup tutmalı; grup içinde `any` listesinden **bir** ifade yeterli (kelime sınırıyla, aksansız eşleşir).
  - `neg: true` olmayan niyetler, cümlede "non" geçiyorsa eşleşmez ("non vorrei una pizza" ≠ sipariş).
  - `model` her zaman doğru yazımlı İtalyanca olmalı; kullanıcıya gösterilir ve seslendirilir. Test, model cümlenin kendi niyetiyle eşleştiğini doğrular.
  - `cando`: sonuç ve gelişim ekranında "Gerçek hayat başarısı" olarak listelenir.
- `patterns.json`: kalıp defteri; kartlar `pattern` alanıyla bağlanır.
- `program.json`: 30 günlük program. `days[] = {day, week, title, focus, learn: [kart id], talk: {scene} | {title, drill: [{q, tr, models[]}]}, words?, change?, gate?}`. Her kart bir sahnede ya da bir günün `learn` listesinde kullanılmalı (test kontrol eder).
  - İlerleme `state.program.days[N] = {steps: {review, learn, talk, fix}, mistakes: [{it, tr}], completedOn}`; mantık `src/lib/program.js`.
  - Cümlelerim pratiği (`src/lib/practice.js`, `#/practice/<write|choose|swipe|match|mix>`): sadece bitirilen günlerin `learn` kartları; sonuçlar `state.practice[id] = {seen, ok}`, doğru başına +1 XP. SRS kutularını değiştirmez.
  - Adım ekranları: tekrar `review?program=N`, yeni kalıp `learn/N`, konuşma `chat/sahne?program=N` ya da `drill/N`, hata `fix/N`. Bittiğinde `ctx.flash` mesajıyla `day/N`'e döner.

## Yapılmayanlar (bilinçli)
- Serbest AI sohbeti ve telaffuz puanı yok; ikisi de sunucu tarafı gerektirir (bkz. `docs/README.md` yol haritası).
