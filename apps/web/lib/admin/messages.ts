/** İşlem sonrası sayfanın üstünde gösterilen sabit Türkçe mesajlar (adres çubuğunda sadece kod taşınır). */
export const RESULT_MESSAGES: Record<string, { text: string; kind: "ok" | "warn" | "error" }> = {
  giris: { text: "Hoş geldin. Panele giriş yapıldı.", kind: "ok" },
  kapatildi: { text: "Bildirim kapatıldı (işlem yapılmadı).", kind: "ok" },
  mesaj_kaldirildi: { text: "Mesaj canlı köşeden kaldırıldı, bildirim kapatıldı.", kind: "ok" },
  kose_kapatildi: { text: "Köşe kapatıldı, içindekiler meydana döndü. Bildirim kapatıldı.", kind: "ok" },
  banlandi: { text: "Kullanıcı banlandı ve köşeden çıkarıldı. Bildirim kapatıldı.", kind: "ok" },
  saklamaya_alindi: { text: "Bildirim yasal saklamaya alındı: süre dolsa da silinmeyecek.", kind: "ok" },
  saklama_kaldirildi: { text: "Yasal saklama kaldırıldı.", kind: "ok" },
  ban_eklendi: { text: "Ban eklendi.", kind: "ok" },
  ban_kaldirildi: { text: "Ban kaldırıldı.", kind: "ok" },
  talep_sonuclandi: { text: "Kaldırma talebi sonuçlandırıldı. Başvurana bilgi vermeyi unutma.", kind: "ok" },
  kelime_silindi: { text: "Yasaklı kelime silindi.", kind: "ok" },
  gecersiz: { text: "Geçersiz istek. Sayfayı yenileyip tekrar dene.", kind: "error" },
  bulunamadi: { text: "Kayıt bulunamadı (başka biri işlem yapmış olabilir).", kind: "error" },
  gecersiz_oturum: { text: "Oturum kimliği 32 karakterlik bir kod olmalı (bildirimlerde görünür).", kind: "error" },
  oturum_yok: { text: "Bu bildirimde banlanacak bir kişi yok (sistem köşesi bildirimi).", kind: "error" },
  mesaj_yok: { text: "Bu bildirim bir mesaja değil köşeye ait; mesaj kaldırılamaz.", kind: "error" },
  gerekce_gerekli: { text: "Gerekçe yazmalısın (en az 3 karakter).", kind: "error" },
  not_gerekli: { text: "Sonuç notu yazmalısın (ne yapıldığı, başvurana ne söylendiği).", kind: "error" },
  ip_kullanilamaz: { text: "Bu oturumun IP özeti kullanılamıyor (yerel denemede IP kaydedilmez); sadece oturum banlandı.", kind: "warn" },
  hata: { text: "Bir hata oluştu, işlem yapılmadı. Tekrar dene.", kind: "error" },
};

/** Canlı köşeye uygulama durumu (ikinci bir uyarı satırı). */
export const LIVE_MESSAGES: Record<string, string> = {
  yok: "Köşe veya mesaj artık açık değil (süresi dolmuş ya da kapanmış olabilir). Karar kayda geçti.",
  hata: "Sohbet sunucusuna ulaşılamadı: karar kayda geçti ama canlı köşeye uygulanamadı. Sohbet sunucusu açık mı, ADMIN_SECRET iki tarafta aynı mı?",
};
