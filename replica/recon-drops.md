# İnceleme haritası: Drops (iOS / Android)

Kapsam: Drops'un çekirdek döngüsü — süreli kısa kelime oturumu, kelimenin tanıtılması ve mini oyunlar, kelime başına ustalık ve tekrar sistemi, seri ve motivasyon.
Kimin için: PARLO (İtalya'da yaşayan Türkler için konuşma odaklı İtalyanca). Ayrı bir klon değil; Drops'un işe yarayan **mekaniklerini** PARLO'ya uyarlamak.
Tarih: 2026-10-18
Yöntem: sadece herkese açık kaynaklar (kullanıcının Drops hesabı yok). Drops'un metni, illüstrasyonları, logosu ve renkleri alınmaz; sadece "ne yapıyor, nasıl akıyor" incelenir.

## Kaynaklar

| # | kaynak | URL | not |
| --- | --- | --- | --- |
| 1 | resmî site | https://languagedrops.com/ | "günde 5 dakika", aralıklı tekrar + bağlam + görsel ilişkilendirme, Premium: sınırsız süre, tüm oyun modları, çevrimdışı |
| 2 | App Store sayfası | https://apps.apple.com/us/app/drops-language-learning-games/id939540371 | her kelimeye özel illüstrasyon, 3.000+ kelime/ifade, ~4,7 puan, 7 gün deneme |
| 3 | Kahoot blog (sahip şirket) | https://kahoot.com/blog/2021/04/30/drops-language-learning-app/ | tekrar bölümü (Review Dojo) 50 kelimeden sonra açılır; seride "2 gün kuralı" |
| 4 | Kahoot ürün sayfası | https://kahoot.com/home/learning-apps/drops/ | quiz modu, konu ustalığı/meydan okuma/seri için rozetler |
| 5 | StoryLearning incelemesi | https://storylearning.com/blog/drops-review | 5 dk zamanlayıcı, ücretsiz: 10 saatte 5 dk; kelime **10 başarılı etkileşimde** ustalaşmış sayılır; Review Dojo 14 kelimede açılır (yardım merkezine atıfla) — (3) ile çelişir |
| 6 | FluentU incelemesi | https://www.fluentu.com/blog/reviews/drops-language-app-review/ | mini bulmaca, metin-resim eşleştirme; bilinen kelimeyi atma |
| 7 | All Language Resources | https://www.alllanguageresources.com/language-drops-app/ | yukarı kaydır = bildiğin kelimeyi çıkar, aşağı = öğren; resimler bazen birbirine benziyor |
| 8 | The Language Closet | https://thelanguagecloset.com/2022/02/05/%f0%9f%91%8f%f0%9f%8f%bb-method-%f0%9f%91%8f%f0%9f%8f%bb-review-drops/ | yöntem incelemesi |
| 9 | Guest Hollow | https://guesthollow.com/?p=62233 | kelime koleksiyonu (Premium), seri hedefinde +5 dk bonus |
| 10 | Common Sense Education | https://www.commonsense.org/education/reviews/drops-fun-language-learning | eşleştirme, balon patlatma, bulmaca benzeri kelime haritası, iki resimden doğruyu seçme |
| — | yardım merkezi | https://languagedrops.zendesk.com/hc/en-us | erişilemedi (403); yardım merkezinden gelen bilgiler (5) üzerinden, ikinci el |

Kaynaklar arasında çelişen bilgiler "emin değil" diye işaretlendi. Hareket yönleri (yukarı/aşağı kaydırma) kaynaklarda tutarsız.

## Çekirdek döngü

Her gün 5 dakikalık süreli bir oturumda, resimle eşleşen yeni kelimeleri hızlı mini oyunlarla öğrenmek; zayıf kelimeler aralıklı tekrarla geri gelir, seri seni her gün geri getirir.

## Ekranlar

| ID | ekran | nasıl ulaşılır | amaç | ana bileşenler | görülen durumlar |
| --- | --- | --- | --- | --- | --- |
| S01 | Ana ekran / konu seçimi | uygulama açılışı | sıradaki konuya başlamak | konu kartları (paketler içinde), seri göstergesi, oturum başlat | kilitli konu, devam eden, tamamlanan |
| S02 | Oturum (zamanlayıcılı) | S01'den konu seç | 5 dk öğrenme | üstte geri sayım çubuğu, kelime kartı, oyun alanı | süre bitti, duraklatıldı |
| S03 | Yeni kelime tanıtımı | S02 içinde | kelimeyi resim + ses ile tanıtmak | illüstrasyon, kelime, telaffuz, "öğren / zaten biliyorum" hareketi | yeni kelime, atlandı |
| S04 | Mini oyunlar | S02 içinde | tanıtılan kelimeyi pekiştirmek | iki resimden seç, resim-kelime eşleştir (çoklu), harf dizerek yaz, balon patlatma, bulmaca benzeri kelime haritası, dinleyip resim seçme | doğru, yanlış (kelime tekrar gelir) |
| S05 | Oturum sonu | süre dolunca | ilerlemeyi göstermek | öğrenilen kelimeler, seri, sonraki oturuma kalan süre (ücretsiz) | ücretsiz: 10 saat bekle; Premium: devam et |
| S06 | Tekrar bölümü (Review Dojo) | eşik kadar kelime öğrenilince | zayıf kelimeleri aralıklı tekrar | karışık oyunlar, zayıf kelime işaretleri | kilitli (eşik altında), boş, dolu |
| S07 | Kelime koleksiyonu | menü | öğrenilen tüm kelimeler | liste, telaffuz, ustalık göstergesi, favori | boş, dolu |
| S08 | Quiz modu | menü | bağlam içinde sınama | karışık soru tipleri, oturumda en fazla 7 soru | <5 soru varsa kapalı |
| S09 | Profil / istatistik | menü | seri, öğrenilen kelime sayısı, rozetler | seri takvimi, sayaçlar, rozetler | |
| S10 | Ayarlar | profil | oturum süresi (Premium), bildirimler, yazı alıştırması, ana dil desteği | anahtarlar | |

## Akışlar

```
F01 Günlük 5 dakikalık oturum
    S01 -> S02 (zamanlayıcı başlar) -> [S03 yeni kelime -> S04 1-3 mini oyun] x N -> S05
    mutlu yol tıklama: 1 (başlat), sonrası oyun içi dokunuşlar
    kenar: süre bir kelimenin ortasında biter; uygulama arka plana atılır; bilinen kelime atlanır

F02 Bilinen kelimeyi atlamak
    S03 -> "zaten biliyorum" hareketi -> sonraki yeni kelime
    kenar: yanlışlıkla atlama (geri alma var mı? belirsiz)

F03 Zayıf kelimeleri tekrar
    S01 -> S06 -> karışık oyunlar -> sonuç
    kenar: eşik altında kilitli; tekrar edilecek kelime yok

F04 Seriyi korumak
    günde bir oturum -> seri +1; bir gün kaçarsa ertesi gün oynayınca seri devam eder ("2 gün kuralı")
    kenar: iki gün üst üste kaçarsa sıfırlanır; saat dilimi değişimi

F05 Konuyu bitirmek
    S01 konu -> birkaç oturum -> konu ustalığı -> rozet -> sonraki konu açılır
```

## Bileşenler

| bileşen | çeşitleri | durumlar | kullanıldığı yer |
| --- | --- | --- | --- |
| Geri sayım çubuğu | oturum | akıyor, duraklatıldı, bitti | S02 |
| Kelime kartı | tanıtım, soru | yeni, atlandı, öğrenildi | S03, S04 |
| Kaydırma hareketi | öğren / atla | sürükleniyor, bırakıldı | S03 |
| Seçenek kutusu | resim, kelime | normal, doğru, yanlış | S04 |
| Eşleştirme ızgarası | 2 sütun | seçili, eşleşti, hatalı | S04 |
| Harf dizme | harf kutucukları | boş, dolu, doğru, yanlış | S04 |
| Ustalık göstergesi | kelime başına | 0-10 etkileşim | S06, S07 |
| Seri rozeti | gün sayısı | aktif, tolerans günü, sıfırlandı | S01, S05, S09 |

## Çıkarılan veri modeli

```
Word        id, topic_id, text, translation, illustration, audio
            kanıt: S03, App Store "her kelimeye özel illüstrasyon"
            güven: yüksek
Topic       id, pack_id, title, word_ids, order, locked
            kanıt: kaynak 5 (konular paketler içinde, ücretsizde tek tek açılır)
            güven: yüksek
WordProgress  user_id, word_id, successes (0-10), mastered, last_seen, due_at, skipped
            kanıt: kaynak 5 ("10 başarılı etkileşim"), kaynak 3 (aralıklı tekrar)
            güven: orta (due_at alanı tahmin)
Session     user_id, started_at, duration_s, words_new, words_reviewed
            kanıt: S02/S05, 5 dk zamanlayıcı
            güven: orta
Streak      user_id, current, best, last_active_day, grace_used
            kanıt: kaynak 3 ("2 gün kuralı")
            güven: orta (grace_used tahmin)
Achievement user_id, kind (topic | challenge | streak), earned_at
            kanıt: kaynak 4
            güven: düşük
```

İlişkiler: Pack 1-n Topic, Topic 1-n Word, User 1-n WordProgress, User 1-n Session, User 1-1 Streak.

## PARLO ile karşılaştırma (uyarlama için)

| Drops mekaniği | PARLO'da bugün | uyarlama önerisi |
| --- | --- | --- |
| 5 dk süreli oturum | Tekrar yolunda 30 soru, süre yok; program günü 15 dk (4 adım) | Tekrar duraklarına isteğe bağlı geri sayım ("5 dk modu") |
| Kelime + illüstrasyon | Sadece yazı (cümle odaklı) | 2. hafta kelimelerine emoji/basit ikon; görselsiz kalan cümleler yazıyla devam |
| "Zaten biliyorum" ile atlama | Yok | Yeni kalıp adımında "Biliyorum" → kart kutu 2'den başlar |
| Kelime başına 10 başarıyla ustalık | Leitner kutusu (0-5) + Tekrar yolunda en iyi skor | Cümle başına ustalık sayacı, yolda durak üstünde % gösterimi |
| Review Dojo (zayıfları karışık tekrar) | Hızlı tekrar + SRS, programın 1. adımı | Zaten var; "zayıf cümleler" turunu ayrıca açmak |
| Seri, 2 gün kuralı | Seri var ama bir gün kaçınca sıfırlanıyor; Tekrar yolu oturumları seriye sayılmıyor | Bir günlük tolerans; tüm adımlar ve Tekrar yolu seriye saysın |
| Seri hedefinde bonus | Yok (XP + lig var) | Seri 7/14/30'da XP bonusu |
| Rozetler | Yok | Hafta kontrolü (7/14/21/30) geçince rozet |
| Hatırlatma bildirimi | Yok | Akşam hatırlatması (PWA push, sunucu gerekir) |

## Özellik matrisi

`features-drops.csv`'ye bak. `clone` sütunu = **PARLO'da bugün var mı**. Must: 6, should: 7, could: 6, skip: 6. PARLO bugün: %50 (6 zorunludan 3ü tam).

## Kapsam dışı (alınamaz ya da alınmamalı)

- Drops'un illüstrasyonları, sesleri, kelime listeleri, metinleri, logosu ve renkleri (onlara ait)
- Ücretsiz sürümdeki "10 saatte 5 dakika" kilidi (para kazanma kurgusu; PARLO'nun amacına ters)
- 55+ dil (PARLO tek dil)
- Ses ve dinleme oyunları, sesli mod (PARLO'da ses şimdilik kapalı)
- Yazı sistemi çizme (İtalyanca Latin alfabesi)
- Kelime koleksiyonu (kullanıcı "Cümlelerim"i bilerek kaldırttı)

## Boyut

Ekran 10, akış 5, varlık 6. PARLO'ya uyarlanacak kısım: seri toleransı, "biliyorum" atlama, ustalık sayacı, süreli mod, seri bonusu/rozet, kelime görselleri. Zor kısımlar: görsel içerik üretimi (100 kelime için tutarlı ikon), bildirim için sunucu, ustalık sayacının mevcut Leitner sistemiyle çakışmaması. Boyut: **S** (bir hafta sonu) — bildirimler hariç; bildirimler eklenirse **M**.
