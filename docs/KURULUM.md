# Bilgisayarında Çalıştırma Rehberi

Bu rehber, siteyi kendi bilgisayarında (Windows veya Mac) açıp denemen içindir. Kod bilgisi gerekmez; komutları kopyalayıp yapıştırman yeterli.

## 1. Bir kere kurulacak programlar

| Program | Ne işe yarar | Nereden |
|---|---|---|
| **Node.js** (LTS sürümü, 20 veya üstü) | Siteyi çalıştıran motor | nodejs.org → "LTS" yazan büyük butondan indir, varsayılan ayarlarla kur |
| **Git** | Kodu GitHub'dan indirmek için | git-scm.com → Download (Mac'te genelde zaten yüklüdür) |

Kurulduğunu kontrol etmek için bir **terminal** aç:
- **Windows:** Başlat menüsüne `PowerShell` yaz, aç.
- **Mac:** `Cmd + Boşluk` → `Terminal` yaz, aç.

Şunları yaz, her biri bir sürüm numarası göstermeli:

```
node -v
git --version
```

## 2. Kodu indir

Terminalde, kodu koymak istediğin klasöre geç (örneğin Masaüstü) ve indir:

```
cd Desktop
git clone https://github.com/ymsalih/eslesuygulamasi.git
cd eslesuygulamasi
git checkout claude/turkey-city-chat-platform-3om5tp
```

> Depo gizliyse GitHub kullanıcı adın ve şifren (veya erişim anahtarın) sorulur.
> Alternatif: GitHub'da depoyu aç, dal (branch) olarak `claude/turkey-city-chat-platform-3om5tp` seç, **Code → Download ZIP** ile indir ve klasörü aç.

## 3. Gerekli paketleri yükle (bir kere, 1–3 dakika sürer)

```
npm install
```

## 4. Ayar dosyası (isteğe bağlı)

Bilgisayarında denerken **bu adımı atlayabilirsin**. `.env` dosyası yoksa site kendi deneme anahtarıyla çalışır
(terminalde "yerel deneme anahtarı kullanılıyor" yazar, bu normaldir).

Ayarları değiştirmek istersen:
- **Windows (PowerShell):** `copy .env.example .env`
- **Mac:** `cp .env.example .env`

> Dosyanın adı tam olarak `.env` olmalı. Not defteriyle oluşturursan `.env.txt` olarak kaydedilebilir; site bunu fark edip terminalde uyarır.

## 5. Siteyi başlat

```
npm run dev
```

Ekranda `[sunucu]` ve `[web]` yazıları akacak. `Ready` veya `Gerçek zamanlı sunucu: http://localhost:4000` yazısını görünce tarayıcıda şu adresi aç:

**http://localhost:3000**

Durdurmak için terminalde `Ctrl + C`.

## 6. İki kişiyle sohbeti denemek

Aynı tarayıcıda iki sekme aynı kişi sayılır. İki farklı kişi gibi denemek için:
1. Normal pencerede siteyi aç, onay ver, bir şehir ve köşe seç.
2. **Gizli pencere** aç (Chrome: `Ctrl + Shift + N`, Mac: `Cmd + Shift + N`), aynı adrese git, onay ver, aynı şehirde aynı köşeye otur.
3. Birinden yaz, diğerinde konuşma balonunu gör. Adına dokunup çay ikram et 🍵

İpuçları:
- Güvenlik gereği **yeni gelenler ilk 5 dakika köşe açamaz**. Bu süre boyunca hazır köşelere oturabilirsin.
- **Fon müziği** köşenin altındaki "Fon müziğini aç" butonuyla başlar.
- Telefondan denemek için: telefon ve bilgisayar aynı Wi-Fi'de olmalı. Bu, ek ayar gerektirir (bilgisayarın yerel IP adresi). Kolay yol: tarayıcıda `F12` → cihaz simgesiyle mobil görünümü aç.

## 7. (İsteğe bağlı) Gerçek veritabanıyla çalıştırmak

Varsayılan olarak onay kayıtları, bildirimler ve trafik logları **geçici olarak bellekte** tutulur ve site kapanınca silinir. Canlı sitedeki gibi kalıcı kayıt denemek istersen:

1. **Docker Desktop**'ı kur (docker.com) ve aç.
2. Terminalde:
   ```
   docker compose -f infra/docker-compose.yml up -d
   ```
3. `.env` dosyasını bir metin düzenleyiciyle aç, `# DATABASE_URL=...` satırının başındaki `#` işaretini sil, kaydet.
4. Tabloları oluştur ve başlat:
   ```
   npm run db:migrate
   npm run dev
   ```

## 8. Yönetim paneli (moderatörler için)

Panelde kullanıcı bildirimlerini, banları, içerik kaldırma taleplerini ve yasaklı kelimeleri yönetirsin.
Panel kayıtları veritabanından okuduğu için **önce 7. adımı (veritabanı) yapmış olmalısın**. Veritabanı yoksa panel
"DATABASE_URL gerekli" uyarısı gösterir.

### Bilgisayarında denemek

1. `.env` dosyası `.env.example`'dan kopyalandıysa yönetici ayarları zaten içindedir (`ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `ADMIN_SECRET`).
   Eski bir `.env` kullanıyorsan bu üç satırı `.env.example`'dan kopyala.
2. `npm run db:migrate` çalıştır (panelin yeni tablosu, denetim günlüğü, oluşturulur), sonra `npm run dev`.
3. Tarayıcıda **http://localhost:3000/yonetim** adresini aç.
4. Giriş bilgileri (sadece bilgisayarda denemek için):
   - Kullanıcı adı: `yonetici`
   - Parola: `yerel-deneme-parolasi`

