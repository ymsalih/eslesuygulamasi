"use server";
/**
 * Yönetim paneli işlemleri (sunucuda çalışır). Her işlem önce yönetici girişini kontrol eder,
 * girdileri doğrular ve denetim günlüğüne yazar.
 */
import { headers } from "next/headers";
import { redirect, unstable_rethrow } from "next/navigation";
import {
  BAN_DURATIONS, REMOVAL_OUTCOMES, banExpiry, validateBannedWord, type BanDuration,
} from "@sark/shared";
import { hashIp } from "@sark/shared/server";
import { clientIp } from "@/lib/db";
import { sessionSecret } from "@/lib/secret";
import { login, logout, requireAdmin, getAdmin } from "@/lib/admin/auth";
import { realtimeCommand, type RealtimeResult } from "@/lib/admin/realtime";
import {
  ID_RE, SID_RE, closeReports, getReport, insertBan, ipHashOfSession, logAction, pool, tx,
} from "@/lib/admin/data";

const field = (f: FormData, k: string, max = 500) => String(f.get(k) ?? "").trim().slice(0, max);

function go(path: string, sonuc: string, live?: RealtimeResult | null): never {
  const q = new URLSearchParams({ sonuc });
  if (live && !live.reachable) q.set("canli", "hata");
  else if (live && !live.found) q.set("canli", "yok");
  redirect(`${path}${path.includes("?") ? "&" : "?"}${q}`);
}

/* ---------------- Giriş / çıkış ---------------- */

export async function loginAction(_prev: { error?: string } | undefined, f: FormData): Promise<{ error?: string }> {
  const r = await login(field(f, "kullanici", 100), String(f.get("parola") ?? "").slice(0, 200), clientIp(await headers()));
  if (!r.ok) return { error: r.error };
  const p = pool();
  if (p) await logAction(p, r.username, "login", null).catch((e) => console.error("Giriş kaydı yazılamadı", e));
  redirect("/yonetim?sonuc=giris");
}

export async function logoutAction() {
  const admin = await getAdmin();
  const p = pool();
  if (admin && p) await logAction(p, admin.username, "logout", null).catch(() => {});
  await logout();
  redirect("/yonetim/giris");
}

/* ---------------- Bildirimler ---------------- */

const VIEWS = new Set(["open", "legal_hold", "closed"]);

export async function reportAction(f: FormData) {
  const admin = await requireAdmin();
  const id = field(f, "id", 20);
  const op = field(f, "islem", 20);
  const view = VIEWS.has(field(f, "durum", 20)) ? field(f, "durum", 20) : "open";
  const back = `/yonetim/bildirimler?durum=${view}`;
  if (!ID_RE.test(id)) go(back, "gecersiz");

  let result = "hata";
  let live: RealtimeResult | null = null;
  try {
    // Önce kaydı oku (canlı köşeye ne uygulanacağını bilmek için)
    const report = await tx((c) => getReport(c, id));
    if (!report) go(back, "bulunamadi");

    switch (op) {
      case "dismiss": {
        await tx(async (c) => {
          const ids = await closeReports(c, id, "dismissed", admin.username);
          await logAction(c, admin.username, "report_dismiss", { type: "report", id }, { reports: ids });
        });
        result = "kapatildi";
        break;
      }
      case "hide_message": {
        if (!report.message_id) go(back, "mesaj_yok");
        live = await realtimeCommand({ action: "hide_message", roomId: report.room_id, messageId: report.message_id });
        await tx(async (c) => {
          const ids = await closeReports(c, id, "message_removed", admin.username, { column: "message_id", value: report.message_id! });
          await logAction(c, admin.username, "report_hide_message", { type: "report", id }, {
            reports: ids, roomId: report.room_id, messageId: report.message_id, live: liveLabel(live),
          });
        });
        result = "mesaj_kaldirildi";
        break;
      }
      case "close_room": {
        live = await realtimeCommand({ action: "close_room", roomId: report.room_id });
        await tx(async (c) => {
          const ids = await closeReports(c, id, "room_closed", admin.username, { column: "room_id", value: report.room_id });
          await logAction(c, admin.username, "report_close_room", { type: "report", id }, {
            reports: ids, roomId: report.room_id, city: report.city, live: liveLabel(live),
          });
        });
        result = "kose_kapatildi";
        break;
      }
      case "ban": {
        const sid = report.reported_sid;
        if (!sid) go(back, "oturum_yok");
        const duration = field(f, "sure", 20);
        const until = banExpiry(duration);
        if (until === undefined) go(back, "gecersiz");
        const reason = field(f, "gerekce", 300);
        if (reason.length < 3) go(back, "gerekce_gerekli");
        const withIp = f.get("ip") === "1";
        let ipSkipped = false;
        await tx(async (c) => {
          let ipHash: string | null = null;
          if (withIp) {
            ipHash = await ipHashOfSession(c, sid);
            if (!usableIpHash(ipHash)) { ipHash = null; ipSkipped = true; }
          }
          const banId = await insertBan(c, { sid, ipHash, reason, until, createdBy: admin.username });
          const ids = await closeReports(c, id, `banned:${duration}`, admin.username, { column: "reported_sid", value: sid });
          await logAction(c, admin.username, "report_ban", { type: "report", id }, {
            reports: ids, banId, sessionId: sid, duration, withIp: Boolean(ipHash), reason,
          });
        });
        live = await realtimeCommand({ action: "kick", sid, text: kickText(duration as BanDuration) });
        if (live.reachable) live = { reachable: true, found: true }; // çevrimdışıysa uyarıya gerek yok
        result = ipSkipped ? "ip_kullanilamaz" : "banlandi";
        break;
      }
      case "hold": {
        await tx(async (c) => {
          await c.query("UPDATE reports SET status = 'legal_hold', reviewed_by = $2, reviewed_at = now() WHERE id = $1", [id, admin.username]);
          await logAction(c, admin.username, "report_legal_hold", { type: "report", id }, { reason: field(f, "gerekce", 300) || null });
        });
        result = "saklamaya_alindi";
        break;
      }
      case "release": {
        await tx(async (c) => {
          await c.query(
            `UPDATE reports SET status = CASE WHEN action IS NULL THEN 'open' ELSE 'closed' END, reviewed_by = $2, reviewed_at = now()
             WHERE id = $1 AND status = 'legal_hold'`,
            [id, admin.username],
          );
          await logAction(c, admin.username, "report_release_hold", { type: "report", id });
        });
        result = "saklama_kaldirildi";
        break;
      }
      default:
        go(back, "gecersiz");
    }
  } catch (e) {
    unstable_rethrow(e); // yönlendirmeler hata sayılmaz
    console.error("Bildirim işlemi başarısız", e);
    go(back, "hata");
  }
  go(back, result, live);
}

