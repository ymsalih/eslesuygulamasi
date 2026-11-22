# Şehir Bazlı Anonim Sohbet Platformu — Proje Analizi

> **Durum:** Analiz / ön tasarım · **Tarih:** 21 Kasım 2026
> **Not:** Bu belgedeki hukuki değerlendirmeler teknik bir ön çalışmadır, hukuki görüş değildir. Yayına çıkmadan önce metinlerin bir KVKK / bilişim hukuku avukatı tarafından gözden geçirilmesi gerekir.

---

## 1. Özet

Türkiye'deki 81 ilden birini veya "Tüm Türkiye" seçeneğini seçen kullanıcıların, kayıt olmadan, **rastgele bir kişiyle birebir ve anlık** yazışabildiği bir web uygulaması. Her kullanıcıya seçtiği şehrin bir özelliğinden türetilmiş **takma ad** verilir. Sohbetten önce **yaş onayı + Kullanım Koşulları + KVKK Aydınlatma Metni** onayı alınır. Her sohbette **Bildir** butonu bulunur, mesajlar sunucu tarafında **küfür/hakaret filtresinden** geçer ve uygunsuz mesajlar gönderilmez.

| Başlık | Öneri |
|---|---|
| Arayüz | Next.js (App Router) + TypeScript + Tailwind CSS |
| Anlık iletişim | Ayrı bir Node.js + Socket.IO sunucusu (WebSocket) |
| Eşleştirme kuyruğu, hız sınırı, banlar | Redis |
| Kalıcı veri (onay kayıtları, bildirimler, banlar) | PostgreSQL + Prisma veya Drizzle |
| Bot koruması | Cloudflare Turnstile |
| Barındırma | Mümkünse **Türkiye'deki** bir sunucu (KVKK yurt dışı aktarım yükünü azaltır) |
| Mesaj saklama | Varsayılan olarak **saklanmaz**, yalnızca bildirilen sohbetlerden kesit saklanır |

---

## 2. Kullanıcı Akışı

```
Ana sayfa
  └─► 1. Yaş onayı (18+)
        └─► 2. Kullanım Koşulları + Aydınlatma Metni onayı (+ çerez tercihi)
              └─► 3. Şehir seçimi (81 il veya "Tüm Türkiye")
                    └─► 4. Takma ad atanır ("Boyozsever Kordon" gibi)
                          └─► 5. Eşleşme bekleniyor... (şehirde çevrimiçi kişi sayısı gösterilir)
                                └─► 6. Sohbet ekranı
                                      ├─ Mesaj gönder (filtreden geçer)
                                      ├─ Bildir  → sebep seç → sohbet biter, bu kişiyle tekrar eşleşmezsin
                                      ├─ Sonraki → mevcut sohbeti bitir, yeni eşleşme ara
                                      └─ Çık     → şehir seçimine dön
```

### 2.1 Ekranlar

1. **Karşılama sayfası:** Ne olduğu, topluluk kuralları özeti, "Sohbete Başla" butonu.
2. **Onay ekranı (modal veya ayrı sayfa):** Yaş beyanı, metin onayı, çerez tercihi. Onaylanmadan ilerlenemez.
3. **Şehir seçimi:** 81 il, aranabilir liste, plaka kodu ile arama (ör. "35" → İzmir), her ilin yanında çevrimiçi sayısı, en üstte "Tüm Türkiye".
4. **Bekleme ekranı:** Animasyon, iptal butonu, uzun süre eşleşme olmazsa "Tüm Türkiye'ye geç" önerisi.
5. **Sohbet ekranı:** Kendi takma adın, karşı tarafın takma adı, mesaj listesi, "yazıyor..." göstergesi, Bildir / Sonraki / Çık butonları.
6. **Yasal sayfalar:** Kullanım Koşulları, Aydınlatma Metni, Gizlilik ve Çerez Politikası, Topluluk Kuralları, İletişim / Künye, KVKK başvuru formu.
7. **Yönetim paneli (sadece yöneticiler):** Bildirimler, kesitler, ban yönetimi, yasaklı kelime listesi, istatistikler.

---

## 3. KVKK ve Hukuki Gereksinimler

