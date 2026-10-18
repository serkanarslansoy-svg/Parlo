# İnceleme haritası: Busuu (iOS / Android / web)

Kapsam: Busuu'nun ders yapısı, tekrar sistemi, çalışma planı ve motivasyon, konuşma/yazma geri bildirimi (topluluk düzeltmesi ve yapay zekâ konuşma).
Kimin için: PARLO (İtalya'da yaşayan Türkler için konuşma odaklı İtalyanca). Ayrı bir klon değil; Busuu'nun işe yarayan mekaniklerini PARLO'ya uyarlamak.
Tarih: 2026-10-18
Yöntem: sadece herkese açık kaynaklar (kullanıcının Busuu hesabı yok). Busuu'nun metinleri, videoları, görselleri, marka ve renkleri alınmaz.

## Kaynaklar

| # | kaynak | URL | not |
| --- | --- | --- | --- |
| 1 | resmî site | https://www.busuu.com/ | kısa dersler, 4 beceri, "günde 10 dakika", topluluk, konuşma pratiği |
| 2 | Kurslar nasıl işler (resmî) | https://www.busuu.com/en/it-works/courses | CEFR A1–B2 (İngilizcede C1), tekrar aracı neyi bildiğini/zorlandığını izler; çalışma planı |
| 3 | Yardım merkezi: Busuu nedir | https://help.busuu.com/hc/en-us/articles/15936615354641-What-is-Busuu | ders tek konu, ~3–5 dk; seviye tespit sınavı; kontrol noktası sınavları (arama özeti; sayfa 403) |
| 4 | Yardım merkezi: Çalışma planı | https://help.busuu.com/hc/en-us/articles/16097312171153-What-s-a-Study-Plan-How-do-I-make-one | amaç, hedef seviye, gün ve saat, günde 5–30 dk (öneri 10), tahmini bitiş tarihi, tek plan (arama özeti) |
| 5 | Yardım merkezi: Tekrar | https://help.busuu.com/hc/en-us/categories/12823866527250-Review | kelime tekrarı ve dilbilgisi tekrarı ayrı bölümler (arama özeti) |
| 6 | Yardım merkezi: Düzeltme isteme | https://help.busuu.com/hc/en-us/articles/16746012938001-How-do-I-get-other-learners-to-correct-my-exercises | yazma/konuşma alıştırması otomatik topluluğa gider; arkadaş da seçilebilir |
| 7 | Topluluk düzeltmeleri (resmî) | https://www.busuu.com/en/how-to/corrections | eşleştirme algoritması ya da arkadaş listesi |
| 8 | Başkalarına yardım (resmî) | https://www.busuu.com/en/how-to/help-others | düzeltene 5 yıldıza kadar puan + kısa yorum; "yorumları kısa tut" |
| 9 | Basın: Speaking Practice (Haziran 2024) | https://www.businesswire.com/news/home/20240627194750/en | YZ konuşmayı puanlar, düzeltilmesi gereken kelimeleri işaretler + ana dili konuşan videosu |
| 10 | Busuu Conversations (Ekim 2024) | https://www.busuu.com/en/languages/speak-fluently-with-busuu-conversations | YZ ile iki yönlü senaryo diyalogları (iş toplantısı, tanışma, kafede sipariş), anlık geri bildirim |
| 11 | App Store | https://apps.apple.com/app/id379968583 | Smart Review: derslerdeki kelime ve dilbilgisi tek yerde |
| 12 | Braze vaka çalışması | https://www.braze.com/customers/busuu-client-story | bildirim, kullanıcının seçtiği gün ve saatte gelir |
| 13 | Mezzoguild incelemesi | https://www.mezzoguild.com/busuu-review/ | güçlü ve zayıf yanlar |
| 14 | FluentU incelemesi | https://www.fluentu.com/blog/busuu-review/ | ders yapısı: kelime → pratik → quiz; 5–7 dk |
| 15 | learnenglish.life incelemesi | https://learnenglish.life/reviews/busuu/ | topluluk düzeltmesinin kalitesi değişken, düzeltenler öğretmen değil |
| 16 | Actual Fluency incelemesi | https://actualfluency.com/busuu-review | diyalog boşluk doldurma, kültür notları |

Yardım merkezi sayfaları doğrudan açılamadı (403); oradan gelen bilgiler arama özetlerinden. Seviye sonu sertifikası ve sınav düzeni ikinci el.

## Çekirdek döngü

CEFR seviyelerine göre dizilmiş 5 dakikalık tek konulu dersler (kelime → diyalog → pratik → mini sınav), kişisel çalışma planına göre her gün; yazdığın ve konuştuğun cevaplar topluluktan ya da yapay zekâdan geri bildirim alır.

## Ekranlar

| ID | ekran | nasıl ulaşılır | amaç | ana bileşenler | görülen durumlar |
| --- | --- | --- | --- | --- | --- |
| S01 | Seviye tespit sınavı | ilk açılış | başlangıç seviyesini belirlemek | uyarlamalı sorular, sonuç seviyesi | atlandı, tamamlandı |
| S02 | Çalışma planı sihirbazı | ilk açılış / ayarlar | amaç, hedef seviye, gün-saat, günlük dakika | adım adım seçimler, tahmini bitiş tarihi | yeni, düzenleniyor, silindi |
| S03 | Ana sayfa / kurs haritası | açılış | sıradaki derse geçmek | seviye (A1…B2) → bölüm → ders listesi, plan ilerlemesi | kilitli, devam eden, biten |
| S04 | Ders | S03 | 3–7 dk tek konu | kelime kartları, diyalog (boşluk doldurma), dilbilgisi ipucu, kültür notu, alıştırmalar, mini quiz | doğru, yanlış, ipucu |
| S05 | Yazma/konuşma alıştırması | ders sonu | kendi cümleni üretmek | yazı alanı veya ses kaydı, "düzeltmeye gönder" | gönderildi, düzeltme bekliyor, düzeltildi |
| S06 | Topluluk / düzeltme yap | menü | başkalarının cevabını düzeltmek | cevap, düzeltme editörü, 1–5 yıldız, yorum | |
| S07 | Gelen düzeltmeler | bildirim / profil | düzeltmeyi okumak | işaretli metin, yorum, yıldız | yok, yeni |
| S08 | Tekrar (Smart Review) | menü | kelime ve dilbilgisi tekrarı | güç göstergesi, zayıf/orta/güçlü filtre, tekrar başlat | boş, dolu |
| S09 | Kontrol noktası sınavı | bölüm/seviye sonu | ilerlemeyi ölçmek | karışık sorular, puan | geçti, kaldı |
| S10 | YZ konuşma (Conversations / Speaking Practice) | ders ya da menü | senaryolu diyalog, telaffuz | sohbet, mikrofon, kelime bazlı işaretleme | |
| S11 | Profil / ilerleme | menü | seri, plan, sertifikalar | seri, haftalık hedef, sertifika listesi | |

## Akışlar

```
F01 İlk kurulum
    S01 seviye tespiti -> S02 plan (amaç, seviye, günler, dakika) -> tahmini bitiş tarihi -> S03
    kenar: tespiti atla; planı sonradan değiştir (eskisi silinir)

F02 Günlük ders
    S03 -> S04 (kelime -> diyalog -> pratik -> quiz) -> S05 isteğe bağlı -> S03 plan ilerlemesi
    mutlu yol: ~3-7 dk
    kenar: yarıda bırakma; yanlış cevaplar tekrar kuyruğuna

F03 Topluluk düzeltmesi
    S05 yaz/konuş -> otomatik topluluğa veya arkadaşa -> (dakikalar/saatler) -> bildirim -> S07
    karşı taraf: S06 düzelt + yıldız + kısa yorum
    kenar: yanlış düzeltme; hiç gelmeyen düzeltme

F04 Tekrar
    S08 -> zayıf öğeleri seç -> karışık alıştırma -> güç göstergesi güncellenir

F05 Seviye sonu
    S09 sınav -> geçince sertifika (Premium)
```

## Bileşenler

| bileşen | çeşitleri | durumlar | kullanıldığı yer |
| --- | --- | --- | --- |
| Plan sihirbazı adımı | tek seçim, gün seçici, dakika kaydırıcı | seçili, eksik | S02 |
| Diyalog boşluk doldurma | yazarak, seçerek | boş, doğru, yanlış | S04 |
| İpucu kartı | dilbilgisi, kültür | kapalı, açık | S04 |
| Düzeltme editörü | yazı | orijinal / düzeltilmiş fark | S06, S07 |
| Yıldız puanı | 1–5 | | S06, S07 |
| Güç göstergesi | kelime, dilbilgisi | zayıf, orta, güçlü | S08 |
| Plan ilerleme çubuğu | haftalık | hedefte, geride | S03, S11 |

## Çıkarılan veri modeli

```
Course       language, level (A1..B2), units[] -> lessons[]           güven: yüksek (kaynak 2)
Lesson       id, topic, parts[vocab, dialogue, practice, quiz], minutes güven: orta (kaynak 3, 14)
StudyPlan    user_id, reason, target_level, days[], time, minutes_per_day (5-30), est_finish_date
             kanıt: kaynak 4, 12   güven: yüksek; hesap başına tek plan
ReviewItem   user_id, kind (vocab | grammar), item_id, strength (weak|medium|strong), last_seen
             kanıt: kaynak 2, 5, 11   güven: orta (strength adlandırması tahmin)
Exercise     user_id, lesson_id, kind (written | spoken), content, sent_to (community | friend_ids)
Correction   exercise_id, corrector_id, corrected_text, comment, stars (1-5)
             kanıt: kaynak 6, 7, 8   güven: yüksek
Certificate  user_id, level, issued_at          güven: düşük
```

İlişkiler: Course 1-n Lesson, User 1-1 StudyPlan, User 1-n ReviewItem, User 1-n Exercise, Exercise 1-n Correction.

## PARLO ile karşılaştırma (uyarlama için)

| Busuu mekaniği | PARLO'da bugün | uyarlama önerisi |
| --- | --- | --- |
| Çalışma planı: günler, dakika, tahmini bitiş tarihi | Sabit: günde 15 dk, 30 gün; gün seçimi ve bitiş tarihi yok | Plan ekranı: haftada kaç gün + saat; "Gün N/30 → bitiş: 12 Kasım" |
| Seçilen saatte hatırlatma | Yok | Sunucu ister (PWA push); önce takvime ekle (.ics) ile ucuz çözüm |
| Ders: kelime → diyalog → pratik → quiz | Gün: tekrar → yeni kalıp → konuşma → hata düzeltme | Zaten benzer; PARLO'nun sohbeti daha güçlü (dallanan senaryo) |
| Diyalog boşluk doldurma | Yok (sohbet serbest yazma) | Tekrar yoluna 5. tür: diyalogda eksik kelimeyi yaz |
| Dilbilgisi ipucu + kültür notu | Kalıp notu (LEGO) + kültür kartı | Var |
| Smart Review: zayıf/orta/güçlü | SRS + Tekrar yolu; güç gösterilmiyor | Durakta ve kartta güç rengi |
| Topluluk düzeltmesi (yıldız + yorum) | Yok | "Arkadaşına gönder": yazdığın cevabı lig arkadaşın düzeltir; Supabase gerekir |
| YZ senaryolu konuşma, anlık geri bildirim | Kural tabanlı senaryo + öğretmen paneli | Var (yapay zekâsız); YZ koç yol haritasında |
| YZ telaffuz puanı, kelime bazında | Ses kapalı | Kapsam dışı (şimdilik) |
| Kontrol noktası sınavı | 7/14/21/30. gün "kontrol" metni var, sınav yok | Gerçek kontrol sınavı (karışık 20 soru, geçme notu) |
| Seviye tespit sınavı | Yok (herkes Gün 1) | 10 soruluk tespit → bildiği günleri atlatır |
| Sertifika | Yok | Kendi "30 gün tamam" belgesi (resmî değil) |

## Özellik matrisi

`features-busuu.csv`'ye bak. `clone` sütunu = PARLO'da bugün var mı. Must: 6, should: 6, could: 5, skip: 5. PARLO bugün: %56 (6 zorunludan 4'ü tam).

## Kapsam dışı (alınamaz ya da alınmamalı)

- Busuu'nun ders metinleri, diyalogları, videoları, görselleri, marka ve renkleri
- Resmî (McGraw-Hill) sertifika: üçüncü taraf ortaklığı
- 120 milyonluk topluluk: ağın kendisi kopyalanamaz; PARLO'da sadece kendi arkadaş ligi olur
- YZ telaffuz puanlama (ses kapalı) ve sesli düzeltme
- 14 dil, CEFR B1–B2 içeriği (PARLO tek dil, A1-A2 odaklı)
- Ücretli sürüm kilitleri

## Boyut

Ekran 11, akış 5, varlık 7. PARLO'ya uyarlanacak kısım: çalışma planı + bitiş tarihi, kontrol sınavı, diyalog boşluk doldurma, güç göstergesi, seviye tespiti, arkadaş düzeltmesi. Zor kısımlar: arkadaş düzeltmesi (sunucu, moderasyon, bildirim), hatırlatma bildirimi (sunucu), seviye tespitinin program ilerlemesiyle tutarlı olması. Boyut: **S** (plan, sınav, boşluk doldurma, güç göstergesi); arkadaş düzeltmesi ve bildirimle **M**.
