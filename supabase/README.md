# Çevrim içi lig kurulumu (Supabase, ücretsiz)

Farklı telefonlardaki oyuncuların aynı ligde yarışması için puanlar Supabase'de tutulur.
Kurulum bir kez yapılır, yaklaşık 5 dakika sürer.

1. https://supabase.com adresinde ücretsiz hesap aç → **New project**.
   Ad: `parlo`, bölge: **Frankfurt (eu-central-1)**, bir veritabanı şifresi belirle (bir yere not et).
2. Proje açılınca soldan **SQL Editor** → **New query**.
   `supabase/schema.sql` dosyasının tamamını yapıştır → **Run**. "Success" görmelisin.
3. Soldan **Project Settings → API** (ya da **Data API**):
   - **Project URL** (ör. `https://abcd1234.supabase.co`)
   - **anon public** anahtarı (uzun bir metin, `eyJ…` ile başlar)

   Bu iki değer herkese açıktır; uygulamanın içine yazılması güvenlidir. `service_role` anahtarını **asla** paylaşma.
4. Bu iki değeri `src/config.js` içindeki `DEFAULT_URL` ve `DEFAULT_ANON_KEY` alanlarına yaz
   (ya da GitHub → Settings → Secrets and variables → Actions → **Variables** sekmesine
   `SUPABASE_URL` ve `SUPABASE_ANON_KEY` olarak ekle) ve `main`'e gönder.

## Nasıl çalışır
- Her telefon, ligi kurarken ya da katılırken rastgele bir oyuncu kimliği ve gizli anahtar üretir (sadece o telefonda saklanır).
- Puanlar `submit_score` fonksiyonuyla gönderilir; gizli anahtarı bilmeyen kimse başkasının puanını değiştiremez.
- Tabloya doğrudan erişim kapalıdır; lig listesi `get_league` ile, yalnızca lig kodunu bilenlere döner.
- Puanlar telefonda hesaplanır ve güvene dayalıdır (aile ve arkadaş ligi için tasarlandı).
- `tests/schema.test.js` bu SQL'i gerçek bir Postgres'te (PGlite) çalıştırarak test eder.
