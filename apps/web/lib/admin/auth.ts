import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, ADMIN_SESSION_MS } from "@sark/shared";
import {
  EXAMPLE_ADMIN_PASSWORD, EXAMPLE_ADMIN_SECRET, LoginRateLimiter, passwordFingerprint,
  signAdminToken, verifyAdminPassword, verifyAdminToken,
} from "@sark/shared/server";

export interface AdminConfig {
  username: string;
  passwordHash: string;
  secret: string;
}

const production = () => process.env.NODE_ENV === "production";

/** .env'deki yönetici ayarları. Eksik veya güvensizse Türkçe hata mesajı döner. */
export function adminConfig(): { ok: true; config: AdminConfig } | { ok: false; error: string } {
  const username = process.env.ADMIN_USERNAME?.trim();
  const passwordHash = process.env.ADMIN_PASSWORD_HASH?.trim();
  const secret = process.env.ADMIN_SECRET?.trim();
  if (!username || !passwordHash || !secret) {
    return { ok: false, error: ".env dosyasında ADMIN_USERNAME, ADMIN_PASSWORD_HASH ve ADMIN_SECRET tanımlı olmalı (bkz. .env.example)." };
  }
  if (secret.length < 32) return { ok: false, error: "ADMIN_SECRET en az 32 karakter olmalı." };
  if (!passwordHash.startsWith("scrypt:")) return { ok: false, error: "ADMIN_PASSWORD_HASH geçersiz. Üretmek için: npm run yonetici:parola" };
  if (production() && secret === EXAMPLE_ADMIN_SECRET) {
    return { ok: false, error: "ADMIN_SECRET örnek dosyadaki değer. Canlı sitede `npm run yonetici:parola` ile yenisini üretin." };
  }
  return { ok: true, config: { username, passwordHash, secret } };
}

function cookieOptions(maxAgeSec: number) {
  return {
    httpOnly: true,
    secure: production(),
    // Başka sitelerden gelen isteklerde hiç gönderilmez
    sameSite: "strict" as const,
    // Sadece panel sayfalarına gönderilir; kullanıcı oturum çerezinden (sk_session) ayrıdır
    path: "/yonetim",
    maxAge: maxAgeSec,
  };
}

/** Giriş yapmış yönetici (çerez geçerliyse), değilse null. */
export async function getAdmin(): Promise<{ username: string } | null> {
  // Çerez her zaman önce okunur: böylece panel sayfaları derleme anında sabit sayfa olarak üretilmez,
  // her istekte yeniden çizilir (ayarlar o an eksik olsa bile).
  const jar = await cookies();
  const cfg = adminConfig();
  if (!cfg.ok) return null;
  const p = verifyAdminToken(jar.get(ADMIN_COOKIE)?.value, cfg.config.secret, cfg.config);
  return p ? { username: p.u } : null;
}

/** Sayfalarda ve her işlemde çağrılır: giriş yoksa giriş sayfasına gönderir. */
export async function requireAdmin(): Promise<{ username: string }> {
  const admin = await getAdmin();
  if (!admin) redirect("/yonetim/giris");
  return admin;
}

// Hız sınırı: aynı adresten 15 dakikada 5 yanlış deneme; tüm site için saatte 50 yanlış deneme
const perIp = new LoginRateLimiter(5, 15 * 60 * 1000);
const sitewide = new LoginRateLimiter(50, 60 * 60 * 1000);

export type LoginResult = { ok: true; username: string } | { ok: false; error: string };

/** Kullanıcı adı ve parolayı kontrol eder, doğruysa yönetici çerezini yazar. */
export async function login(username: string, password: string, ip: string): Promise<LoginResult> {
  const cfg = adminConfig();
  if (!cfg.ok) return { ok: false, error: cfg.error };
  for (const [limiter, key] of [[perIp, `ip:${ip}`], [sitewide, "all"]] as const) {
    const c = limiter.check(key);
    if (!c.allowed) return { ok: false, error: `Çok fazla yanlış deneme. ${Math.ceil(c.retryAfterMs / 60000)} dakika sonra tekrar dene.` };
  }
  const { config } = cfg;
  // Kullanıcı adı yanlış olsa da parola özeti hesaplanır (yanıt süresinden bilgi sızmasın)
  const passwordOk = verifyAdminPassword(password, config.passwordHash);
  const userOk = username.trim() === config.username;
  if (!passwordOk || !userOk) {
    perIp.fail(`ip:${ip}`);
    sitewide.fail("all");
    console.warn("Yönetim paneli: başarısız giriş denemesi");
    return { ok: false, error: "Kullanıcı adı veya parola yanlış." };
  }
  if (production() && password === EXAMPLE_ADMIN_PASSWORD) {
    return { ok: false, error: "Örnek parola canlı sitede kullanılamaz. `npm run yonetici:parola` ile yeni parola üretin." };
  }
  perIp.reset(`ip:${ip}`);
  const token = signAdminToken({ u: config.username, iat: Date.now(), pv: passwordFingerprint(config.passwordHash) }, config.secret);
  (await cookies()).set(ADMIN_COOKIE, token, cookieOptions(Math.floor(ADMIN_SESSION_MS / 1000)));
  return { ok: true, username: config.username };
}

export async function logout() {
  (await cookies()).set(ADMIN_COOKIE, "", cookieOptions(0));
}