Panelde neler var:
| Bölüm | Ne yapılır |
|---|---|
| **Özet** | Açık bildirim, geciken kaldırma talebi ve aktif ban sayıları |
| **Bildirimler** | Önce yüksek öncelikli olanlar (reşit olmama, tehdit), sonra eskiden yeniye. Her bildirimde o anki son 40 mesaj görünür. Kapat, mesajı kaldır, köşeyi kapat, kullanıcıyı banla, yasal saklamaya al |
| **Kaldırma talepleri** | 5651 md. 9 başvuruları. Her talebin 24 saat sayacı var, geciken kırmızı görünür. Sonuç ve not yazarak kapatılır |
| **Banlar** | Aktif banlar, elle ban ekleme, ban kaldırma |
| **Yasaklı kelimeler** | Filtreye kelime ekle/sil. Sohbet sunucusu hemen uygular |
| **Denetim günlüğü** | Kim, ne zaman, ne yaptı. "Haberdar olunca kaldırdık" ispatıdır, panelden silinemez |

Mesajı kaldırma, köşeyi kapatma ve banlanan kişiyi köşeden çıkarma **canlı** yapılır: web sitesi sohbet sunucusuna
gizli bir anahtarla (`ADMIN_SECRET`) haber verir. Sohbet sunucusu kapalıysa karar yine kayda geçer, panel bunu uyarıyla söyler.

### Canlı sitede (mutlaka yap)

Örnek parola ve örnek anahtar canlı sitede **çalışmaz**. Kendi parolanı üret:

```
npm run yonetici:parola
```

Parolanı iki kez yazarsın (ekranda görünmez, en az 12 karakter). Çıkan iki satırı (`ADMIN_PASSWORD_HASH=...` ve `ADMIN_SECRET=...`)
sunucudaki `.env` dosyasına, eski satırların yerine yapıştır. İstersen `ADMIN_USERNAME`'i de değiştir. Sonra siteyi yeniden başlat.

- Parolanın kendisi hiçbir yere kaydedilmez, sadece özeti (hash) saklanır. Parolayı unutursan aynı komutla yenisini üret.
- `ADMIN_SECRET` web sitesi ve sohbet sunucusunda **aynı** olmalı (ikisi aynı `.env`'i okuyorsa sorun yok).
- Web sitesi sohbet sunucusuna farklı bir iç adresten ulaşıyorsa `.env`'e `REALTIME_INTERNAL_URL=http://...` ekle.
- Yönetici girişi 8 saat geçerlidir. Aynı adresten 15 dakikada 5 yanlış parola girilirse giriş 15 dakika kilitlenir.
- Yönetici çerezi kullanıcıların sohbet çerezinden ayrıdır ve sadece `/yonetim` sayfalarına gönderilir.

### Henüz yapılmadı (yapılacaklar)

- [ ] **İki aşamalı doğrulama (2FA):** Şimdilik giriş sadece kullanıcı adı + parola ile. Canlıya çıkmadan önce eklenmeli (KVKK md. 12, yönetici 2FA).
- [ ] **Birden fazla moderatör hesabı ve roller:** Şimdilik tek yönetici hesabı var; denetim günlüğünde hepsi bu adla görünür.
- [ ] Giriş hız sınırı tek sunucu belleğinde tutulur; birden fazla web sunucusuna geçince Redis'e taşınmalı.
- [ ] Kapatılan bir köşe başlığını "incelemede"den onaylama (konu inceleme kuyruğu).

## Sık karşılaşılan sorunlar

| Sorun | Çözüm |
|---|---|
| `node` veya `npm` tanınmıyor | Node.js'i kurduktan sonra terminali kapatıp yeniden aç |
| `port 3000 already in use` | Başka bir program o portu kullanıyor. Açık kalan eski terminali kapat veya bilgisayarı yeniden başlat |
| Köşelere girince "Sohbet sunucusuna bağlanılamadı" | Terminalde `[sunucu]` satırlarında hata var mı bak. Sohbet sunucusu açılmamış olabilir |
| "Sunucu yapılandırması eksik" | Kodun eski sürümü. `git pull` ile güncelle, `npm run dev`'i durdurup (`Ctrl + C`) yeniden başlat |
| Ana sayfaya geri atıyor | Onay çerezi yok veya silinmiş; onay ekranını tekrar doldur |
| `DATABASE_URL` hatası | Docker çalışmıyorsa `.env` içindeki `DATABASE_URL` satırının başına tekrar `#` koy |
| Panelde "Yönetim paneli kapalı" | `.env` içinde `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH`, `ADMIN_SECRET` satırları eksik. `.env.example`'dan kopyala |
| Panelde "Sohbet sunucusuna ulaşılamadı" | `npm run dev` ile sohbet sunucusu da açık olmalı; iki tarafta `ADMIN_SECRET` aynı olmalı |

## Kodun en son halini almak

Claude bir değişiklik yaptığında GitHub'a gönderir. Kendi bilgisayarına almak için proje klasöründe:

```
git pull
npm install
npm run dev
```

## Claude'u kendi bilgisayarında kullanmak

Bu projeyi Claude ile doğrudan kendi bilgisayarındaki klasör üzerinden de geliştirebilirsin:

- **Claude masaüstü uygulaması:** Uygulamadaki Code bölümünden proje klasörünü (`eslesuygulamasi`) seç ve yazışmaya başla.
- **Terminal:** Bir kere `npm install -g @anthropic-ai/claude-code` ile kur. Sonra proje klasöründe `claude` yaz, Claude hesabınla giriş yap.

Claude açılınca proje klasöründeki `CLAUDE.md` dosyasını okur ve projeyi tanır. Sonra ona Türkçe yazman yeterli:
"Siteyi başlat", "Müziği biraz kıs", "Değişiklikleri GitHub'a gönder" gibi.
