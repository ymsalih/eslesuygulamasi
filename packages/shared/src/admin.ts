/**
 * Yönetim paneli için tarayıcıda da çalışabilen saf yardımcılar (veritabanı veya kripto içermez).
 */
import { normalize } from "./moderation";

/** Yönetici çerezinin adı. Kullanıcı oturumundan (`sk_session`) tamamen ayrıdır. */
export const ADMIN_COOKIE = "sk_admin";
/** Yönetici oturumunun geçerlilik süresi: 8 saat. */
export const ADMIN_SESSION_MS = 8 * 60 * 60 * 1000;
/** 5651 md. 9: kişilik hakkı başvuruları 24 saat içinde sonuçlandırılır. */
export const REMOVAL_DEADLINE_MS = 24 * 60 * 60 * 1000;

export const BAN_DURATIONS = {
  "1h": { label: "1 saat", ms: 60 * 60 * 1000 },
  "24h": { label: "24 saat", ms: 24 * 60 * 60 * 1000 },
  "7d": { label: "7 gün", ms: 7 * 24 * 60 * 60 * 1000 },
  "30d": { label: "30 gün", ms: 30 * 24 * 60 * 60 * 1000 },
  permanent: { label: "Süresiz", ms: null },
} as const;
export type BanDuration = keyof typeof BAN_DURATIONS;

/**
 * Seçilen ban süresinin bitiş zamanı. Süresiz ban için `null`, geçersiz seçim için `undefined` döner.
 */
export function banExpiry(duration: string, now = Date.now()): Date | null | undefined {
  if (!Object.prototype.hasOwnProperty.call(BAN_DURATIONS, duration)) return undefined;
  const ms = BAN_DURATIONS[duration as BanDuration].ms;
  return ms === null ? null : new Date(now + ms);
}

/** "2 sa 5 dk", "3 gün 4 sa", "45 dk" gibi kısa Türkçe süre. */
export function formatDuration(ms: number): string {
  const totalMin = Math.max(0, Math.floor(Math.abs(ms) / 60000));
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins = totalMin % 60;
  if (days > 0) return hours ? `${days} gün ${hours} sa` : `${days} gün`;
  if (hours > 0) return mins ? `${hours} sa ${mins} dk` : `${hours} sa`;
  return `${mins} dk`;
}

export interface Deadline {
  dueAt: Date;
  remainingMs: number;
  overdue: boolean;
  /** Son 4 saat: dikkat edilmeli */
  urgent: boolean;
  label: string;
}

/** İçerik kaldırma talebinin 24 saatlik süresi. */
export function removalDeadline(createdAt: Date | string | number, now = Date.now()): Deadline {
  const dueAt = new Date(new Date(createdAt).getTime() + REMOVAL_DEADLINE_MS);
  const remainingMs = dueAt.getTime() - now;
  const overdue = remainingMs <= 0;
  return {
    dueAt,
    remainingMs,
    overdue,
    urgent: !overdue && remainingMs <= 4 * 60 * 60 * 1000,
    label: overdue ? `${formatDuration(remainingMs)} gecikti` : `${formatDuration(remainingMs)} kaldı`,
  };
}

export type BannedWordKind = "exact" | "prefix";

/**
 * Panelden eklenen yasaklı kelimeyi doğrular ve filtrenin kullandığı biçime çevirir.
 * Boş veya çok kısa bir kök ("a" gibi) bütün mesajları engelleyebileceği için reddedilir.
 */
export function validateBannedWord(input: string, kind: string): { ok: true; pattern: string; kind: BannedWordKind } | { ok: false; error: string } {
  if (kind !== "exact" && kind !== "prefix") return { ok: false, error: "Geçersiz eşleşme türü." };
  const raw = String(input ?? "").trim();
  if (!raw) return { ok: false, error: "Kelime boş olamaz." };
  if (raw.length > 40) return { ok: false, error: "Kelime en fazla 40 karakter olabilir." };
  if (/\s/.test(raw)) return { ok: false, error: "Tek kelime gir (boşluk olmadan)." };
  const pattern = normalize(raw);
  // Filtre metni sadece harflere böler (0→o, 1→i gibi rakam hileleri önce harfe çevrilir)
  if (!/^[a-z]+$/.test(pattern)) return { ok: false, error: "Kelime sadece harflerden oluşmalı." };
  const min = kind === "prefix" ? 3 : 2;
  if (pattern.length < min) return { ok: false, error: kind === "prefix" ? "Kök en az 3 harf olmalı (daha kısası masum kelimeleri de engeller)." : "Kelime en az 2 harf olmalı." };
  return { ok: true, pattern, kind };
}

/** Denetim günlüğündeki işlem adlarının Türkçe karşılıkları. */
export const MODERATION_ACTION_LABELS: Record<string, string> = {
  login: "Panele giriş",
  logout: "Panelden çıkış",
  report_dismiss: "Bildirim kapatıldı (işlem yok)",
  report_hide_message: "Mesaj kaldırıldı",
  report_close_room: "Köşe kapatıldı",
  report_ban: "Bildirimden ban",
  report_legal_hold: "Yasal saklamaya alındı",
  report_release_hold: "Yasal saklama kaldırıldı",
  ban_add: "Ban eklendi",
  ban_lift: "Ban kaldırıldı",
  removal_resolve: "Kaldırma talebi sonuçlandı",
  word_add: "Yasaklı kelime eklendi",
  word_delete: "Yasaklı kelime silindi",
};

export const REMOVAL_OUTCOMES = {
  removed: "İçerik kaldırıldı",
  not_found: "İçerik bulunamadı / zaten yok",
  rejected: "Talep reddedildi (ihlal yok)",
} as const;
export type RemovalOutcome = keyof typeof REMOVAL_OUTCOMES;