/* ---------------- Banlar ---------------- */

export async function addBanAction(f: FormData) {
  const admin = await requireAdmin();
  const sid = field(f, "oturum", 64).toLowerCase();
  if (!SID_RE.test(sid)) go("/yonetim/banlar", "gecersiz_oturum");
  const duration = field(f, "sure", 20);
  const until = banExpiry(duration);
  if (until === undefined) go("/yonetim/banlar", "gecersiz");
  const reason = field(f, "gerekce", 300);
  if (reason.length < 3) go("/yonetim/banlar", "gerekce_gerekli");
  let live: RealtimeResult | null = null;
  try {
    await tx(async (c) => {
      const banId = await insertBan(c, { sid, ipHash: null, reason, until, createdBy: admin.username });
      await logAction(c, admin.username, "ban_add", { type: "ban", id: banId }, { sessionId: sid, duration, reason });
    });
    live = await realtimeCommand({ action: "kick", sid, text: kickText(duration as BanDuration) });
    if (live.reachable) live = null;
  } catch (e) {
    console.error("Ban eklenemedi", e);
    go("/yonetim/banlar", "hata");
  }
  go("/yonetim/banlar", "ban_eklendi", live);
}

export async function liftBanAction(f: FormData) {
  const admin = await requireAdmin();
  const id = field(f, "id", 20);
  if (!ID_RE.test(id)) go("/yonetim/banlar", "gecersiz");
  let found = false;
  try {
    await tx(async (c) => {
      const { rowCount } = await c.query(
        `UPDATE bans SET lifted_at = now(), lifted_by = $2, expires_at = now()
         WHERE id = $1 AND lifted_at IS NULL AND (expires_at IS NULL OR expires_at > now())`,
        [id, admin.username],
      );
      found = Boolean(rowCount);
      if (found) await logAction(c, admin.username, "ban_lift", { type: "ban", id }, { note: field(f, "not", 300) || null });
    });
  } catch (e) {
    console.error("Ban kaldırılamadı", e);
    go("/yonetim/banlar", "hata");
  }
  go("/yonetim/banlar", found ? "ban_kaldirildi" : "bulunamadi");
}

/* ---------------- İçerik kaldırma talepleri ---------------- */

