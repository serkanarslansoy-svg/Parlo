# Tasarım kararları ve yol haritası

## Kaynaklar
- `concept-v2.html`: ilk tıklanabilir konsept.
- `design/DESIGN.md`: Warm Mediterranean Editorial tasarım sistemi (Stitch).
- `design/screens/`: her ekran için seçilen Stitch versiyonu.

## v0.3'te alınan kararlar
| Konu | Karar |
|---|---|
| Tasarım sistemi | Warm Mediterranean Editorial: fildişi zemin `#FAF9F6`, İtalyan yeşili `#238B68`, terakota `#D98765`, Epilogue + DM Sans |
| Haftalık takvim | Ana sayfadan Gelişim sayfasına taşındı |
| Menü | 4 sekme: Bugün · Senaryolar · Cümlelerim · Gelişim. Sohbet, tekrar ve sonuç tam ekran (alt menü yazı kutusunu kapatmasın) |
| Ekranlar | Ana sayfa: "Günaydın" editoryal versiyon (misyon kartı, dünkü kalıplar, senaryo şeridi, kültür aynası) · Senaryolar: "Gerçek Hayat Senaryoları" (kategori bölümleri, öne çıkan kart + kompakt liste, AI kartı) · Sohbet: "Trattoria Da Enzo" versiyonu (görsel başlık, adım/görev, önerilen doğal yanıtlar) · Öğretmen: düzeltme paneli · Tekrar: kelime dizme · Sonuç: "Missione completata" + gerçek hayat başarıları |
| Oyunlaştırma | XP kaldırıldı. Sadece hafif bir gün serisi ve "artık yapabiliyorsun" listesi var (DESIGN.md'deki "yetişkin ton" ilkesine uygun) |
| Fotoğraflar | v0.3'te yok; senaryo kartlarında emoji + sıcak gradyan kullanılıyor (hafif, çevrimdışı çalışır) |
| Hitap | Her senaryoda Lei/tu açıkça belirtiliyor; kültür notunda anlatılıyor |
| Veri | Sadece cihazda (localStorage); hesap ve sunucu yok |

## Konsept v2'deki hataların durumu
- Öğretmen bozuk İtalyanca gösteriyordu → `model` (doğru cümle) ile `any` (kabul edilen ifadeler) ayrıldı ve testle korunuyor.
- "grazie" her senaryonun son adımını geçiriyordu → her düğümün kendi niyetleri var.
- `includes` ile "non vorrei" doğru sayılıyordu → kelime sınırı + olumsuzluk kontrolü.
- Kelime kartları karışmıyordu → her soruda karışıyor ve 2 çeldirici kelime ekleniyor.
- Günün görevi rastgele sorular soruyordu → tekrar listesi günün senaryosuna bağlı (vadesi gelenler + yeni kalıplar).
- Yardım sayımı tutarsızdı → ipucu, önerilen cevap ve cevabı görme "yardım" sayılıyor; Türkçe çeviri okuma desteği olarak serbest.
- Klavye erişilebilirliği → tüm etkileşimler gerçek `<button>` / `<a>`.

## Yol haritası
1. **İçerik:** doktor/eczane, Comune/Questura, öğretmenle görüşme, telefon, kira. Senaryo başına 8–10 kart.
2. **AI koç (sunucu gerekir):** serbest sohbet ve kullanıcının yazdığı özel durumlardan senaryo üretme ("Kendi durumunu yaz" listesi şimdiden toplanıyor). API anahtarı istemcide tutulmamalı.
3. **Telaffuz geri bildirimi:** konuşma tanıma sonucunu hedef cümleyle kıyaslayıp kelime bazında işaretleme.
4. **Bildirim:** akşam hatırlatması (PWA push).
5. **Senkronizasyon:** isteğe bağlı hesap ile cihazlar arası ilerleme.
