# PARLO! — İtalya'da konuş 🇮🇹

İtalya'da yaşayan Türkler için gerçek hayat senaryolarıyla İtalyanca **konuşma** pratiği.
Az gramer, çok pratik: kalıbı öğren → hızlı tekrarla pekiştir → gerçek bir durumda kullan.

## Neler var (v0.3)

- **Günün dersi:** önce 5 cümlelik hızlı tekrar, sonra günün senaryosunda sohbet.
- **6 senaryo:** Kafe, Restoran, Okul, İş yeri, Şarküteri, Şehir. Diyaloglar cevabına göre dallanır.
- **Öğretmen paneli:** cevabın tutmazsa hangi parçanın eksik olduğunu gösterir (örn. "eksik: istek fiili"). İstersen ipucu ya da doğal bir cevap önerir.
- **Ses:** her İtalyanca cümlede 🔊 dinle ve 🐢 yavaş dinle. Sohbette 🎤 ile sesli cevap (tarayıcının kendi ses motoru, internet gerekmez).
- **Aralıklı tekrar (Leitner):** doğru bildiğin cümle 1 → 3 → 7 → 14 → 30 gün sonra tekrar gelir, yanlışta başa döner.
- **Kalıp defteri:** 12 temel kalıp, ustalık göstergesi ve kendi cümlelerin.
- **Gelişim:** "Artık bunları yapabiliyorsun" listesi, cümle hafızası, haftalık takvim.
- **PWA:** telefona kurulabilir, çevrimdışı açılır. Veriler sadece cihazda (localStorage) tutulur.

## Geliştirme

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # birim + içerik testleri (vitest)
npm run build    # dist/ (statik, her yerde host edilebilir)
```

Proje yapısı:

```
src/
  content/        # Tüm içerik JSON: senaryolar, cümle kartları, kalıplar, kültür ipuçları
  lib/            # answer (cevap kontrolü), srs (aralıklı tekrar), store, speech, dom, icons
  screens/        # home, scenes, chat, review, notebook, progress, result
  styles.css      # Warm Mediterranean tasarım token'ları
tests/            # answer, srs ve içerik bütünlüğü testleri
docs/             # konsept v2, tasarım sistemi (DESIGN.md), seçilen Stitch ekranları, kararlar
```

## İçerik eklemek

Yeni senaryo ya da cümle eklemek için kod değil, `src/content/*.json` dosyaları düzenlenir.
`npm test` her örnek cevabın kendi niyetiyle eşleştiğini, her düğüme ulaşılabildiğini ve her kartın bir senaryoda kullanıldığını otomatik kontrol eder.
Ayrıntılar için [CLAUDE.md](CLAUDE.md) dosyasına bak.
