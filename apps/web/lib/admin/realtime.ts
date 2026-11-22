import "server-only";
import { realtimeAdminKey } from "@sark/shared/server";
import { adminConfig } from "./auth";

export type RealtimeCommand =
  | { action: "hide_message"; roomId: string; messageId: string }
  | { action: "close_room"; roomId: string }
  | { action: "kick"; sid: string; text?: string }
  | { action: "reload_words" };

/** found: köşe/mesaj/kişi sunucuda hâlâ var mıydı. reachable=false ise sunucuya ulaşılamadı. */
export type RealtimeResult = { reachable: true; found: boolean } | { reachable: false; error: string };

function baseUrl() {
  return (process.env.REALTIME_INTERNAL_URL || process.env.NEXT_PUBLIC_REALTIME_URL || "http://localhost:4000").replace(/\/+$/, "");
}

/**
 * Gerçek zamanlı sunucuya yönetici komutu gönderir (canlı köşede mesaj gizle, köşe kapat, kişiyi çıkar).
 * Asıl karar ve doğrulama sunucudadır; bu sadece güvenli bir istektir.
 */
export async function realtimeCommand(cmd: RealtimeCommand): Promise<RealtimeResult> {
  const cfg = adminConfig();
  if (!cfg.ok) return { reachable: false, error: cfg.error };
  try {
    const res = await fetch(`${baseUrl()}/internal/admin`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-admin-key": realtimeAdminKey(cfg.config.secret) },
      body: JSON.stringify(cmd),
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (res.status === 401) return { reachable: false, error: "Sohbet sunucusu anahtarı kabul etmedi (iki tarafta ADMIN_SECRET aynı olmalı)." };
    if (res.status === 404) return { reachable: false, error: "Sohbet sunucusunda yönetim bağlantısı kapalı (ADMIN_SECRET tanımlı değil)." };
    const body = (await res.json().catch(() => null)) as { ok?: boolean; found?: boolean } | null;
    if (!res.ok || !body?.ok) return { reachable: false, error: "Sohbet sunucusu komutu reddetti." };
    return { reachable: true, found: Boolean(body.found) };
  } catch (e) {
    console.error("Sohbet sunucusuna ulaşılamadı", e);
    return { reachable: false, error: "Sohbet sunucusuna ulaşılamadı." };
  }
}
