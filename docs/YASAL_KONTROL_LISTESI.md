# Yasal Uyum Kontrol Listesi

> **Tarih:** 21 Kasım 2026
> **Önemli:** Bu belge teknik ekibin hazırladığı bir uyum yol haritasıdır, hukuki görüş değildir. Yayına çıkmadan önce bir **bilişim / KVKK avukatına** gözden geçirtilmelidir. Bölüm 7'de avukata sorulacak sorular hazır olarak listelenmiştir.

---

## 1. Temel strateji: üç ilke

1. **"Haberdar olunca hemen kaldır" (5651 md. 5):** Kullanıcı içeriğine aracılık eden platform (yer sağlayıcı) içerikleri önceden denetlemekle yükümlü değildir. Ama hukuka aykırı içerikten **haberdar edildiğinde kaldırmakla** yükümlüdür. Bu korumadan yararlanmak için bildirimi alan, hızlı inceleyen, kaldıran ve **bunu kayıt altına alan** bir süreç kurulmalıdır.
2. **Az veri, kısa süre (KVKK md. 4):** Ne kadar az veri toplanır ve ne kadar kısa saklanırsa risk o kadar azalır. Kayıt yok, mesajlar 24 saatte silinir, konum alınmaz.
3. **Riskli kanalları baştan kapatmak:** Özel mesaj, fotoğraf/video, link ve kişileri hedef alan içerik yok. 18 yaş altına kapalı.

---

## 2. Yayın öncesi kontrol listesi

### 2.1 Kuruluş ve kimlik
- [ ] **Veri sorumlusu belirlendi:** Gerçek kişi veya şirket (gelir planı varsa şahıs şirketi veya limited şirket önerilir).
- [ ] Şirketse **KEP / e-Tebligat adresi** aktif ve düzenli takip ediliyor (resmi yazışmalar buradan gelebilir).
- [ ] Ürün adı için **TÜRKPATENT'te marka araştırması** yapıldı: başkasının markasını ihlal etmiyoruz. İstenirse marka başvurusu yapıldı.
- [ ] Alan adı veri sorumlusu (veya şirket) adına kayıtlı.

### 2.2 5651 sayılı Kanun
- [ ] **Künye / iletişim sayfası:** Unvan, adres, e-posta ve telefon sitede herkesin erişebileceği şekilde yayımlandı (md. 3).
- [ ] **Trafik logları:** IP, port, zaman ve oturum kimliği **1–2 yıl** boyunca, bütünlüğü korunarak (ör. imza / hash zinciri) ve erişimi kısıtlı şekilde saklanıyor.
- [ ] **İçerik kaldırma formu** sitede ve bu talepler **24 saat** içinde sonuçlandırılıyor (md. 9).
- [ ] Mahkeme ve BTK kararları için bir iletişim kanalı ve uygulama prosedürü var (bazı kararlar için süre **4 saat**).
- [ ] **BTK'ya yer sağlayıcı bildirimi** gerekip gerekmediği avukata soruldu.

### 2.3 KVKK
- [ ] **Aydınlatma Metni** hazır: veri sorumlusu, işlenen veriler, amaçlar, hukuki sebepler, aktarımlar, saklama süreleri, md. 11 hakları.
- [ ] **Açık rıza** sadece gerçekten gereken yerlerde (zorunlu olmayan çerezler) ve ayrı, işaretsiz kutucukla alınıyor. Hizmet şartına bağlanmıyor.
- [ ] **Çerez Politikası** ve çerez onay ekranı, KVKK Çerez Uygulamaları Rehberi'ne uygun (zorunlu olmayan çerezler varsayılan olarak kapalı).
- [ ] **Onay kayıtları** metin sürümüyle birlikte saklanıyor. Metin değişince yeniden onay alınıyor.
- [ ] **Kişisel Veri Saklama ve İmha Politikası** yazıldı ve otomatik silme görevleri buna göre ayarlandı.
- [ ] **VERBİS** kayıt yükümlülüğü güncel eşiklere göre kontrol edildi (muaf olunsa bile diğer yükümlülükler geçerli).
- [ ] **Yurt dışı aktarım:** Sunucular Türkiye'de. Yurt dışı bir servis kullanılıyorsa (ör. Cloudflare) md. 9'a göre değerlendirildi; standart sözleşme gerekiyorsa imzalandı ve **5 iş günü** içinde Kurum'a bildirildi.
- [ ] **İlgili kişi başvuru kanalı** (e-posta + form) var, başvurular **30 gün** içinde yanıtlanıyor.
- [ ] **Veri ihlali müdahale planı** var. İhlal öğrenilince **72 saat** içinde Kurul'a bildirim yapılır.
- [ ] **Teknik ve idari tedbirler** (md. 12): TLS, şifreli yedek, IP'lerin şifreli saklanması, rol bazlı erişim, yönetici 2FA, erişim logları, gizlilik taahhüdü (moderatörler için).

