# Rakip Analizi: ilkoyun ve "Önce Oyun, Sonra Sohbet" Fikri

> **Tarih:** 21 Kasım 2026 · İncelenen site: ilkoyunn.vercel.app (herkese açık sayfa ve tarayıcıya gönderilen uygulama kodu üzerinden)
> **Amaç:** Neden tuttuğunu anlamak ve kendi şehir bazlı fikrimizle nasıl **farklılaşabileceğimizi** belirlemek. Amaç kopyalamak değil: isim, soru havuzu, metinler ve görsel tasarım bize ait olmalı.

---

## 1. ilkoyun ne yapıyor?

Sloganı: **"Önce oyun, sonra sohbet."** Açıklaması: *"Kayıt yok, form yok. Rastgele biriyle kısa bir mini oyun at; kazanan 2 soru kartı seçsin, sohbet kendiliğinden aksın."*

### Akış

1. Kullanıcı kayıt olmadan girer. 18 yaş ve koşullar onaylanır.
2. Ona **geçici bir karakter** verilir (sıfat + hayvan veya meyve, ör. "… Panda", "… Kivi").
3. İki yol var: **rastgele eşleşme** veya arkadaşla oynamak için **5 harfli oda kodu**.
4. Eşleşince **rastgele seçilen kısa bir mini oyun** başlar. **2 puana ilk ulaşan** kazanır.
5. Kazanan, **5 soru kartı arasından 2 tanesini** seçer (ör. *"Issız bir adaya düşsen yanına alacağın 3 şey ne olurdu?"*).
6. Kaybeden bu iki soruyu cevaplayınca **mesaj kutusu açılır**, serbest sohbet başlar.
7. Odadan çıkmadan yeni oyunlar oynanabilir.

### Oyunlar (11 adet)

| Oyun | Tür |
|---|---|
| XOX | Sıra tabanlı klasik |
| Hedef 4 | 4'lü sıralama (sıra tabanlı) |
| Penaltı | Köşe seç: gol at veya kurtar |
| Zaman | İçinden say, hedef saniyede durdur |
| Yaklaşık | Bir sayısal soruya en yakın tahmini yap |
| Kelimelik | Bilgi sorusu + kelimeyi ilk tamamla |
| Wordle türü | 5 harfli kelimeyi ilk bul |
| Kelime Avı | Harflerden gizli kelimeleri bul |
| Mancınık | Kategoriye uygun kelimeyi süre dolmadan yaz |
| Hafıza | 15 saniyede ezberle, sırayla diz |
| "100 kişiye sorduk" türü | En popüler cevabı tahmin et |

### Güvenlik ve hukuk tarafı

Bizim analizimizdeki yaklaşımla büyük ölçüde örtüşüyor, bu da planımızın doğru olduğunu gösteriyor:

- KVKK aydınlatma metni, 18 yaş şartı, 5651 kapsamında yer sağlayıcı statüsü ve 1–2 yıl trafik logu
- Normal mesajlar saklanmıyor. **Bildirilen odalarda son 40 mesaj** kaydediliyor.
- Otomatik küfür filtresi (Türkçe karakter normalizasyonu ile)
- Bildirim sebepleri: Küfür/Hakaret, Taciz/Uygunsuz, Spam/Reklam, Yasa Dışı İçerik/Tehdit
- Yönetim paneli: şikâyetler, **6 saat – 30 gün arası kademeli ban**, kalıcı ban, 5651 adli çıktı paketi

### Teknik altyapı

- Vite + React tek sayfa uygulama, Vercel'de barındırılıyor
- **Supabase** (Postgres + Realtime) ile anlık iletişim
- PWA ("Uygulamayı yükle"), mobil öncelikli tasarım

---

## 2. Neden tuttu? (değerlendirme)

1. **"Selam, nbr?" sorununu çözüyor.** Anonim sohbetin en büyük problemi ilk mesajın sıkıcılığı ve hemen terk edilmesi. Oyun ve soru kartları konuşmayı başlatıyor.
2. **Oyun bahane, sohbet ödül.** Rekabet heyecanı ve kazanan/kaybeden dinamiği iki tarafı da bağlıyor.
3. **Kısa ve tekrarlanabilir.** 1–2 dakikalık oyunlar, "bir tane daha" etkisi.
4. **Sıfır sürtünme.** Kayıt yok, tek dokunuşla başlıyor, telefonda uygulama gibi çalışıyor.
5. **Arkadaşla oda kodu** sayesinde yayılıyor. Kullanıcı arkadaşını çağırıyor, arkadaşı sonra rastgele eşleşmeyi deniyor.
6. **Daha güvenli bir ilk izlenim.** Oyun sırasında serbest mesaj olmadığı için ilk saniyelerdeki taciz ve spam azalıyor.

---

## 3. Bizim fikrimizle birleştirince: farklılaşma önerileri

Bizim farkımız **şehir**. ilkoyun'da şehir yok. Oyunu şehre bağlarsak hem "önce oyun" fikrinin gücünü alırız hem de kendimize ait bir ürün yaparız.

### 3.1 Şehir moduna özel oyunlar ("Hemşehrini bul")

Aynı şehirden iki kişi eşleşince oyun **o şehirle ilgili** olur:

- **Şehir Bilgi Yarışı:** "Kordon hangi ilçede?", "Bu yöresel yemek hangi şehrin?" gibi o şehre özel sorular.
- **Şehir Tahmini (sayısal):** "İlin yüzölçümü yaklaşık kaç km²?", "Bu köprü kaç yılında açıldı?"
- **Yöresel Kelime:** Şehrin yemekleri, semtleri ve simgeleri ile kelime oyunu.
- Genel oyunlar (4'lü sıralama, penaltı, zaman) yedek olarak her modda bulunur.

> Bu oyunlar, takma ad sistemi için hazırlayacağımız **81 il verisini** (yemek, simge, doğal güzellik) tekrar kullanır. Tek veri setinden hem takma ad hem de soru üretilir.

### 3.2 Tüm Türkiye moduna özel oyun: "Nerelisin?"

- Takma ad zaten şehrin bir özelliğinden geliyor (ör. "Uzungöl Esintisi").
- Rakip, **ipuçlarıyla karşı tarafın şehrini tahmin eder.** İpuçları: takma ad, bölge, plaka aralığı, yöresel yemek. Az ipucuyla bilen daha çok puan alır.
- Hem oyun hem doğal bir sohbet başlangıcı: "Rize mi? Çay toplamaya gittin mi hiç?"

### 3.3 Buz kırıcı kartlar (kendi soru havuzumuz)

- Mekanik aynı mantıkta kalabilir: kazanan, kart seçer. Ama soru havuzu **bize ait ve şehir temalı** olmalı (ör. *"Şehrinde turiste mutlaka götüreceğin yer?"*, *"Memleketinin en abartılan yemeği?"*).
- **Güvenlik kuralı:** Kartlar **kesin konum bilgisi istememeli** (mahalle, okul, iş yeri, sokak). Aynı şehirdeki yabancılar arasında bu bilgi gerçek dünyada risk oluşturur. Ayrıca filtre, sohbette de semt + saat + buluşma gibi kalıpları işaretleyebilir.

### 3.4 Arkadaşla oynama

- Oda kodu veya paylaşılabilir bağlantı ile arkadaşla oynama (büyüme için önemli).
- Şehir ligi / haftalık "en çok kazanan şehir" tablosu: hesapsız, sadece şehir bazında toplam puan. Kişisel veri gerektirmeden rekabet hissi verir.

---

## 4. Teknik etkiler

- Oyunlar **sunucuda yönetilmeli** (sunucu otoriter). Puanı, süreyi ve doğru cevabı istemci değil sunucu belirler. Aksi hâlde hile çok kolay olur.
- Önceki analizde önerdiğimiz **ayrı Socket.IO sunucusu** buna çok uygun: oda durumu, sıra ve zamanlayıcılar sunucuda tutulur.
- Hızlı başlangıç alternatifi: ilkoyun gibi **Supabase Realtime**. Daha az altyapı işi gerektirir, ama oyun mantığını sunucuda tutmak (Edge Functions / veritabanı fonksiyonları) daha zahmetlidir. Supabase'in sunucuları yurt dışında olduğu için KVKK md. 9 kapsamındaki aktarım yükümlülükleri de devreye girer.
- Her oyun ortak bir arayüze uyan ayrı bir modül olarak yazılır (`init`, `onMove`, `onTick`, `getWinner`). Böylece yeni oyun eklemek kolaylaşır.

### Akış (güncellenmiş)

```
Onay → Şehir / Tüm Türkiye seçimi → Takma ad → Eşleşme
  → Mini oyun (2 puana ilk ulaşan kazanır, ~60–90 sn)
  → Kazanan 5 karttan 2 soru seçer → Kaybeden cevaplar
  → Serbest sohbet (filtre + bildir)
  → "Bir oyun daha" / "Sonraki kişi" / "Çık"
```

---

## 5. MVP önerisi (oyunlu sürüm)

Başlangıç için **4 oyun** yeterli. Hepsini bir anda yapmak gerekmez:

| # | Oyun | Neden |
|---|---|---|
| 1 | **Şehir Bilgi Yarışı** | Ana farklılaştırıcı, 81 il verisini kullanır |
| 2 | **Nerelisin?** (Tüm Türkiye modu) | Karma modun kendine özgü oyunu |
| 3 | **Tahmin** (sayısal, şehir temalı) | Basit, hızlı, herkes oynayabilir |
| 4 | **4'lü Sıralama** | Bilgi gerektirmeyen, evrensel yedek oyun |

İçerik ihtiyacı: her il için ~10–20 soru (başlangıçta büyük şehirler + genel Türkiye soruları), ~100 buz kırıcı kart.

---

## 6. Dikkat edilecekler

- **Kopya algısından kaçınmak:** ilkoyun'un adını, oyun isimlerini, soru metinlerini, karakter listesini ve görsel stilini kullanmamalıyız. Mekanik (oyun + kart + sohbet) genel bir fikir, ama ürünün kimliği bize ait olmalı.
- **Soru doğruluğu:** Şehir bilgileri yanlış olursa kullanıcı güveni düşer. Sorular bir kaynakla doğrulanmalı.
- **İçerik üretim maliyeti:** 81 il × soru havuzu ciddi bir iş. Aşamalı ilerlenmeli (önce 10–15 büyük il + genel sorular).