Bu bölüm projenin en kritik kısmıdır. Anonim sohbet sitelerinin en büyük riski teknik değil hukukidir (örnek: Omegle, kötüye kullanım ve hukuki yük nedeniyle Kasım 2023'te kapandı).

### 3.1 Hangi kişisel veriler işlenecek?

Kayıt olmasa bile kullanıcı **anonim değildir**, kişisel veri işlenir:

| Veri | Neden | Saklama |
|---|---|---|
| IP adresi, bağlantı zamanı, port | 5651 sayılı Kanun kapsamında trafik bilgisi zorunluluğu, güvenlik | Kanunda belirtilen süre (yer sağlayıcı için 1–2 yıl), erişimi kısıtlı ayrı tabloda |
| Oturum kimliği (çerez) | Oturumu sürdürmek, ban uygulamak | Oturum süresi / ban süresi |
| Seçilen şehir | Eşleştirme | Sadece oturum süresince (istatistik için anonim sayılar) |
| Onay kaydı (metin sürümü, zaman, oturum kimliği, IP özeti) | Onayın alındığını ispat etmek | Hesap verebilirlik için makul süre (ör. 2 yıl) |
| Mesaj içerikleri | Sohbetin kendisi | **Saklanmaz**, sadece RAM'de akar |
| Bildirilen sohbet kesiti (son ~50 mesaj) | Şikâyeti incelemek, gerekirse adli makamlara iletmek | İnceleme sonrası belirlenen süre (ör. 6 ay); adli süreç varsa daha uzun |
| Tarayıcı / cihaz parmak izi (opsiyonel) | Ban atlatmayı zorlaştırmak | Ban süresi |

**Yapılmaması gerekenler:** GPS / konum izni istemek (şehir kullanıcının kendi beyanıdır), gereksiz veri toplamak, mesajları "ileride lazım olur" diye saklamak. Veri minimizasyonu KVKK md. 4'ün temel ilkesidir.

### 3.2 Aydınlatma metni ≠ Açık rıza

Sık yapılan hata: her şey için "açık rıza" kutucuğu koymak.

- **Aydınlatma Metni (KVKK md. 10):** Bilgilendirmedir, her durumda zorunludur. Kullanıcı "okudum" der, rıza vermez. Veri sorumlusunun kimliği, verinin hangi amaçla işlendiği, kime aktarıldığı, toplama yöntemi ve hukuki sebebi ile md. 11 kapsamındaki hakları yazılmalıdır.
- **Açık Rıza (KVKK md. 5/1):** Sadece başka bir hukuki sebep yoksa gerekir. Yukarıdaki verilerin çoğu "sözleşmenin ifası", "hukuki yükümlülük" (5651) ve "meşru menfaat" (güvenlik) sebeplerine dayanır, açık rıza gerekmez.
- Açık rıza **gerekebilecek** durumlar: zorunlu olmayan çerezler (analitik, reklam), bazı yurt dışı aktarımlar, pazarlama.
- Açık rıza, hizmet şartına bağlanmamalı ("onaylamazsan giremezsin" denmemeli) ve önceden işaretli olmamalıdır.

**Onay ekranı önerisi (ayrı ayrı, işaretsiz kutucuklar):**

- [ ] 18 yaşından büyük olduğumu beyan ederim. *(zorunlu)*
- [ ] [Kullanım Koşulları](#) ve [Topluluk Kuralları](#)'nı okudum, kabul ediyorum. *(zorunlu)*
- [ ] [KVKK Aydınlatma Metni](#)'ni okudum. *(zorunlu, bilgilendirme)*
- [ ] Analitik çerezlere izin veriyorum. *(isteğe bağlı, açık rıza)*

### 3.3 Hazırlanması gereken belgeler

1. **Kullanım Koşulları:** Hizmetin tanımı, 18 yaş şartı, yasaklı davranışlar, sorumluluk sınırları, ban hakkı, uygulanacak hukuk.
2. **Topluluk Kuralları:** Kullanıcı dostu dille kısa özet (taciz, müstehcenlik, nefret söylemi, kişisel bilgi paylaşımı, reklam/spam yasak).
3. **KVKK Aydınlatma Metni.**
4. **Gizlilik ve Çerez Politikası:** KVKK Kurulu'nun Çerez Uygulamaları Rehberi'ne uygun olmalı.
5. **Açık Rıza Metni:** Sadece gerçekten gereken işlemler için.
6. **İlgili Kişi Başvuru Formu:** KVKK md. 11 hakları; başvurular en geç 30 gün içinde yanıtlanır.
7. **İletişim / Künye sayfası:** 5651 kapsamında içerik / yer sağlayıcıya ait tanıtıcı bilgilerin sitede yayımlanması gerekir.

**Önemli:** Bu metinlerde bir **veri sorumlusu** (gerçek kişi veya şirket, adres, iletişim) yazmak zorunludur. Siteyi bir şahıs şirketi veya limited şirket üzerinden işletmek önerilir.

### 3.4 Onay kaydının tutulması

Onayın alındığını ispatlayabilmek için her onay şöyle kaydedilir:

```
consent_records
  id, session_id, terms_version, privacy_version, age_confirmed,
  analytics_cookies (bool), ip_hash, user_agent, created_at
```

Metinler sürümlenir (`terms_version = "2026-11-01"`). Metin güncellenince kullanıcıdan **yeniden onay** alınır.

### 3.5 Yurt dışına veri aktarımı

KVKK md. 9, 2024'te (7499 sayılı Kanun) değişti. Artık temel yol yeterlilik kararı veya **standart sözleşme** gibi uygun güvencelerdir (standart sözleşmenin imzadan sonraki 5 iş günü içinde Kurum'a bildirilmesi gerekir). Vercel, AWS, Supabase gibi yurt dışı hizmetler kullanılırsa bu süreç yönetilmelidir.

**Öneri:** Sohbet sunucusu, Redis ve veritabanını **Türkiye'deki bir sağlayıcıda** barındırmak. Next.js arayüzü statik/CDN'den sunulabilir; kişisel veri işlemediği sürece sorun azdır. Cloudflare (Turnstile/CDN) kullanılırsa IP adresi yurt dışına gider, bu da aydınlatma metninde ve aktarım değerlendirmesinde yer almalıdır.

### 3.6 VERBİS

Yıllık çalışan sayısı ve mali bilanço eşiklerinin altında kalan ve ana faaliyeti özel nitelikli veri işlemek olmayan veri sorumluları VERBİS kaydından muaftır. Eşikler Kurul kararlarıyla güncellendiği için başlangıçta güncel eşik kontrol edilmelidir. Muaf olunsa bile **KVKK'nın diğer tüm yükümlülükleri geçerlidir.**

### 3.7 5651 sayılı Kanun

- Platform, kullanıcı içeriğine aracılık ettiği için büyük ihtimalle **yer sağlayıcı** konumundadır. Bu nedenle trafik bilgilerini (IP, zaman, oturum) kanunda belirtilen süre boyunca doğru, bütün ve gizli şekilde saklamakla yükümlüdür. Mesaj içeriği saklama zorunluluğu yoktur.
- Hukuka aykırı içerik bildirildiğinde içeriği kaldırma ve mahkeme / BTK kararlarına uyma yükümlülüğü vardır.
- Türkiye'den günlük erişimi 1 milyonu aşan "sosyal ağ sağlayıcı"lar için ek yükümlülükler (temsilci atama, raporlama) bulunur. Başlangıçta geçerli değildir ama büyüme planında dikkate alınmalıdır.

### 3.8 Reşit olmayanların korunması

En büyük risk budur. Yabancılarla anonim sohbet, reşit olmayanlar için istismar riski taşır.

- 18+ beyanı zorunlu (beyan tek başına yeterli koruma değildir, ama asgari şarttır).
- **Sadece metin.** MVP'de fotoğraf, video, ses ve dosya gönderimi olmamalı.
- Bildirim sebepleri arasında **"Reşit olmadığını düşünüyorum"** ve **"Çocuk istismarı"** bulunmalı. Bu bildirimler en yüksek öncelikle incelenmeli.
- Çocuk istismarı veya hayati tehlike içeren bildirimler için yetkili makamlara (EGM / ihbarweb.org.tr, savcılık) iletme prosedürü yazılı olmalı.
- Filtre yaşla ilgili kalıpları ("15 yaşındayım", "lise 2") işaretleyebilir. Bu mesajlar engellenmez ama moderasyon için işaretlenir.

---

## 4. Teknik Mimari

### 4.1 Neden ayrı bir WebSocket sunucusu?

Next.js tek başına Vercel gibi sunucusuz (serverless) ortamlarda **kalıcı WebSocket bağlantısı tutamaz**. Üç seçenek var:

| Seçenek | Artı | Eksi |
|---|---|---|
| **A) Next.js + ayrı Socket.IO sunucusu** *(önerilen)* | Tam kontrol, düşük maliyet, veri Türkiye'de kalabilir, filtre ve eşleştirme sunucuda | Bir sunucuyu daha işletmek gerekir |
| B) Next.js özel sunucu (custom server) içinde Socket.IO | Tek proje, tek dağıtım | Next.js optimizasyonlarının bir kısmı kaybolur, ölçeklemesi zor |
| C) Hazır servis (Ably, Pusher, Supabase Realtime) | Hızlı başlangıç | Yurt dışı aktarım, mesaj başına maliyet, filtreyi araya koymak zor |