### 2.4 Kullanıcı metinleri
- [ ] **Kullanım Koşulları:** 18 yaş şartı, kullanıcının kendi içeriğinden sorumlu olduğu, yasaklı içerikler, platformun içerik kaldırma ve erişimi kısıtlama hakkı, sorumluluğun sınırları, uygulanacak hukuk.
- [ ] **Topluluk Kuralları:** Kısa ve anlaşılır özet, onay ekranında ve her odada erişilebilir.
- [ ] Metinler **sürümlü** ve tarihli.

---

## 3. Ürüne gömülü yasal önlemler

Hukuki riski azaltan kararlar doğrudan koda yerleştirilir:

| Önlem | Neyi önler |
|---|---|
| Onay ekranı (18+, koşullar, aydınlatma) olmadan sohbete bağlanılamaz (imzalı token) | Onaysız kullanım, ispat sorunu |
| Mesajlar Redis'te, en fazla 24 saat; veritabanına yazılmaz | Gereksiz veri saklama, sızıntı riski |
| Özel mesaj, medya ve link yok | Taciz, müstehcen içerik, dolandırıcılık, bahis spamı |
| Kişisel bilgi filtresi (telefon, TC kimlik no, IBAN, e-posta, adres kalıpları) | Kişisel veri ifşası, KVKK |
| Başlıklarda kişi tanımlama kalıpları "incelemede" olarak açılır | Hakaret, kişilik hakkı ihlali |
| Kolektif gizleme (3 bildirim → mesaj gizlenir, 5 bildirim → konu kaldırılır) | Moderatör yokken zararın yayılması |
| Bildirilen odadan son 40 mesajın kesiti | Delil ve inceleme ihtiyacı |
| Her moderasyon işleminin denetim günlüğüne yazılması | "Haberdar olunca kaldırdık" ispatı |
| Konum alınmaz, şehir kullanıcının beyanıdır | Konum verisi işleme |
| Takma adlar sistem tarafından verilir ve odalar arasında değişir | Uygunsuz isimler, takip ve zorbalık |

---

## 4. Yasaklı içerik kategorileri (Türkiye'ye özgü olanlar dahil)

Filtre, bildirim sebepleri ve Kullanım Koşulları bu listeye göre hazırlanır:

| Kategori | Not |
|---|---|
| Çocukların cinsel istismarı | Sıfır tolerans, anında kaldırma + ihbar (bkz. bölüm 5) |
| Müstehcenlik | 5651 md. 8 katalog suçları arasında |
| Yasa dışı bahis ve kumar | Türkiye'de en sık görülen spam türü, filtrede özel liste |
| Uyuşturucu teşviki ve satışı | 5651 md. 8 |
| İntihara yönlendirme | 5651 md. 8. Ayrıca intihar düşüncesi paylaşan kullanıcıya yardım hattı bilgisi gösterilebilir |
| Fuhuş | 5651 md. 8 |
| Atatürk aleyhine suçlar (5816 sayılı Kanun) | 5651 md. 8 kapsamında |
| Hakaret ve kişilik hakkı ihlali | TCK 125. En sık karşılaşılacak risk |
| Nefret söylemi ve ayrımcılık | TCK 216 |
| Tehdit | TCK 106 |
| Kişisel veri ifşası | KVKK, TCK 136 |
| Halkı yanıltıcı bilgiyi yayma | TCK 217/A. Bildirim gelince değerlendirilir |

---

## 5. İşletme süreçleri ve süreler

