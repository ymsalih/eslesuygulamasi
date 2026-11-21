# Nihai Ürün Planı: Şehir Bazlı Canlı Sohbet

> **Tarih:** 21 Kasım 2026 · **Durum:** Önerilen nihai yön
> Bu belge `ANALIZ.md` (eşleşme, KVKK, filtre, bildirim) ve `RAKIP_ANALIZI.md` (oyunlu sohbet) belgelerindeki fikirleri tek bir ürün planında birleştirir. Hukuki ve teknik ayrıntılar için o belgelere atıf yapılır.

---

## 1. Tek cümlede ürün

**Her şehrin konulu "şark köşeleri" var. Gelen herkes bir köşede bir mindere oturur, yanındakilerle sanki aynı odadaymış gibi anlık sohbet eder. Kayıt yok, takma adlar şehre özel, köşeler 24 saat yaşar.**

Öneri slogan: *"Gel otur, bir çay iç."*

İsim için birkaç fikir (marka ve alan adı müsaitliği ayrıca kontrol edilmeli): **Şark Köşesi**, **Sedir**, **Minder**, **Muhabbet Köşesi**, **Meydan81**, **Hemşehri**.

> **Prototip:** `prototype/sark-kosesi.html` dosyası tarayıcıda açılarak köşe listesi, köşeye oturma, konuşma balonları, çay ikramı ve filtre davranışı denenebilir (diğer kullanıcılar simülasyondur).

---

## 1A. Şark köşesi konsepti

Her konu odası, görsel olarak bir **şark köşesi**dir: U şeklinde sedir, minderler, kilim, ortada sini üzerinde çaydanlık ve ince belli bardaklar, pencereden şehrin silüeti.

| Özellik | Açıklama |
|---|---|
| **Minder = koltuk** | Her köşede **10 minder** var. Giren kişi boş bir mindere oturur (otomatik atanır, isterse boş bir mindere tıklayıp yer değiştirir) |
| **Karakter** | Her oturan kişi, takma adı ve kendine özgü rengiyle basit bir karakter olarak görünür. Gerçek fotoğraf yok |
| **Konuşma balonu** | Yazılan mesaj, kişinin başının üstünde birkaç saniye balon olarak görünür. Aynı anda yandaki sohbet panelinde kalıcı olarak akar |
| **Yazıyor göstergesi** | Yazmakta olan kişinin başında "•••" balonu çıkar |
| **Çay ikram et** | Bir kişinin adına dokunup ona çay ikram edilebilir. Bardak animasyonla ona gider ve sohbete "X, Y için çay koydu" yazılır. Sohbeti başlatmanın sıcak ve zararsız bir yolu |
| **Kişi menüsü** | Çay ikram et · Bu kişiyi gizle (sadece kendi ekranında) · Bildir |
| **Konu tabelası** | Köşenin konusu üst başlıkta yazar. Herkes aynı konu etrafında oturur |
| **Şehre özgü köşe** | Her ilin köşesi farklı görünür: **pencereden şehrin manzarası** (İzmir'de Saat Kulesi ve deniz, İstanbul'da Galata ve vapur, Nevşehir'de balonlar ve peri bacaları...), **kilimin renkleri**, **duvar tabakları** ve **sinideki yöresel ikram** (İzmir'de boyoz, İstanbul'da simit, Trabzon'da hamsi, Gaziantep'te baklava, Nevşehir'de çömlek). Takma adlar ve hazır konular da o şehre özeldir. Tüm Türkiye'nin kendi genel manzarası vardır |
| **Her köşede farklı kişiler** | Kişi aynı anda tek bir köşede oturur. Başka köşeye geçince öncekinden kalkar |
| **Rastgele köşe** | "🎲 Rastgele bir köşeye otur" butonu, **boş minderi olan ve içinde en az 2 kişi bulunan** köşeler arasından birini seçer. Kimse boş bir odaya düşmez |
| **Köşe dolarsa** | Aynı konu için otomatik olarak "2. köşe" açılır. Böylece kalabalık konular da 10 kişilik samimi gruplara bölünür |

