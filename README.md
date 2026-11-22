# Şark Köşesi

Türkiye'nin 81 ili ve Tüm Türkiye için kayıtsız, takma adlı, konulu **şark köşelerinde** anlık sohbet.
Her köşede 10 minder var; gelen kişi bir mindere oturur, yanındakilerle sohbet eder, istediğine çay ikram eder.
Her şehrin köşesi farklıdır: pencereden şehrin manzarası, kilimin rengi, sinideki ikram, takma adlar ve fon müziği.

## Neler hazır (Faz 1)

- **Onay ekranı:** 18 yaş beyanı, Kullanım Koşulları, KVKK Aydınlatma Metni (zorunlu, işaretsiz) ve isteğe bağlı analitik çerez. Onay veritabanına sürümüyle kaydedilir; onaysız sohbete bağlanılamaz (imzalı oturum çerezi).
- **Şehir seçimi:** 81 il + Tüm Türkiye, plaka/isim araması, bölge filtresi, canlı çevrimiçi sayıları.
- **Köşeler:** Her şehirde hazır köşeler (6 ilde elle yazılmış konular, diğerlerinde il bilgisinden üretilen konular) + kullanıcıların açtığı köşeler. 10 kişi dolunca aynı konuda otomatik "2. köşe". Kullanıcı köşeleri 24 saatte veya 3 saat sessizlikte kapanır.
- **Rastgele köşe:** Boş minderi olan ve içinde en az 2 kişi bulunan köşeleri tercih eder.
- **Sahne:** Minderler, karakterler, konuşma balonları, "yazıyor..." göstergesi, yer değiştirme, çay ikramı animasyonu.
- **Takma adlar:** Şehrin yemeklerinden, yerlerinden ve simgelerinden; köşede benzersiz, köşeler arasında farklı (takip edilemez). Köşeye 30 dk içinde dönen aynı adı geri alır.
- **Fon müziği:** Tarayıcıda üretilir (telif yok). Saz benzeri tel sesi, şehre göre makam (Rast, Uşşak, Hüseyni, Hicaz, Kürdi, Nihavend) ve usul (Sofyan, Düyek, Aksak, Karadeniz 7/8, Semai), def, kafe uğultusu, çay kaşığı şıngırtısı; şehre göre deniz, martı, rüzgâr, yağmur. Her köşenin kendi ezgisi var. Varsayılan kapalı.
- **Filtre (sunucuda):** Türkçe normalizasyon (ş/s, 1/i, aaaa, s.i.k), küfür kökleri + istisnalar, telefon, TC kimlik no (algoritmayla), IBAN, e-posta, link ve hesap paylaşımı, bahis spamı. Reşit olmama ve tehdit kalıpları otomatik, öncelikli bildirime dönüşür. 5 dakikada 5 ihlal → 10 dk susturma.
- **Bildirim:** Mesaj ve köşe bildirimi, 8 sebep. Bildirimde son 40 mesaj kesit olarak kaydedilir. 3 farklı kişi → mesaj gizlenir; 5 kişi → kullanıcı köşesi kapanır; 24 saatte 3 gizlenen mesaj → 1 saat, 5 → 24 saat ban.
- **Yasal kayıtlar:** 5651 trafik logları (IP AES-256-GCM ile şifreli), onay kayıtları, bildirimler, banlar, içerik kaldırma talepleri. Saklama süresi dolanlar günlük silinir.
- **Yasal sayfalar (TASLAK):** Kullanım Koşulları, Topluluk Kuralları, Aydınlatma Metni, Çerez Politikası, Künye, İçerik Kaldırma Talebi formu.

Henüz yok (Faz 2): yönetim paneli, birden fazla sunucuya ölçekleme (Redis), bot koruması (Turnstile), 81 ilin tamamı için özel manzara (şu an 6 il özel, diğerleri bölge teması).

## Proje yapısı

```
apps/
  web/          Next.js 16: sayfalar, onay akışı, köşe arayüzü, fon müziği, yasal sayfalar
  realtime/     Node.js + Socket.IO: köşeler, minderler, mesajlar, filtre, bildirim, ban, trafik logu
packages/
  shared/       81 il, takma adlar, filtre, temalar, sahne çizimi, olay tipleri, oturum token'ı
infra/
  migrations/   PostgreSQL şeması
  docker-compose.yml
docs/           Analiz ve plan belgeleri
prototype/      Tek dosyalık tıklanabilir taslak
```

## Çalıştırma (geliştirme)

Adım adım, kod bilgisi gerektirmeyen rehber: **[docs/KURULUM.md](docs/KURULUM.md)**

Kısaca (Node.js 20+ gerekir):

```bash
npm install
cp .env.example .env            # Windows: copy .env.example .env
npm run dev                     # web: http://localhost:3000, gerçek zamanlı: http://localhost:4000
```

Varsayılan olarak veritabanı gerekmez (kayıtlar geçici olarak bellekte tutulur). Kalıcı kayıt için:
`docker compose -f infra/docker-compose.yml up -d`, `.env` içinde `DATABASE_URL` satırını aç, `npm run db:migrate`.

Rastgele anahtar üretmek için: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## Testler

```bash
npm test          # filtre, iller, takma adlar, oturum, köşe mantığı, soket entegrasyonu
npm run typecheck
```

## Üretim notları

- Web ve gerçek zamanlı sunucu aynı ana alan adının alt alan adlarında çalışmalı (ör. `sarkkosesi.com` ve `rt.sarkkosesi.com`), `COOKIE_DOMAIN=.sarkkosesi.com` ayarlanmalı.
- Ters vekil (nginx) arkasında `TRUST_PROXY=1` ayarlanmalı, aksi hâlde gerçek IP adresleri loglanamaz.
- `DATABASE_URL` üretimde zorunludur.
- Yasal metinlerdeki köşeli parantezli alanlar doldurulmalı ve metinler avukata onaylatılmalı (bkz. `docs/YASAL_KONTROL_LISTESI.md`).

## Belgeler

- [Kurulum Rehberi](docs/KURULUM.md): kendi bilgisayarında çalıştırma
- [Nihai Ürün Planı](docs/NIHAI_PLAN.md): şehir bazlı, konulu şark köşeleri
- [Proje Analizi](docs/ANALIZ.md): KVKK ve 5651, mimari, takma ad, filtre, bildirim ayrıntıları
- [Yasal Uyum Kontrol Listesi](docs/YASAL_KONTROL_LISTESI.md): KVKK, 5651, süreçler ve avukata sorulacak sorular
- [Rakip Analizi](docs/RAKIP_ANALIZI.md): "önce oyun, sonra sohbet" modeli ve oyun fikirleri
- [Şark Köşesi Prototipi](prototype/sark-kosesi.html): tarayıcıda açılabilen tıklanabilir taslak
