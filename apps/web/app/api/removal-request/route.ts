import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";

const str = (v: unknown, max: number) => (typeof v === "string" && v.trim() && v.length <= max ? v.trim() : null);

/** 5651 md. 9: kişilik hakkı ihlali nedeniyle içerik kaldırma talebi. */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const name = str(b?.name, 120), contact = str(b?.contact, 200), contentRef = str(b?.contentRef, 500), description = str(b?.description, 3000);
  if (!name || !contact || !contentRef || !description) return NextResponse.json({ error: "Lütfen tüm alanları doldur." }, { status: 400 });
  const pool = db();
  if (!pool) {
    console.warn("UYARI: DATABASE_URL yok, içerik kaldırma talebi kaydedilemedi (geliştirme).", { contentRef });
    return NextResponse.json({ ok: true });
  }
  try {
    await pool.query("INSERT INTO removal_requests (name, contact, content_ref, description) VALUES ($1,$2,$3,$4)", [name, contact, contentRef, description]);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("İçerik kaldırma talebi kaydedilemedi", e);
    return NextResponse.json({ error: "Şu an kaydedilemedi, lütfen tekrar dene." }, { status: 503 });
  }
}