### 4.2 Önerilen yapı

```
                ┌──────────────────────────┐
  Tarayıcı ───► │  Next.js (web)           │  Sayfalar, onay akışı, yasal metinler,
     │          │  - App Router            │  yönetim paneli, REST API (onay kaydı,
     │          │  - Route Handlers        │  oturum token'ı üretme)
     │          └───────────┬──────────────┘
     │                      │
     │ WebSocket            │
     ▼                      ▼
  ┌──────────────────────────┐      ┌─────────────┐
  │ Sohbet sunucusu          │◄────►│   Redis     │  Eşleşme kuyrukları, aktif odalar,
  │ Node.js + Socket.IO      │      │             │  hız sınırları, ban listesi, sayaçlar
  │ - Eşleştirme             │      └─────────────┘
  │ - Mesaj filtresi         │      ┌─────────────┐
  │ - Bildirim               │◄────►│ PostgreSQL  │  Onay kayıtları, bildirimler, kesitler,
  │ - Hız sınırı             │      │             │  banlar, trafik logları, yasaklı kelimeler
  └──────────────────────────┘      └─────────────┘
```

**Monorepo önerisi** (pnpm workspaces veya Turborepo):

```
apps/
  web/          → Next.js
  chat-server/  → Socket.IO sunucusu
packages/
  shared/       → Ortak tipler, socket olay tanımları
  cities/       → 81 il + takma ad verisi
  moderation/   → Küfür filtresi (sunucu ve istemci aynı kodu kullanır)
```

