/** Bir köşedeki minder sayısı. */
export const ROOM_CAPACITY = 10;
/** Kullanıcı köşelerinin en uzun ömrü. */
export const ROOM_TTL_MS = 24 * 60 * 60 * 1000;
/** Bu süre boyunca hiç mesaj gelmezse kullanıcı köşesi kapanır. */
export const ROOM_IDLE_MS = 3 * 60 * 60 * 1000;
/** Odaya girince gösterilen son mesaj sayısı. */
export const HISTORY_SIZE = 50;
/** Bildirim anında saklanan kesit uzunluğu. */
export const SNAPSHOT_SIZE = 40;
/** Bir mesajı otomatik gizlemek için gereken farklı bildirimci sayısı. */
export const HIDE_MESSAGE_REPORTS = 3;
/** Bir köşeyi listeden kaldırmak için gereken farklı bildirimci sayısı. */
export const HIDE_ROOM_REPORTS = 5;
/** Onaydan sonra konu açabilmek için beklenmesi gereken süre. */
export const NEW_SESSION_TOPIC_DELAY_MS = 5 * 60 * 1000;
/** Mesajlar arası en kısa süre. */
export const MESSAGE_INTERVAL_MS = 2000;
/** Çay ikramları arası en kısa süre. */
export const TEA_INTERVAL_MS = 10000;
/** Onay metinlerinin güncel sürümleri. Metin değişince artırılır, kullanıcıdan yeniden onay alınır. */
export const TERMS_VERSION = "2026-11-21";
export const PRIVACY_VERSION = "2026-11-21";
/** Oturum çerezinin adı. */
export const SESSION_COOKIE = "sk_session";

export const REPORT_REASONS = {
  harassment: "Taciz / zorbalık",
  sexual: "Cinsel / müstehcen içerik",
  hate: "Nefret söylemi / ayrımcılık",
  spam: "Spam / reklam / bahis",
  personal: "Bir kişiyi hedef alıyor / kişisel bilgi",
  minor: "Reşit olmadığını düşünüyorum",
  threat: "Tehdit / şiddet",
  other: "Diğer",
} as const;
export type ReportReason = keyof typeof REPORT_REASONS;