export async function resolveRemovalAction(f: FormData) {
  const admin = await requireAdmin();
  const back = "/yonetim/kaldirma-talepleri";
  const id = field(f, "id", 20);
  const outcome = field(f, "sonuc", 20);
  const note = field(f, "not", 2000);
  if (!ID_RE.test(id) || !(outcome in REMOVAL_OUTCOMES)) go(back, "gecersiz");
  if (note.length < 3) go(back, "not_gerekli");
  let found = false;
  try {
    await tx(async (c) => {
      const { rows } = await c.query(
        `UPDATE removal_requests SET status = 'resolved', outcome = $2, resolution_note = $3, resolved_by = $4, resolved_at = now()
         WHERE id = $1 AND status = 'open' RETURNING created_at, resolved_at`,
        [id, outcome, note, admin.username],
      );
      found = rows.length > 0;
      if (found) {
        const hours = (new Date(rows[0].resolved_at).getTime() - new Date(rows[0].created_at).getTime()) / 3600000;
        await logAction(c, admin.username, "removal_resolve", { type: "removal_request", id }, {
          outcome, withinDeadline: hours <= 24, hours: Math.round(hours * 10) / 10,
        });
      }
    });
  } catch (e) {
    console.error("Kaldırma talebi sonuçlandırılamadı", e);
    go(back, "hata");
  }
  go(back, found ? "talep_sonuclandi" : "bulunamadi");
}

/* ---------------- Yasaklı kelimeler ---------------- */

type WordState = { error?: string; ok?: string; kelime?: string; tur?: string };

export async function addWordAction(_prev: WordState | undefined, f: FormData): Promise<WordState> {
  const admin = await requireAdmin();
  const input = { kelime: field(f, "kelime", 100), tur: field(f, "tur", 10) };
  const v = validateBannedWord(input.kelime, input.tur);
  // Hata olursa yazılan kelime formda kalsın
  if (!v.ok) return { error: v.error, ...input };
  try {
    const inserted = await tx(async (c) => {
      const { rows } = await c.query(
        `INSERT INTO banned_words (pattern, kind) VALUES ($1,$2)
         ON CONFLICT (pattern) DO UPDATE SET kind = EXCLUDED.kind RETURNING id, (xmax = 0) AS inserted`,
        [v.pattern, v.kind],
      );
      await logAction(c, admin.username, "word_add", { type: "banned_word", id: String(rows[0].id) }, { pattern: v.pattern, kind: v.kind });
      return Boolean(rows[0].inserted);
    });
    const live = await realtimeCommand({ action: "reload_words" });
    const suffix = live.reachable ? " Sohbet sunucusunda hemen geçerli." : " Sohbet sunucusuna ulaşılamadı; en geç 5 dakika içinde geçerli olur.";
    return { ok: `"${v.pattern}" ${inserted ? "eklendi" : "güncellendi"}.${suffix}` };
  } catch (e) {
    console.error("Kelime eklenemedi", e);
    return { error: "Kelime eklenemedi, tekrar dene.", ...input };
  }
}

export async function deleteWordAction(f: FormData) {
  const admin = await requireAdmin();
  const id = field(f, "id", 20);
  if (!ID_RE.test(id)) go("/yonetim/kelimeler", "gecersiz");
  let found = false;
  try {
    await tx(async (c) => {
      const { rows } = await c.query("DELETE FROM banned_words WHERE id = $1 RETURNING pattern, kind", [id]);
      found = rows.length > 0;
      if (found) await logAction(c, admin.username, "word_delete", { type: "banned_word", id }, { pattern: rows[0].pattern, kind: rows[0].kind });
    });
  } catch (e) {
    console.error("Kelime silinemedi", e);
    go("/yonetim/kelimeler", "hata");
  }
  await realtimeCommand({ action: "reload_words" });
  go("/yonetim/kelimeler", found ? "kelime_silindi" : "bulunamadi");
}

/* ---------------- Yardımcılar ---------------- */

function kickText(duration: BanDuration): string {
  const d = BAN_DURATIONS[duration];
  return d.ms === null
    ? "Topluluk kurallarını ihlal ettiğin için süresiz uzaklaştırıldın."
    : `Topluluk kurallarını ihlal ettiğin için ${d.label} uzaklaştırıldın.`;
}

function liveLabel(r: RealtimeResult | null): string {
  if (!r) return "none";
  if (!r.reachable) return "unreachable";
  return r.found ? "applied" : "not_live";
}

/**
 * IP ile ban sadece gerçek bir IP özetiyle yapılır. Ters vekil (TRUST_PROXY) yokken web sitesi
 * herkesi 0.0.0.0 olarak kaydeder; bu özetle ban herkesi etkileyebileceği için kullanılmaz.
 */
function usableIpHash(h: string | null): h is string {
  if (!h) return false;
  const secret = sessionSecret();
  if (!secret || secret.length < 32) return false;
  return h !== hashIp("0.0.0.0", secret);
}