### 4.3 Kimlik ve oturum

- Kayıt yok. Onay tamamlanınca sunucu, imzalı ve kısa ömürlü bir **oturum token'ı** (JWT veya HMAC imzalı) üretir: `{ sessionId, consentVersion, exp }`.
- Socket bağlantısı bu token olmadan kabul edilmez. Böylece onay ekranını atlayıp doğrudan sohbete bağlanmak mümkün olmaz.
- Token `httpOnly`, `secure`, `sameSite=strict` çerezde tutulur.
- Bağlantı öncesinde Cloudflare Turnstile doğrulaması yapılır (bot ve spam koruması).

### 4.4 Socket olayları (taslak)

| Yön | Olay | İçerik |
|---|---|---|
| İstemci → Sunucu | `queue:join` | `{ city: "izmir" \| "all" }` |
| İstemci → Sunucu | `queue:leave` | — |
| Sunucu → İstemci | `match:found` | `{ roomId, you: { nickname }, partner: { nickname, city? } }` |
| İstemci → Sunucu | `message:send` | `{ roomId, text, clientId }` |
| Sunucu → İstemci | `message:new` | `{ id, from: "me" \| "partner", text, ts }` |
| Sunucu → İstemci | `message:rejected` | `{ clientId, reason: "profanity" \| "personal_info" \| "rate_limit" \| "too_long" }` |
| İstemci → Sunucu | `typing` | `{ roomId, isTyping }` |
| İstemci → Sunucu | `chat:next` / `chat:leave` | — |
| İstemci → Sunucu | `report:create` | `{ roomId, reason, note? }` |
| Sunucu → İstemci | `chat:ended` | `{ reason: "partner_left" \| "reported" \| "timeout" }` |
| Sunucu → İstemci | `stats:online` | `{ total, byCity: { izmir: 42, ... } }` |

---

## 5. Eşleştirme Mantığı

### 5.1 Kuyruklar

Her şehir için bir kuyruk ve bir "Tüm Türkiye" kuyruğu (toplam 82):

```
queue:city:01   (Adana)
...
queue:city:81   (Düzce)
queue:all       (Tüm Türkiye)
```

**Kural:**
- Şehir seçen kullanıcı **sadece aynı şehirden** biriyle eşleşir.
- "Tüm Türkiye" seçen kullanıcı **sadece "Tüm Türkiye" kuyruğundakilerle** eşleşir.
- *(Karar gerekiyor, bkz. Bölüm 11)* İsteğe bağlı: Şehir kuyruğunda 30 saniye bekleyen kullanıcıya "Tüm Türkiye'ye geçmek ister misin?" önerisi sunulur.

### 5.2 Algoritma

```
queue:join(city):
  1. Kullanıcı banlı mı?  → evetse reddet
  2. Kuyruktan uygun bir aday çek (atomik, Redis Lua script ile):
       - aday ≠ kendisi
       - aday ile son 10 dakikada eşleşmemiş        (recent:{a}:{b}, TTL 10 dk)
       - aday ile aralarında bildirim/engel yok      (block:{a}:{b})
  3. Aday varsa → oda oluştur, ikisine de takma ad ata, match:found gönder
     Aday yoksa → kullanıcıyı kuyruğa ekle, bekle
```