| Durum | Ne yapılır | Süre |
|---|---|---|
| **Kişilik hakkı ihlali başvurusu** (içerik kaldırma formu) | İncele, uygunsa kaldır, başvurana bilgi ver, kaydet | **24 saat** |
| **Mahkeme / BTK erişim engeli veya kaldırma kararı** | Uygula, kaydet, gerekirse avukata bildir | Karardaki süre (bazı durumlarda **4 saat**) |
| **Savcılık / emniyet bilgi talebi** | Sadece resmi ve yazılı taleplere, talep edilen kadar veri ver (5651 log çıktısı), kaydet | Talepteki süre |
| **Çocuk istismarı veya hayati tehlike bildirimi** | İçeriği kaldır, kesiti koru, yetkili makamlara ilet (EGM / ihbarweb.org.tr, savcılık) | **Derhal** |
| **KVKK ilgili kişi başvurusu** | Kimliği doğrula, talebi yanıtla | **30 gün** |
| **Veri ihlali** | Etkiyi sınırla, Kurul'a bildir, gerekirse kişilere bildir | **72 saat** |
| **Normal kullanıcı bildirimi** | Moderasyon kuyruğunda incele | Hedef: 24 saat |

Bu süreçlerin her biri için kısa bir yazılı prosedür (kim, ne yapar, nereye kaydeder) hazırlanmalı. Yönetim panelindeki **5651 / adli çıktı** özelliği, resmi taleplere doğru ve hızlı yanıt vermeyi sağlar.

---

## 6. Sonraki aşamalarda ortaya çıkacak yükümlülükler

| Durum | Ek yükümlülük |
|---|---|
| Reklam (ör. Google AdSense) | Reklam çerezleri için açık rıza, aydınlatma metninin güncellenmesi, yurt dışı aktarım değerlendirmesi |
| Ücretli özellik (premium) | Vergi mükellefiyeti, 6502 / Mesafeli Sözleşmeler Yönetmeliği (ön bilgilendirme, mesafeli satış sözleşmesi), 6563 kapsamında ETBİS kaydı |
| Türkiye'den günlük 1 milyonu aşan erişim | 5651 md. Ek 4 "sosyal ağ sağlayıcı" yükümlülükleri (temsilci, raporlama vb.) |
| Telefon ile doğrulama eklenmesi | Telefon numarası işleme, SMS sağlayıcısına aktarım, aydınlatma metninin güncellenmesi |
| Yurt dışı bulut servisine geçiş | KVKK md. 9 aktarım mekanizması |

---

## 7. Avukata sorulacak sorular

1. Platformumuz 5651 kapsamında **yer sağlayıcı** mı, içerik sağlayıcı mı sayılır? BTK'ya yer sağlayıcı bildirimi gerekir mi?
2. Trafik logları için doğru **saklama süresi** ve **saklama biçimi** (bütünlük doğrulaması) nedir?
3. Aydınlatma metnindeki **hukuki sebepler** (sözleşme, hukuki yükümlülük, meşru menfaat) doğru eşleşmiş mi? Açık rıza gereken başka bir işlem var mı?
4. **18 yaş beyanı** yeterli mi, ek bir yaş doğrulama önlemi önerir misiniz?
5. Bildirilen kesitlerin (son 40 mesaj) ve onay kayıtlarının **saklama süreleri** ne olmalı?
6. **Kullanım Koşulları**ndaki sorumluluk sınırlaması geçerli mi?
7. Cloudflare gibi yurt dışı servisler için **md. 9** kapsamında ne yapmamız gerekir?
8. VERBİS kaydı gerekiyor mu?
9. Resmi makamlardan gelen bilgi taleplerine nasıl yanıt vermeliyiz? Hangi belgeyi görmeden veri vermemeliyiz?
10. Şahıs şirketi mi, limited şirket mi daha uygun (sorumluluk açısından)?

---

## 8. Özet: en önemli 10 madde

1. Veri sorumlusunu belirleyin ve künye sayfası yayımlayın.
2. Onay ekranı: 18+, Kullanım Koşulları, Aydınlatma Metni, ayrı çerez tercihi.
3. Mesajları saklamayın (24 saatte silinsin). Sadece bildirilen kesitleri saklayın.
4. 5651 trafik loglarını 1–2 yıl güvenli şekilde tutun.
5. İçerik kaldırma formu kurun, 24 saat içinde yanıtlayın.
6. Özel mesaj, medya ve link olmasın. Kişileri hedef almak yasak olsun.
7. Filtre ve bildirim sistemi, her moderasyon işlemi kayıtlı.
8. Sunucular Türkiye'de olsun.
9. Veri ihlali ve resmi talepler için yazılı prosedür hazırlayın.
10. Yayından önce metinleri ve süreçleri avukata onaylatın.
