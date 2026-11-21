/**
 * Sadece sunucuda (Node.js) kullanılacak yardımcılar. Tarayıcı koduna import edilmemelidir.
 */
import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { PRIVACY_VERSION, TERMS_VERSION } from "../constants";

export interface SessionPayload {
  /** Oturum kimliği (rastgele, kişiyi tanımlamaz) */
  sid: string;
  /** Onaylanan Kullanım Koşulları sürümü */
  tv: string;
  /** Onaylanan Aydınlatma Metni sürümü */
  pv: string;
  /** 18 yaş beyanı */
  age: true;
  /** Oluşturulma zamanı (ms) */
  iat: number;
}

/** Oturum token'ının geçerlilik süresi: 30 gün. Sonra onay yeniden alınır. */
export const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

const b64 = (buf: Buffer | string) => Buffer.from(buf).toString("base64url");

function requireSecret(secret: string | undefined): string {
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET en az 32 karakter olmalı.");
  return secret;
}

export function newSessionId(): string {
  return randomBytes(16).toString("hex");
}

export function signSession(payload: SessionPayload, secret: string | undefined): string {
  const body = b64(JSON.stringify(payload));
  const sig = b64(createHmac("sha256", requireSecret(secret)).update(body).digest());
  return `${body}.${sig}`;
}

/** Token geçerliyse ve güncel metin sürümleriyle onaylanmışsa içeriğini döndürür. */
export function verifySession(token: string | undefined, secret: string | undefined, now = Date.now()): SessionPayload | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", requireSecret(secret)).update(body).digest();
  const given = Buffer.from(sig, "base64url");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (p.age !== true || p.tv !== TERMS_VERSION || p.pv !== PRIVACY_VERSION) return null;
    if (typeof p.iat !== "number" || now - p.iat > SESSION_MAX_AGE_MS) return null;
    if (typeof p.sid !== "string" || !/^[a-f0-9]{32}$/.test(p.sid)) return null;
    return p;
  } catch {
    return null;
  }
}

/** Çerez başlığından tek bir çerezi okur. */
export function readCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return undefined;
}

/** IP adresinin tek yönlü özeti (ban eşleştirme ve onay kayıtları için). */
export function hashIp(ip: string, secret: string | undefined): string {
  return createHmac("sha256", requireSecret(secret)).update(`ip:${ip}`).digest("hex");
}

/** 5651 trafik logları için IP adresini şifreler (AES-256-GCM). */
export function encryptIp(ip: string, keyHex: string | undefined): string {
  const key = Buffer.from(keyHex ?? "", "hex");
  if (key.length !== 32) throw new Error("IP_ENCRYPTION_KEY 32 baytlık hex olmalı.");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(ip, "utf8"), cipher.final()]);
  return `${iv.toString("base64")}.${cipher.getAuthTag().toString("base64")}.${enc.toString("base64")}`;
}

/** Yalnızca resmi talep üzerine, yetkili kişilerce kullanılır. */
export function decryptIp(value: string, keyHex: string | undefined): string {
  const key = Buffer.from(keyHex ?? "", "hex");
  const [iv, tag, enc] = value.split(".").map((p) => Buffer.from(p, "base64"));
  const d = createDecipheriv("aes-256-gcm", key, iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]).toString("utf8");
}