- **Atomiklik önemli:** İki kullanıcının aynı adaya aynı anda eşleşmesini (race condition) önlemek için çekme ve oda oluşturma tek bir Lua script içinde yapılmalı.
- Kuyrukta en fazla birkaç aday taranır (ör. ilk 20). Uygun aday yoksa kullanıcı kuyruğa eklenir.
- Kopan bağlantılar (sekme kapatma) `disconnect` olayında kuyruktan ve odadan temizlenir. Karşı tarafa `chat:ended` gider.
- Uzun süre hareketsiz kalan sohbetler (ör. 10 dk) otomatik kapatılır.
- Çoklu sunucuya geçilirse Socket.IO **Redis adapter** ile ölçeklenir.

### 5.3 Soğuk başlangıç (küçük şehir) problemi

Bu, ürün açısından **en büyük risktir.** İstanbul'da her an eşleşme bulunur, Bayburt veya Tunceli'de dakikalarca kimse olmayabilir. Önerilen çözümler:

1. Şehir listesinde **canlı çevrimiçi sayısı** göstermek. Kullanıcı boş şehri seçmeden önce görür.
2. Bekleme süresi uzarsa **"Tüm Türkiye'ye geç"** veya **"Bölgene geç"** önerisi (7 coğrafi bölge: Ege, Karadeniz vb.). Bölge kuyruğu ileride eklenebilir.
3. Lansmanda birkaç büyük şehir + Tüm Türkiye öne çıkarılabilir.

---

## 6. Takma Ad Sistemi

### 6.1 Format

`{Şehir öğesi} + {sıfat/ek}` şeklinde, Türkçe kulağa doğal gelen birleşimler:

| Şehir | Öğeler (örnek) | Üretilen takma ad örnekleri |
|---|---|---|
| İstanbul | Boğaz, Simit, Galata, Martı, Vapur | "Vapur Yolcusu", "Galata Martısı", "Simitçi Boğaz" |
| Ankara | Ankara Kedisi, Kuğulu Park, Tiftik, Hamamönü | "Kuğulu Gezgin", "Tiftik Keçisi", "Ankara Kedisi" |
| İzmir | Boyoz, Kordon, Saat Kulesi, Gevrek, Kumru | "Boyozsever", "Kordon Yürüyüşçüsü", "Kumrucu" |
| Adana | Kebap, Şalgam, Taşköprü, Portakal Çiçeği | "Şalgam Ustası", "Taşköprülü", "Portakal Çiçeği" |
| Gaziantep | Baklava, Fıstık, Zeugma | "Fıstık Ağacı", "Zeugma Mozaiği", "Baklavacı" |
| Trabzon | Hamsi, Uzungöl, Sümela, Kemençe | "Uzungöl Esintisi", "Kemençeci", "Hamsi Sever" |
| Denizli | Pamukkale, Horoz, Traverten | "Pamukkale Gezgini", "Denizli Horozu" |
| Nevşehir | Balon, Peri Bacası, Kapadokya | "Peri Bacası", "Balon Pilotu" |
| Bursa | İskender, Uludağ, Kestane Şekeri, İpek | "Uludağ Kayakçısı", "Kestane Şekeri" |
| Rize | Çay, Ayder, Kaçkar | "Çay Toplayıcısı", "Ayder Yaylalı" |

- Her il için **en az 5–8 öğe** ve bunlarla birleşen bir **genel sıfat havuzu** (Gezgin, Sever, Ustası, Yolcusu, Esintisi...) olmalı. Böylece her il için onlarca kombinasyon çıkar.
- Veri `packages/cities/` altında tutulur: `{ plate: 35, slug: "izmir", name: "İzmir", region: "Ege", items: [...] }`.

### 6.2 Kurallar

- **Aynı sohbette iki kişiye aynı takma ad verilmez** (aynı şehirden eşleşen iki kişi için kontrol edilir).
- Takma adlar **her eşleşmede yeniden** üretilebilir veya oturum boyunca sabit kalabilir *(karar gerekiyor)*. Oturum boyunca sabit kalması bildirim ve banları daha anlaşılır yapar.
- **Tüm Türkiye modunda:** 81 il içinden rastgele bir il seçilip onun öğesinden takma ad üretilir. İstenirse "(Rize)" gibi kaynağı gösterilir.
- **Hassasiyet:** Bir şehri, bölgeyi veya etnik grubu küçümseyen, kalıp yargı içeren öğeler kullanılmamalı (ör. bölgesel aksan veya yerel halk üzerine espriler). Yemek, doğa, tarihi yer ve simgeler güvenli seçimlerdir. Liste yayından önce elle gözden geçirilmelidir.
- Kullanıcı takma adını kendisi seçemez/yazamaz. Bu, uygunsuz takma ad sorununu tamamen ortadan kaldırır.

