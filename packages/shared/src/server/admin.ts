/**
 * Yönetim paneli güvenliği (sadece sunucuda): parola özeti, yönetici çerezi, giriş hız sınırı,
 * web sitesi ile gerçek zamanlı sunucu arasındaki iç anahtar.
 */
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { ADMIN_SESSION_MS } from "../admin";

/** .env.example içindeki örnek parola. Canlı sitede bu parolayla giriş yapılamaz. */
export const EXAMPLE_ADMIN_PASSWORD = "yerel-deneme-parolasi";
/** .env.example içindeki örnek yönetici anahtarı. Canlı sitede kabul edilmez. */
export const EXAMPLE_ADMIN_SECRET = "degistir-beni-yonetici-anahtari-en-az-32-karakter";

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 32 } as const;

/**
 * Parolayı scrypt ile özetler. Biçim: `scrypt:<tuz>:<özet>` (base64url).
 * İki nokta kullanılır çünkü `$` işareti bazı .env okuyucularında değişken sanılır.
 */
export function hashAdminPassword(password: string, salt = randomBytes(16)): string {
  const hash = scryptSync(password.normalize("NFC"), salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return `scrypt:${salt.toString("base64url")}:${hash.toString("base64url")}`;
}

/** Parola özetle eşleşiyor mu (sabit süreli karşılaştırma). Bozuk özet her zaman `false`. */
export function verifyAdminPassword(password: string, stored: string | undefined): boolean {
  const parts = (stored ?? "").trim().split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const salt = Buffer.from(parts[1], "base64url");
  const expected = Buffer.from(parts[2], "base64url");
  if (salt.length < 8 || expected.length !== SCRYPT.keylen) return false;
  const given = scryptSync(String(password).normalize("NFC"), salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return timingSafeEqual(given, expected);
}

/** Aynı ADMIN_SECRET'ten farklı amaçlar için birbirinden bağımsız anahtarlar türetir. */
export function deriveAdminKey(secret: string, purpose: "cookie" | "realtime"): Buffer {
  if (!secret || secret.length < 32) throw new Error("ADMIN_SECRET en az 32 karakter olmalı.");
  return createHmac("sha256", secret).update(`sark-admin:${purpose}`).digest();
}

/** Parola değişince eski yönetici çerezlerinin geçersiz olması için parola özetinin kısa parmak izi. */
export function passwordFingerprint(passwordHash: string): string {
  return createHmac("sha256", "sark-admin-pv").update(passwordHash.trim()).digest("base64url").slice(0, 12);
}

export interface AdminTokenPayload {
  /** Yönetici kullanıcı adı */
  u: string;
  /** Oluşturulma zamanı (ms) */
  iat: number;
  /** Parola parmak izi */
  pv: string;
}

const b64 = (v: string | Buffer) => Buffer.from(v).toString("base64url");

export function signAdminToken(payload: AdminTokenPayload, secret: string): string {
  const body = b64(JSON.stringify({ ...payload, t: "admin" }));
  const sig = b64(createHmac("sha256", deriveAdminKey(secret, "cookie")).update(body).digest());
  return `${body}.${sig}`;
}

/** Çerez geçerliyse içeriğini döndürür: imza, süre (8 saat), kullanıcı adı ve parola sürümü kontrol edilir. */
export function verifyAdminToken(
  token: string | undefined,
  secret: string,
  expected: { username: string; passwordHash: string },
  now = Date.now(),
): AdminTokenPayload | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const want = createHmac("sha256", deriveAdminKey(secret, "cookie")).update(body).digest();
  const given = Buffer.from(sig, "base64url");
  if (given.length !== want.length || !timingSafeEqual(given, want)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as AdminTokenPayload & { t?: string };
    if (p.t !== "admin" || typeof p.u !== "string" || typeof p.iat !== "number" || typeof p.pv !== "string") return null;
    if (p.iat > now + 60_000 || now - p.iat > ADMIN_SESSION_MS) return null;
    if (p.u !== expected.username || p.pv !== passwordFingerprint(expected.passwordHash)) return null;
    return { u: p.u, iat: p.iat, pv: p.pv };
  } catch {
    return null;
  }
}

/** Web sitesinin gerçek zamanlı sunucuya gönderdiği iç anahtar (başlık değeri). */
export function realtimeAdminKey(secret: string): string {
  return deriveAdminKey(secret, "realtime").toString("base64url");
}

/** Gelen iç anahtar doğru mu (sabit süreli). */
export function checkRealtimeAdminKey(given: string | undefined, secret: string | undefined): boolean {
  if (!given || !secret || secret.length < 32) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(realtimeAdminKey(secret));
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Başarısız giriş denemelerini sayan basit hız sınırı (bellek içi, tek süreç).
 * Bir anahtar (ör. IP) pencere içinde `max` kez yanlış girerse pencere dolana kadar kilitlenir.
 */
export class LoginRateLimiter {
  private fails = new Map<string, number[]>();
  constructor(private max: number, private windowMs: number) {}

  /** Denemeye izin var mı; yoksa kaç ms sonra tekrar denenebilir. */
  check(key: string, now = Date.now()): { allowed: true } | { allowed: false; retryAfterMs: number } {
    const list = this.prune(key, now);
    if (list.length < this.max) return { allowed: true };
    return { allowed: false, retryAfterMs: list[0] + this.windowMs - now };
  }

  fail(key: string, now = Date.now()) {
    const list = this.prune(key, now);
    list.push(now);
    this.fails.set(key, list);
    // Bellek şişmesin
    if (this.fails.size > 10_000) for (const k of this.fails.keys()) if (!this.prune(k, now).length) this.fails.delete(k);
  }

  reset(key: string) {
    this.fails.delete(key);
  }

  private prune(key: string, now: number): number[] {
    const list = (this.fails.get(key) ?? []).filter((t) => now - t < this.windowMs);
    if (list.length) this.fails.set(key, list);
    else this.fails.delete(key);
    return list;
  }
}
