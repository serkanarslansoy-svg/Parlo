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

## v0.4: oyuncular ve lig
| Konu | Karar |
|---|---|
| Çok oyunculu | Aynı cihazda birden fazla profil ("Kim çalışıyor?"); her profilin ilerlemesi ayrı (`parlo_profiles_v1`). Eski tek kullanıcılı veri ilk profile taşınır |
| Puan | Tekrarda doğru +10 (ipucuyla +5), sohbette yardımsız adım +15 (yardımla +5), senaryo +20, günün dersi +30 |
| Lig | Pazartesi başlayan haftalık sıralama + tüm zamanlar; kürsü, "geçmek için X puan" mesajı |
| Görünüm | "Piazza" paleti (serin açık zemin, İtalyan yeşili, domates kırmızısı, altın puan), Bricolage Grotesque + DM Sans |
| Onay pencereleri | `confirm()` yerine iki dokunuşlu onay butonu |
| Sınır | Profiller cihaza özel. Farklı telefonlardan yarışmak için sunucu gerekir (yol haritası 2) |

## v0.5: çevrim içi lig
| Konu | Karar |
|---|---|
| Sunucu | Supabase (ücretsiz katman). Tabloya doğrudan erişim yok; sadece `submit_score`, `get_league`, `leave_league` fonksiyonları |
| Giriş | E-posta/şifre yok. Her telefon kendi rastgele kimliğini ve gizli anahtarını üretir (bcrypt ile saklanır) |
| Lig | 6 karakterlik kod (karışan harfler yok), davet linki `#/join/KOD`, Web Share ya da panoya kopyalama |
| Senkron | Puan değişince 1,5 sn sonra otomatik gönderim; lig ekranında yenile |
| Sınır | Puanlar istemcide hesaplanır, güvene dayalı (aile/arkadaş ligi) |

## Yol haritası
1. **İçerik:** doktor/eczane, Comune/Questura, öğretmenle görüşme, telefon, kira. Senaryo başına 8–10 kart.
2. **AI koç (sunucu gerekir):** serbest sohbet ve kullanıcının yazdığı özel durumlardan senaryo üretme ("Kendi durumunu yaz" listesi şimdiden toplanıyor). API anahtarı istemcide tutulmamalı.
3. **Telaffuz geri bildirimi:** konuşma tanıma sonucunu hedef cümleyle kıyaslayıp kelime bazında işaretleme.
4. **Bildirim:** akşam hatırlatması (PWA push).
5. **Senkronizasyon:** isteğe bağlı hesap ile cihazlar arası ilerleme.