**Neden 10 kişi?**
- 10 kişilik bir grupta herkes birbirini görür, sohbet takip edilebilir kalır. 150 kişilik bir odada mesajlar çok hızlı akar ve kaybolur.
- Moderasyon kolaylaşır: kötü niyetli bir kişi en fazla 9 kişiyi etkiler ve bildirim eşikleri daha anlamlı olur.
- Ekranda tüm minderler sığar, mobilde de okunabilir.

**81 il için tema verisi:** Her il için `packages/cities/` altında tek bir kayıt tutulur: manzara çizimi (SVG), gökyüzü ve kilim renkleri, sinideki ikram, takma ad öğeleri ve hazır konular. Prototipte 6 il + Tüm Türkiye hazır. Kalan iller aşamalı eklenir. Teması henüz hazır olmayan iller, bölgesine uygun genel bir manzarayla (Ege kıyısı, Karadeniz yaylası, İç Anadolu bozkırı, Doğu dağları vb.) açılır.

**Mobil düzen:** Köşe sahnesi üstte (ekranın yaklaşık üçte biri), sohbet paneli altta. İsimler kısaltılır, dokununca tamamı görünür.

**Teknik not:** Sahne SVG ve CSS ile çizilir, oyun motoru gerekmez. Minder konumları sabittir (koltuk numarası). Sunucu her kişiye bir koltuk numarası atar ve `seat:update` olayıyla herkese bildirir. Konuşma balonları zaten gelen `message:new` olayından üretilir, ek bir veri trafiği yoktur.

---

## 2. Neden bu model?

| İhtiyaç | Bu modelin cevabı |
|---|---|
| İnsanlar sohbet etsin | Konu odaları anlık grup sohbetidir, ayrıca her şehirde her zaman açık bir "Genel Sohbet" vardır |
| Eğlenceli olsun, dedikodu hissi versin | Herkes konu açabilir, en hareketli konular öne çıkar, sohbet canlı akar |
| "Selam, nbr?" sıkıcılığı olmasın | Konu başlığı zaten konuşmanın sebebidir, kimse sıfırdan başlamaz |
| Küçük şehirlerde boşluk olmasın | Birebir eşleşmeden farklı olarak tek bir kişi bile konu açıp beklemeden yazabilir, ayrıca Tüm Türkiye meydanı her zaman yedek olarak durur |
| KVKK ve hukuki risk düşük olsun | Mesajlar kalıcı değil (24 saat sonra silinir), özel mesaj yok, kişileri hedef almak yasak |

Değerlendirilip **ilk sürüme alınmayanlar:**
- **Kalıcı başlık panosu (sözlük / forum gibi):** Hukuki risk ve moderasyon yükü çok yüksek. İleride sadece moderasyondan geçmiş içerikler için düşünülebilir (Faz 3).
- **Birebir rastgele eşleşme + mini oyun:** İyi bir fikir ama ikinci ürün kadar büyük. Faz 2'ye bırakıldı, aynı altyapının üzerine eklenecek.

---

## 3. Temel kavramlar

```
Türkiye
 ├─ Tüm Türkiye Meydanı
 │    ├─ Genel Sohbet (her zaman açık)
 │    ├─ Günün Konusu (sistem açar)
 │    └─ Kullanıcı konuları (24 saat)
 └─ 81 Şehir Meydanı (ör. İzmir)
      ├─ Genel Sohbet (her zaman açık)
      ├─ Günün Konusu (sistem açar)
      └─ Kullanıcı konuları (24 saat)
```