---

## 7. Mesaj Filtresi (Moderasyon)

### 7.1 Temel ilke

Filtre **sunucuda** çalışmalıdır. İstemci tarafındaki filtre sadece kullanıcıya anında uyarı göstermek içindir, tarayıcıda kolayca atlatılabilir. Engellenen mesaj karşı tarafa **hiç ulaşmaz**, gönderene "Mesajın topluluk kurallarına uymadığı için gönderilmedi" uyarısı gösterilir.

### 7.2 Türkçeye özgü zorluklar

| Zorluk | Örnek | Çözüm |
|---|---|---|
| Ek almış kelimeler (sondan eklemeli dil) | kök + -ler, -in, -tir, -miş... | Kök listesi + "kelime başı" eşleşmesi |
| Türkçe karakter kaçırma | ş→s, ı→i, ğ→g, ç→c, ö→o, ü→u | Karşılaştırmadan önce normalize et |
| Rakam/sembol ile gizleme (leetspeak) | 1→i, 0→o, 3→e, 4→a, @→a, $→s | Karakter eşleme tablosu |
| Harf tekrarı | "aaaaptal" | Ardışık tekrarları teke indir |
| Araya boşluk veya nokta koyma | "a.p.t.a.l", "a p t a l" | Tek harfli parçaları birleştirerek ikinci kontrol |
| **Yanlış pozitif (Scunthorpe problemi)** | Masum kelimelerin içinde kısa küfür kökleri geçebilir (ör. bazı kısa köklerin "ameliyat", "malzeme", yer adları içinde geçmesi) | Kelime **sınırına** göre eşleşme + **beyaz liste** (izinli kelimeler) |

### 7.3 Filtre katmanları

```
mesaj
  │
  ├─ 1. Uzunluk / boşluk kontrolü (en fazla ~500 karakter, boş mesaj yok)
  ├─ 2. Hız sınırı (ör. saniyede 1, 10 saniyede 5 mesaj; aynı mesajın tekrarı yok)
  ├─ 3. Normalizasyon (küçük harf, Türkçe karakter, leetspeak, tekrar, boşluk)
  ├─ 4. Kara liste eşleşmesi (kök + kelime sınırı) − beyaz liste      → ENGELLE
  ├─ 5. Kişisel bilgi tespiti (telefon, TC kimlik no, IBAN, e-posta)  → ENGELLE
  ├─ 6. Bağlantı tespiti (http, www, .com, "insta: ...")              → ENGELLE (spam/yönlendirme)
  ├─ 7. Risk kalıpları (yaş beyanı, tehdit kelimeleri)                → GÖNDER ama İŞARETLE
  └─ 8. (Opsiyonel, ileride) Yapay zekâ tabanlı moderasyon API'si     → bağlamsal hakaret, taciz
```

- **5. katman önemlidir:** Telefon numarası ve kimlik bilgisi paylaşımını engellemek, hem kullanıcıyı (dolandırıcılık, şantaj) hem de platformu (KVKK) korur. TC kimlik numarası, algoritmasıyla (checksum) doğrulanarak yanlış pozitif azaltılır.
- Kara liste veritabanında tutulur ve yönetim panelinden güncellenir. Sunucu listeyi belli aralıklarla belleğe yükler.
- Filtreye sık takılan kullanıcılar (ör. 5 dakikada 5 engel) geçici olarak susturulur.
- Hiçbir filtre kusursuz değildir. Filtre ilk savunma hattıdır, **bildirim sistemi ve moderasyon** onu tamamlar.

---

## 8. Bildirim (Report) Sistemi

### 8.1 Kullanıcı tarafı

Sohbet ekranında her zaman görünür bir **Bildir** butonu. Tıklanınca sebep seçilir:

- Taciz / zorbalık
- Cinsel / müstehcen içerik
- Nefret söylemi / ayrımcılık
- Spam / reklam / dolandırıcılık
- Kişisel bilgi isteme veya paylaşma
- Reşit olmadığını düşünüyorum
- Tehdit / şiddet
- Diğer (kısa not, en fazla 300 karakter)

Bildirim gönderilince:
1. Sohbet **hemen sonlanır**.
2. İki kullanıcı **bir daha eşleşmez** (`block` kaydı).
3. Bildiren kişiye "Bildiriminiz alındı" mesajı gösterilir.

### 8.2 Sunucu tarafı

