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

## Yapılmayanlar (bilinçli)
- Serbest AI sohbeti ve telaffuz puanı yok; ikisi de sunucu tarafı gerektirir (bkz. `docs/README.md` yol haritası).
