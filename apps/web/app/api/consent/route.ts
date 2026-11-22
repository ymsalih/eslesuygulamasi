import { NextResponse } from "next/server";
import { PRIVACY_VERSION, SESSION_COOKIE, TERMS_VERSION } from "@sark/shared";
import { SESSION_MAX_AGE_MS, hashIp, newSessionId, signSession } from "@sark/shared/server";
import { clientIp, db } from "@/lib/db";
import { sessionSecret } from "@/lib/secret";

export const runtime = "nodejs";

function cookieOptions(maxAgeSec: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSec,
    // Üretimde web ve gerçek zamanlı sunucu alt alan adlarında: ör. ".sarkkosesi.com"
    ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {}),
  };
}

/** Onay: 18 yaş beyanı + Kullanım Koşulları + Aydınlatma Metni (zorunlu), analitik çerez (isteğe bağlı). */
export async function POST(req: Request) {
  const secret = sessionSecret();
  if (!secret || secret.length < 32) {
    console.error("SESSION_SECRET bulunamadı: proje klasöründe .env dosyası olmalı (bkz. .env.example).");
    return NextResponse.json({ error: "Sunucu yapılandırması eksik (SESSION_SECRET). Proje klasöründe .env dosyası olmalı." }, { status: 500 });
  }
  const body = (await req.json().catch(() => null)) as { age?: unknown; terms?: unknown; privacy?: unknown; analytics?: unknown } | null;
  if (!body || body.age !== true || body.terms !== true || body.privacy !== true) {
    return NextResponse.json({ error: "Devam etmek için zorunlu onayları vermelisin." }, { status: 400 });
  }
  const sid = newSessionId();
  const iat = Date.now();
  const analytics = body.analytics === true;
  const pool = db();
  if (pool) {
    try {
      await pool.query(
        `INSERT INTO consent_records (session_id, terms_version, privacy_version, age_confirmed, analytics_consent, ip_hash, user_agent)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [sid, TERMS_VERSION, PRIVACY_VERSION, true, analytics, hashIp(clientIp(req.headers), secret), req.headers.get("user-agent")?.slice(0, 300) ?? null],
      );
    } catch (e) {
      console.error("Onay kaydı yazılamadı", e);
      return NextResponse.json({ error: "Şu an onay kaydedilemedi, lütfen tekrar dene." }, { status: 503 });
    }
  } else {
    console.warn("UYARI: DATABASE_URL yok, onay kaydı veritabanına yazılmadı (sadece geliştirme).");
  }
  const token = signSession({ sid, tv: TERMS_VERSION, pv: PRIVACY_VERSION, age: true, iat }, secret);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, cookieOptions(Math.floor(SESSION_MAX_AGE_MS / 1000)));
  res.cookies.set("sk_analytics", analytics ? "1" : "0", { ...cookieOptions(Math.floor(SESSION_MAX_AGE_MS / 1000)), httpOnly: false });
  return res;
}

/** Oturumu kapat / onayı geri al: çerezler silinir. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", cookieOptions(0));
  res.cookies.set("sk_analytics", "", { ...cookieOptions(0), httpOnly: false });
  return res;
}