- Sunucu, aktif her oda için **son ~50 mesajı RAM'de** halka tampon (ring buffer) olarak tutar. Sohbet bitince tampon silinir.
- Bildirim gelirse bu tampon **kesit** olarak veritabanına yazılır. Bildirilen kişinin oturum kimliği, IP özeti ve zaman bilgisi eklenir.
- Bu işlem aydınlatma metninde açıkça yazmalıdır: "Bir sohbet bildirildiğinde, incelenmek üzere son mesajlar kaydedilir."
- Kötüye kullanımı önlemek için kullanıcı başına bildirim hız sınırı konur (ör. saatte 10).

### 8.3 Otomatik yaptırımlar

| Durum | Yaptırım |
|---|---|
| 24 saatte farklı kişilerden 3 bildirim | 1 saat geçici ban |
| 24 saatte 5+ bildirim | 24 saat ban + moderatör incelemesi |
| "Reşit olmayan" veya "tehdit" bildirimi | Anında moderatör kuyruğuna en üst öncelikle |
| Moderatör onayı | Kalıcı ban |

Ban; oturum kimliği + IP + (opsiyonel) cihaz parmak izi kombinasyonu ile uygulanır. Kayıt olmayan bir sistemde ban atlatmak (VPN, gizli sekme) her zaman mümkündür. Bunun bilinçli kabulü ve ileride gerekirse **telefon doğrulaması** eklenmesi değerlendirilebilir. Telefon doğrulaması KVKK yükünü artırır, bu nedenle MVP'de önerilmez.

### 8.4 Yönetim paneli

- Bildirim listesi (öncelik, sebep, tarih), kesit görüntüleme
- Aksiyonlar: yok say / uyar / geçici ban / kalıcı ban / makamlara ilet
- Yasaklı ve izinli kelime listesi yönetimi
- İstatistikler: anlık kullanıcı, şehir dağılımı, günlük sohbet sayısı, filtre engelleme oranı
- Yönetici girişi: güçlü şifre + **iki adımlı doğrulama**, tüm aksiyonlar denetim günlüğüne (audit log) yazılır

---

## 9. Güvenlik

| Risk | Önlem |
|---|---|
| XSS (mesajla zararlı kod gönderme) | Mesajlar sadece düz metin olarak gösterilir. React varsayılan olarak kaçış yapar, `dangerouslySetInnerHTML` kullanılmaz |
| Flood / spam / bot | Turnstile, mesaj ve bağlantı hız sınırları, IP başına eşzamanlı bağlantı limiti |
| Onay ekranını atlama | Socket bağlantısı için imzalı token zorunluluğu |
| Odaya dışarıdan mesaj enjekte etme | Sunucu, gönderenin gerçekten o odada olduğunu her mesajda doğrular |
| Veri sızıntısı | IP'ler ayrı tabloda ve şifreli tutulur, erişim kısıtlı, düzenli yedek, TLS zorunlu |
| DDoS | Cloudflare veya barındırma sağlayıcısının koruması |
| Yönetici hesabı ele geçirme | 2FA, IP kısıtlama, denetim günlüğü |

---

## 10. Veritabanı Şeması (Taslak)

```sql
consent_records  (id, session_id, terms_version, privacy_version, age_confirmed,
                  analytics_consent, ip_hash, user_agent, created_at)

traffic_logs     (id, session_id, ip_encrypted, port, event, created_at)
                  -- 5651, erişimi kısıtlı, süre dolunca otomatik silinir

reports          (id, room_id, reporter_session, reported_session, reason, note,
                  status, priority, created_at, reviewed_by, reviewed_at, action)

report_snapshots (id, report_id, messages_json, created_at, delete_after)

bans             (id, session_id, ip_hash, fingerprint_hash, reason, expires_at,
                  created_by, created_at)

banned_words     (id, pattern, type: block|flag, created_at)
allowed_words    (id, word)

admin_users      (id, email, password_hash, totp_secret, role, created_at)
audit_logs       (id, admin_id, action, target, created_at)
```

Mesaj tablosu **bilinçli olarak yoktur.**

Saklama süreleri dolan veriler için zamanlanmış bir temizlik görevi (cron) çalıştırılmalıdır. **Kişisel Verileri Saklama ve İmha Politikası** ile uyumlu olmalıdır.

---

## 11. Karar Verilmesi Gereken Konular