| Kavram | Tanım |
|---|---|
| **Meydan** | Bir şehrin (veya Tüm Türkiye'nin) ana sayfası. Canlı konuların listesi burada görünür |
| **Genel Sohbet** | Her meydanda sürekli açık oda. Geçmiş tutulmaz, sadece son ~100 mesaj akar |
| **Konu (oda) = şark köşesi** | Bir kullanıcının açtığı başlıklı, 10 minderli sohbet odası. Açıldıktan **24 saat** sonra veya **3 saat hiç mesaj gelmezse** kapanır ve silinir. Dolarsa aynı konuda yeni köşe açılır |
| **Günün Konusu** | Her meydanda her sabah sistemin açtığı hazır konu (ör. "İzmirliler, boyozu neyle yersiniz?"). Boş meydan sorununu çözer, 81 il verisinden üretilir |
| **Takma ad** | Şehrin bir özelliğinden üretilen geçici ad (bkz. ANALIZ.md bölüm 6) |

### Kategori etiketleri (konu açarken seçilir)

Gündem · Yeme-İçme · Etkinlik / Gece Hayatı · Spor · Okul / Üniversite · İş / Kariyer · Ulaşım / Trafik · İtiraf · Muhabbet / Diğer

"İtiraf" kategorisi dedikodu hissini verir ama kendi hakkında konuşmayı teşvik eder. Kurallar gereği başkalarını hedef alamaz.

---

## 4. Kullanıcı akışı

```
Ana sayfa
  └─► Onay (18+, Kullanım Koşulları, Aydınlatma Metni, çerez tercihi)   [ANALIZ.md §3]
        └─► Şehir seç (81 il + Tüm Türkiye, canlı kişi sayılarıyla)
              └─► Meydan
                    ├─ Genel Sohbet'e gir
                    ├─ Bir konuya gir  ──► takma ad atanır ──► sohbet
                    └─ Konu aç (başlık + kategori) ──► filtre ──► oda açılır
```

- Kullanıcı istediği zaman şehir değiştirebilir. Aynı anda birden fazla konuyu sekme gibi açık tutabilir (en fazla 3).
- Onaydan sonra bir sonraki ziyarette doğrudan son seçilen şehrin meydanı açılır.

---

## 5. Ekranlar

### 5.1 Meydan (şehir ana sayfası)

```
┌─────────────────────────────────────────────┐
│ 📍 İzmir  ▾        🟢 312 kişi çevrimiçi     │
├─────────────────────────────────────────────┤
│ [ + Konu Aç ]                                │
│                                              │
│ ⭐ GÜNÜN KONUSU                               │
│   Boyozu neyle yersiniz?        👥 48  💬 hızlı│
│                                              │
│ 💬 Genel Sohbet                  👥 120       │
│                                              │
│ 🔥 Hareketli    🆕 Yeni    🏷️ Kategori ▾      │
│ ──────────────────────────────────────────── │
│ Kordon'da bu akşam konser var mı?             │
│   Etkinlik · 👥 23 · son mesaj 10 sn · 18 sa  │
│ Metro yine arızalı, ne zaman düzelir?          │
│   Ulaşım · 👥 15 · son mesaj 1 dk · 6 sa       │
│ ...                                          │
└─────────────────────────────────────────────┘
```

- Sıralama: **Hareketli** (son 10 dakikadaki mesaj ve kişi sayısına göre), **Yeni**, kategori filtresi.
- Her konuda içerideki kişi sayısı, son mesaj zamanı ve kalan süre görünür.
- Şehirde hiç kullanıcı konusu yoksa: Günün Konusu + "Tüm Türkiye'de şu an konuşulanlar" bölümü gösterilir.

### 5.2 Konu odası

```
┌─────────────────────────────────────────────┐
│ ← Kordon'da bu akşam konser var mı?   ⋮      │
│   Etkinlik · 👥 23 · 18 sa kaldı   [Bildir]   │
├─────────────────────────────────────────────┤
│ 🟠 Kumru Ustası  👑 konu sahibi               │
│    Alsancak tarafında bir şey duyan var mı?   │
│ 🔵 Boyozsever                                │
│    ↪ Kumru Ustası: Alsancak tarafında...      │
│    Cuma günü varmış galiba                    │
│    ❤️ 3  😂 1                                  │
│ ...                                          │
├─────────────────────────────────────────────┤
│ Sen: 🟢 Kordon Yürüyüşçüsü                    │
│ [ Mesaj yaz...                    ] [Gönder]  │
└─────────────────────────────────────────────┘
```

- **Mesaj eylemleri:** Yanıtla (alıntı), tepki ver (sınırlı emoji seti: ❤️ 😂 😮 👍 👎), bildir, bu kişiyi gizle (sadece kendi ekranında).
- "X yazıyor..." göstergesi, konu sahibi rozeti (👑) ve takma ada göre sabit bir renk.
- Odaya girince **son 50 mesaj** gösterilir. Daha eskisi yüklenmez, bu da yükü ve riski azaltır.

---

## 6. Kurallar ve sınırlar

| Konu | Kural |
|---|---|
| Mesaj uzunluğu | En fazla 300 karakter |
| Mesaj hızı | 1 mesaj / 2 sn. Genel Sohbet gibi kalabalık odalarda **yavaş mod** (1 mesaj / 5 sn) |
| Konu açma | Oturum başına 30 dakikada 1 konu, günde en fazla 5 |
| Yeni oturum | Onaydan sonra ilk **5 dakika** konu açamaz (spam ve bot engeli), Genel Sohbet'e yazabilir |
| Başlık | 10–100 karakter, filtreden geçer, link ve kişisel bilgi içeremez |
| Köşe kapasitesi | **10 kişi** (10 minder). Dolunca aynı konuda otomatik yeni köşe açılır |
| Medya | **Yok.** Sadece metin ve emoji (fotoğraf/video yok, link yok) |
| Özel mesaj (DM) | **Yok.** Tacizin en çok yaşandığı kanal budur. İleride iki tarafın da onayıyla düşünülebilir |
| Ömür | 24 saat veya 3 saat sessizlik, hangisi önce gelirse |

### Topluluk kuralları (öz)

1. **Kişileri hedef alma.** Özel kişilerin adını, fotoğrafını, iş yerini, okulunu yazma. Konular olaylar, yerler ve fikirler hakkında olur.
2. Küfür, hakaret, nefret söylemi ve ayrımcılık yasak.
3. Kişisel bilgi paylaşma ve isteme yasak (telefon, adres, sosyal medya hesabı).
4. Reklam, spam, bahis ve dolandırıcılık yasak.
5. 18 yaş altı kullanıcılar giremez.

---

## 7. Takma ad sistemi (grup sohbetine uyarlanmış hali)

- Takma ad **her konu odasında ayrı** atanır ve o odada sabit kalır. Böylece oda içinde sohbet tutarlı olur, ama aynı kişi farklı konularda farklı adla görünür ve **odalar arasında takip edilemez** (gizlilik ve zorbalık önlemi).
- Bir odada aynı takma ad iki kişiye verilmez. Havuz biterse sona sayı eklenir ("Boyozsever 2").
- Tüm Türkiye meydanında takma ad rastgele bir ilin özelliğinden gelir. İstenirse küçük bir il etiketi gösterilebilir (karar gerekiyor).
- Kullanıcı takma adını kendisi yazamaz. Böylece uygunsuz isim sorunu baştan yok olur.
- Odadan çıkıp 30 dakika içinde geri dönen kullanıcı aynı adı geri alır (oturum + oda eşlemesi Redis'te, TTL ile).

---

## 8. Moderasyon

`ANALIZ.md` bölüm 7 (filtre) ve bölüm 8'deki (bildirim) yapı aynen kullanılır. Grup sohbetine özgü eklemeler:

### 8.1 Mesaj ve başlık filtresi
- Normalizasyon + kara liste + beyaz liste + kişisel bilgi + link engeli (aynen).
- **Başlıklara ek kontrol:** "Ad Soyad" kalıbı (büyük harfle başlayan iki kelime + kişi bildiren ek), okul, iş yeri ve mekân ile birlikte kişi tanımlama kalıpları gibi şüpheli başlıklar **engellenmez ama "incelemede" olarak açılır**. Bu başlıklar meydanda listelenmez, sadece bağlantıyla girilebilir. Moderatör onaylayınca listelenir.

### 8.2 Bildirim
- **Mesaj bildirme** ve **konu bildirme** ayrı ayrı yapılır.
- Bildirim sebeplerine **"Bir kişiyi hedef alıyor / kişisel bilgi içeriyor"** eklenir.
- Kolektif koruma:
  - Bir mesaj **3 farklı kişi** tarafından bildirilirse herkes için otomatik gizlenir ("Bu mesaj bildirimler nedeniyle gizlendi").
  - Bir konu **5 farklı kişi** tarafından bildirilirse meydandan kaldırılır ve moderatöre düşer.
- Bildirim anında ilgili odanın son 40 mesajı kesit olarak kaydedilir, diğer her şey odayla birlikte silinir.

### 8.3 Kişilik hakkı başvurusu (hızlı kaldırma)
- Sitede herkese açık bir **"İçerik kaldırma talebi"** formu bulunur (kendisi hakkında içerik olduğunu düşünen kişi için, giriş gerekmez).
- Bu talepler yönetim panelinde **en yüksek öncelikle** görünür. 5651 kapsamındaki kısa süre (24 saat) içinde sonuçlandırılır.
- İçeriklerin zaten 24 saatte silinmesi bu riski önemli ölçüde azaltır, ama süreç yine de yazılı ve işler durumda olmalı.

### 8.4 Ban ve yaptırım
- Kademeli: uyarı → 6 saat → 24 saat → 7 gün → 30 gün → kalıcı.
- Geçici susturma: filtreye 5 dakikada 5 kez takılan kullanıcı 10 dakika yazamaz.
- Konu sahibinin moderasyon yetkisi **yok** (kötüye kullanılabilir). Sadece kendi konusunu erken kapatabilir.

---

## 9. KVKK ve hukuk (grup modeline göre farklar)

Temel yapı `ANALIZ.md` bölüm 3'teki gibidir. Bu modele özgü noktalar:

| Konu | Uygulama |
|---|---|
| Mesajlar | Sadece Redis'te, oda ömrü kadar (en fazla 24 saat) tutulur, sonra otomatik silinir. Veritabanına yazılmaz |
| Konu başlıkları | Oda açıkken listelenir. Oda kapanınca başlık metni silinir, sadece istatistik (şehir, kategori, mesaj sayısı) kalır |
| Bildirilen içerik | Kesit (son 40 mesaj) inceleme ve hukuki süreç için saklanır, süre aydınlatma metninde yazılır |
| Trafik logu (5651) | IP, zaman ve oturum, 1–2 yıl, erişimi kısıtlı |
| Aydınlatma metni | "Mesajlar 24 saat içinde silinir, bildirilen içerik incelenmek üzere saklanır" açıkça yazılır |
| Künye / iletişim | 5651 gereği sitede yayımlanır, içerik kaldırma formu bulunur |

> Yayın öncesi bir bilişim hukuku avukatından metinler ve süreçler için görüş alınmalıdır.

---

## 10. Teknik mimari

Mimari `ANALIZ.md` bölüm 4 ile aynıdır: **Next.js (web) + Node.js/Socket.IO (gerçek zamanlı) + Redis + PostgreSQL**. Grup odaları bu yapıya doğal şekilde oturur.

### 10.1 Veri nerede tutulur?

| Veri | Yer | Ömür |
|---|---|---|
| Aktif konular (başlık, kategori, şehir, açılış zamanı) | Redis hash + şehir bazlı sıralı küme (hareketlilik puanı) | Oda ömrü |
| Mesajlar | Redis list (oda başına en fazla 200, son 50'si gösterilir) | Oda ömrü (TTL) |
| Oda üyeleri, takma adlar, yazıyor durumu | Redis | Oturum / oda ömrü |
| Hız sınırları, susturmalar | Redis (sayaçlar, TTL) | Kısa |
| Onay kayıtları, bildirimler, kesitler, banlar, trafik logları, kelime listeleri | PostgreSQL | Saklama politikasına göre |
| Günün konusu şablonları, 81 il verisi | PostgreSQL / kod içi veri paketi | Kalıcı |

### 10.2 Socket olayları (grup modeli)

| Yön | Olay | İçerik |
|---|---|---|
| İ → S | `square:join` | `{ city }`: meydanı dinle (konu listesi + sayılar) |
| S → İ | `square:topics` | Konu listesi (ilk yükleme) |
| S → İ | `square:topic_update` | Konu eklendi / güncellendi / kapandı |
| İ → S | `topic:create` | `{ city, title, category }` |
| İ → S | `room:join` / `room:leave` | `{ roomId }` |
| S → İ | `room:state` | `{ you: { nickname, color, seat }, members: [{ nickname, color, seat }], lastMessages[50] }` |
| İ → S | `seat:change` | `{ roomId, seat }`: boş bir mindere geç |
| S → İ | `seat:update` | `{ nickname, seat \| null }`: biri oturdu, yer değiştirdi veya kalktı |
| İ → S | `tea:offer` | `{ roomId, toNickname }`: çay ikram et (hız sınırlı) |
| S → İ | `tea:offered` | `{ from, to }` |
| İ → S | `room:random` | `{ city }`: sunucu, boş minderi olan ve en az 2 kişilik bir köşe seçer |
| İ → S | `message:send` | `{ roomId, text, replyTo?, clientId }` |
| S → İ | `message:new` | `{ id, nickname, color, text, replyTo?, ts, isOwner }` |
| S → İ | `message:rejected` | `{ clientId, reason }` |
| İ → S | `message:react` | `{ roomId, messageId, emoji }` |
| İ → S | `report:message` / `report:topic` | `{ roomId, messageId?, reason, note? }` |
| S → İ | `message:hidden` | `{ messageId }` (bildirim eşiği aşıldı) |
| İ ↔ S | `typing` | `{ roomId, isTyping }` |
| S → İ | `room:closed` | `{ reason: "expired" \| "idle" \| "moderation" \| "owner" }` |

### 10.3 Ölçek ve maliyet (ilk aşama için tahmin)
- Tek bir Socket.IO sunucusu (2 vCPU / 4 GB) birkaç bin eşzamanlı bağlantıyı rahat taşır.
- Büyüyünce: birden fazla Socket.IO sunucusu + Redis adapter + yük dengeleyicide sticky session.
- Başlangıç altyapısı: 1 uygulama sunucusu + yönetilen veya aynı makinede Redis + PostgreSQL. Türkiye'deki bir sağlayıcıda düşük aylık maliyetle başlanabilir.

### 10.4 Proje yapısı

```
apps/
  web/            Next.js: sayfalar, onay akışı, meydan, oda arayüzü, yasal sayfalar, yönetim paneli
  realtime/       Socket.IO: odalar, mesajlar, filtre, hız sınırı, bildirim
packages/
  shared/         Ortak tipler ve socket olay şemaları (zod)
  cities/         81 il verisi: takma ad öğeleri, günün konusu şablonları
  moderation/     Filtre (normalizasyon, kara/beyaz liste, kişisel bilgi, link)
infra/
  docker-compose.yml   Yerel geliştirme: Postgres + Redis
```

---

## 11. Büyüme ve başlangıç stratejisi

1. **Boş meydan sorunu:** Her sabah her meydanda **Günün Konusu** açılır. Başlangıçta 81 il için hazırlanmış soru şablonlarından (yemek, mekân, gündem) seçilir.
2. **Lansman:** 81 il de açık olur, ama tanıtım 3–5 büyük şehir (İstanbul, Ankara, İzmir, Bursa, Antalya) ve üniversite şehirlerine odaklanır.
3. **Paylaşım:** Her konunun paylaşılabilir bir bağlantısı olur ("İzmir'de şu an bunu konuşuyoruz → katıl"). WhatsApp, Instagram hikâye ve X için önizleme görseli (Open Graph) otomatik üretilir.
4. **Uygulama gibi kullanım:** PWA ile ana ekrana eklenebilir.
5. **Ölçülecek metrikler:** Günlük aktif kullanıcı, ertesi gün geri dönüş oranı, oturum süresi, konu başına mesaj, mesaj başına bildirim oranı, filtre engelleme oranı.

---

## 12. Yol haritası

### Faz 1: MVP (canlı meydanlar)
- [ ] Monorepo iskeleti, Docker Compose (Postgres + Redis)
- [ ] 81 il verisi: takma ad öğeleri + Günün Konusu şablonları (önce 10 büyük il detaylı, diğerleri temel)
- [ ] Onay akışı + onay kaydı + imzalı oturum token'ı
- [ ] Şehir seçimi + canlı kişi sayıları
- [ ] Meydan: konu listesi (Hareketli / Yeni / kategori), konu açma
- [ ] Konu odası: mesaj, yanıtla, tepki, yazıyor, son 50 mesaj, takma ad ve renk
- [ ] Genel Sohbet ve Günün Konusu (zamanlanmış görev)
- [ ] Filtre v1 (mesaj + başlık), hız sınırları, yavaş mod
- [ ] Bildirim (mesaj ve konu), otomatik gizleme eşikleri, kesit kaydı
- [ ] Oda ömrü ve otomatik silme
- [ ] Taslak yasal metinler + künye + içerik kaldırma formu

### Faz 2: Yayın ve güvenlik
- [ ] Yönetim paneli: bildirimler, inceleme kuyruğu, banlar, kelime listeleri, 2FA, denetim günlüğü
- [ ] 5651 trafik logları + otomatik silme
- [ ] Turnstile (bot koruması)
- [ ] PWA, paylaşım görselleri, mobil iyileştirmeler
- [ ] Yük testi
- [ ] **Birebir rastgele eşleşme + buz kırıcı mini oyun** (RAKIP_ANALIZI.md'deki "Nerelisin?" ve şehir bilgi yarışı)

### Faz 3: Büyüme
- [ ] Bölge meydanları (Ege, Karadeniz...)
- [ ] Moderasyondan geçmiş "Haftanın en çok konuşulanları" kalıcı özet sayfaları (Google trafiği için)
- [ ] Yapay zekâ destekli bağlamsal moderasyon
- [ ] Çoklu sunucuya ölçekleme

---

## 13. Netleşmesi gereken kararlar

| # | Karar | Önerim |
|---|---|---|
| 1 | Ürün adı ve alan adı | Yukarıdaki listeden veya yeni bir isim, marka araştırması yapılarak |
| 2 | Konu ömrü 24 saat mi, farklı mı? | 24 saat + 3 saat sessizlikte kapanış |
| 3 | Tüm Türkiye meydanında kullanıcının ili görünsün mü? | Varsayılan olarak hayır, kullanıcı isterse açabilir |
| 4 | Veri sorumlusu (şahıs / şirket) | Yasal metinlerden önce netleşmeli |
| 5 | Barındırma | Türkiye'de bir sunucu |
| 6 | Gelir modeli | İlk aşamada yok. İleride reklam (çerez onayı gerekir) veya kozmetik premium (renk, rozet) |

---

## 14. Sonuç

Önerilen ürün **şehir bazlı, kayıtsız, anlık grup sohbeti**: her şehrin canlı bir meydanı var, herkes konu açabiliyor, konular 24 saat yaşıyor. Bu model:

- dedikodu ve gündem sohbetinin **eğlencesini** verir,
- birebir eşleşmedeki **boş şehir sorununu** büyük ölçüde çözer,
- kalıcı foruma göre **hukuki riski ve moderasyon yükünü** düşük tutar,
- ileride birebir eşleşme ve mini oyunların eklenebileceği **ortak bir altyapı** kurar.

Kararlar netleştiğinde Faz 1 geliştirmesine başlanabilir.
