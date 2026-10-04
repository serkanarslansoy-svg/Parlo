# PARLO! — İtalya'da konuş 🇮🇹

İtalya'da yaşayan Türkler için gerçek hayat senaryolarıyla İtalyanca **konuşma** pratiği.
Az gramer, çok pratik: kalıbı öğren → hızlı tekrarla pekiştir → gerçek bir durumda kullan.

## Neler var (v0.7)

- **30 günlük program:** her gün 15 dakika, 4 adım: tekrar (3 dk), yeni kalıp (4 dk), konuşma (6 dk), hata düzeltme (2 dk). 1. hafta 10 kalıp, 2. hafta 100 kelime, 3. hafta 7 sahne, 4. hafta serbest konuşma. Öğrenilen cümleler 1, 3 ve 7 gün sonra geri gelir.

- **Oyuncular ve lig:** aynı cihazda birden fazla profil, puanlar ve haftalık lig (kürsü, sıralama).
- **Çevrim içi ligler:** Duolingo tarzı kademeli haftalık lig (Bronz → Elmas, 30 kişilik gruplar, ilk 7 yükselir / son 5 düşer) ve kodlu arkadaş ligi (davet linki `#/join/KOD`). Kurulum: [supabase/README.md](supabase/README.md).

- **Günün dersi:** önce 5 cümlelik hızlı tekrar, sonra günün senaryosunda sohbet.
- **7 senaryo:** Kafe, Restoran, Okul, İş yeri, Şarküteri, Şehir, Eczane. Diyaloglar cevabına göre dallanır.
- **Öğretmen paneli:** cevabın tutmazsa hangi parçanın eksik olduğunu gösterir (örn. "eksik: istek fiili"). İstersen ipucu ya da doğal bir cevap önerir.
- **Ses (şimdilik kapalı):** dinleme ve mikrofon telefonlarda güvenilir çalışmadığı için kapatıldı; her şey yazıyla ilerliyor. Tekrar açmak için `src/lib/speech.js` içinde `AUDIO_ENABLED = true`.
- **Aralıklı tekrar (Leitner):** doğru bildiğin cümle 1 → 3 → 7 → 14 → 30 gün sonra tekrar gelir, yanlışta başa döner.
- **Cümlelerim (tekrar yolu):** 1'den 30'a duraklar. Programda biten günün durağı açılır; her durak 30 soruluk tekrar (6 kaydırmalı, 10 seçmeli, 2 eşleştirme, 12 yazmalı). İlk bitirişte doğru sayısı + 10 XP; tekrar oynamak serbest ama XP vermez.
- **Gelişim:** "Artık bunları yapabiliyorsun" listesi, cümle hafızası, haftalık takvim.
- **PWA:** telefona kurulabilir, çevrimdışı açılır. Veriler sadece cihazda (localStorage) tutulur.

## Canlı sürüm

`main` dalına her push'ta testler çalışır ve uygulama GitHub Pages'e yayınlanır:
https://serkanarslansoy-svg.github.io/Parlo/
(İlk kurulumda repo ayarlarında Settings → Pages → Source: **GitHub Actions** seçilmelidir.)

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
  screens/        # home, day/program, learn, drill, fix, practice, scenes, chat, review, notebook, progress, result, league
  styles.css      # Warm Mediterranean tasarım token'ları
tests/            # answer, srs ve içerik bütünlüğü testleri
docs/             # konsept v2, tasarım sistemi (DESIGN.md), seçilen Stitch ekranları, kararlar
```

## İçerik eklemek

Yeni senaryo ya da cümle eklemek için kod değil, `src/content/*.json` dosyaları düzenlenir.
`npm test` her örnek cevabın kendi niyetiyle eşleştiğini, her düğüme ulaşılabildiğini ve her kartın bir senaryoda kullanıldığını otomatik kontrol eder.
Ayrıntılar için [CLAUDE.md](CLAUDE.md) dosyasına bak.