| # | Soru | Önerim |
|---|---|---|
| 1 | Şehir kuyruğunda eşleşme olmazsa Tüm Türkiye'ye geçiş önerilsin mi? | Evet, 30 sn sonra öneri (otomatik değil, kullanıcı onayıyla) |
| 2 | Tüm Türkiye modunda karşı tarafın şehri gösterilsin mi? | Evet, kullanıcı bunu kendisi seçerse gösterilsin (gizlilik için varsayılan kapalı) |
| 3 | Takma ad oturum boyunca sabit mi, her eşleşmede yeni mi? | Oturum boyunca sabit |
| 4 | Eşleşme sadece birebir mi, şehir bazlı grup odası da olacak mı? | MVP'de sadece birebir. Grup odası moderasyon yükünü katlar |
| 5 | Görsel / emoji / ses desteği? | MVP'de sadece metin + emoji |
| 6 | Barındırma Türkiye'de mi? | Evet (KVKK aktarım yükü azalır) |
| 7 | Veri sorumlusu kim olacak (şahıs / şirket)? | Yasal metinlerden önce netleşmeli |
| 8 | Gelir modeli (reklam, premium)? | Reklam eklenirse çerez onayı ve aydınlatma metni genişler |
| 9 | Cinsiyet / ilgi alanı filtresi olacak mı? | MVP'de hayır. Cinsiyet verisi istismara açık ve bazı senaryolarda hassas |

---

## 12. Yol Haritası

### Faz 1 — MVP

- [ ] Monorepo kurulumu (Next.js + Socket.IO sunucusu + ortak paketler)
- [ ] 81 il verisi + takma ad üretici
- [ ] Onay akışı (yaş, koşullar, aydınlatma, çerez) + onay kaydı + imzalı token
- [ ] Şehir seçimi ekranı + canlı çevrimiçi sayaçlar
- [ ] Eşleştirme (Redis kuyrukları, atomik Lua script, tekrar eşleşme engeli)
- [ ] Sohbet ekranı (mesaj, yazıyor göstergesi, Sonraki, Çık)
- [ ] Küfür filtresi v1 + kişisel bilgi ve bağlantı engeli + hız sınırı
- [ ] Bildirim butonu + kesit kaydı + otomatik geçici ban
- [ ] Taslak yasal metinler (avukat kontrolü için)
- [ ] Docker Compose ile yerel geliştirme ortamı

### Faz 2 — Yayına hazırlık

- [ ] Yönetim paneli (bildirimler, banlar, kelime listesi, 2FA)
- [ ] Trafik logları (5651) ve otomatik silme görevi
- [ ] Turnstile entegrasyonu
- [ ] Mobil uyumluluk, karanlık mod, erişilebilirlik
- [ ] Yük testi (eşzamanlı 1.000+ bağlantı)
- [ ] Avukat onaylı yasal metinler, künye sayfası

### Faz 3 — Büyüme

- [ ] Bölge bazlı kuyruk (Ege, Karadeniz...)
- [ ] Yapay zekâ destekli bağlamsal moderasyon
- [ ] Çoklu sunucu (Socket.IO Redis adapter)
- [ ] PWA / mobil uygulama

---

## 13. Riskler Özeti

| Risk | Etki | Olasılık | Azaltma |
|---|---|---|---|
| Reşit olmayan kullanıcılar ve istismar | Çok yüksek | Orta | 18+ beyanı, sadece metin, öncelikli bildirim, makamlara iletme prosedürü |
| KVKK / 5651 uyumsuzluğu | Yüksek | Orta | Veri minimizasyonu, doğru metinler, avukat kontrolü, Türkiye'de barındırma |
| Küçük şehirlerde eşleşme olmaması | Yüksek (ürün) | Yüksek | Canlı sayaçlar, Tüm Türkiye / bölge önerisi |
| Filtrenin atlatılması | Orta | Yüksek | Çok katmanlı filtre + bildirim + moderasyon |
| Yanlış pozitif (masum mesajın engellenmesi) | Düşük–Orta | Orta | Kelime sınırı eşleşmesi, beyaz liste, düzenli ayar |
| Bot / spam saldırısı | Orta | Yüksek | Turnstile, hız sınırları |
| Ban atlatma | Orta | Yüksek | Çoklu sinyal ile ban, ileride opsiyonel doğrulama |

---

## 14. Sonuç

Proje teknik olarak orta zorlukta ve Next.js + Socket.IO + Redis + PostgreSQL ile sağlam şekilde kurulabilir. Asıl dikkat edilmesi gereken üç konu:

1. **Hukuki çerçeve:** Aydınlatma ve rıza ayrımının doğru yapılması, mesajların saklanmaması, 5651 trafik logları, yaş sınırı.
2. **Güvenlik ve moderasyon:** Sunucu tarafı filtre, kişisel bilgi engeli, etkili bildirim ve ban sistemi.
3. **Kullanıcı yoğunluğu:** 81 ile bölünmüş kuyruklarda küçük şehirlerin boş kalmaması için akıllı yönlendirme.

Bölüm 11'deki kararlar netleştiğinde Faz 1 geliştirmesine başlanabilir.
