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

## Sık karşılaşılan sorunlar

| Sorun | Çözüm |
|---|---|
| `node` veya `npm` tanınmıyor | Node.js'i kurduktan sonra terminali kapatıp yeniden aç |
| `port 3000 already in use` | Başka bir program o portu kullanıyor. Açık kalan eski terminali kapat veya bilgisayarı yeniden başlat |
| Köşelere girince "Sohbet sunucusuna bağlanılamadı" | Terminalde `[sunucu]` satırlarında hata var mı bak. Sohbet sunucusu açılmamış olabilir |
| "Sunucu yapılandırması eksik" | Kodun eski sürümü. `git pull` ile güncelle, `npm run dev`'i durdurup (`Ctrl + C`) yeniden başlat |
| Ana sayfaya geri atıyor | Onay çerezi yok veya silinmiş; onay ekranını tekrar doldur |
| `DATABASE_URL` hatası | Docker çalışmıyorsa `.env` içindeki `DATABASE_URL` satırının başına tekrar `#` koy |

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
