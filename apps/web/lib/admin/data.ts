import "server-only";
import type pg from "pg";
import { db } from "@/lib/db";

/**
 * Yönetim panelinin veritabanı işlemleri. Her değişiklik aynı işlem (transaction) içinde
 * denetim günlüğüne (moderation_actions) yazılır: kayıt yazılamazsa değişiklik de yapılmaz.
 */

export const ID_RE = /^\d{1,18}$/;
export const SID_RE = /^[a-f0-9]{32}$/;

export interface SnapshotMessage {
  id: string;
  sid: string | null;
  nickname: string;
  text: string;
  ts: number;
  hidden: boolean;
}

export interface ReportRow {
  id: string;
  room_id: string;
  city: string;
  room_title: string;
  reporter_sid: string | null;
  reported_sid: string | null;
  message_id: string | null;
  reason: string;
  note: string | null;
  auto: boolean;
  priority: string;
  status: string;
  snapshot: SnapshotMessage[];
  reviewed_by: string | null;
  reviewed_at: Date | null;
  action: string | null;
  created_at: Date;
}

export interface BanRow {
  id: string;
  session_id: string | null;
  ip_hash: string | null;
  reason: string;
  expires_at: Date | null;
  created_by: string;
  created_at: Date;
  lifted_at: Date | null;
  lifted_by: string | null;
}

export interface RemovalRow {
  id: string;
  name: string;
  contact: string;
  content_ref: string;
  description: string;
  status: string;
  created_at: Date;
  resolved_at: Date | null;
  outcome: string | null;
  resolution_note: string | null;
  resolved_by: string | null;
}

export interface WordRow {
  id: string;
  pattern: string;
  kind: "exact" | "prefix";
  created_at: Date;
}

export interface AuditRow {
  id: string;
  actor: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown>;
  created_at: Date;
}

/** Veritabanı yoksa null (panel "DATABASE_URL gerekli" uyarısı gösterir). */
export function pool(): pg.Pool | null {
  return db();
}

function requirePool(): pg.Pool {
  const p = db();
  if (!p) throw new Error("DATABASE_URL gerekli");
  return p;
}

/** Tek bir veritabanı işlemi (transaction): ya hepsi yazılır ya hiçbiri. */
export async function tx<T>(fn: (c: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await requirePool().connect();
  try {
    await client.query("BEGIN");
    const out = await fn(client);
    await client.query("COMMIT");
    return out;
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

/** Denetim günlüğüne bir satır yazar. Mesaj içerikleri buraya yazılmaz, sadece kimlikler. */
export async function logAction(
  c: pg.PoolClient | pg.Pool,
  actor: string,
  action: string,
  target: { type: string; id: string | null } | null,
  details: Record<string, unknown> = {},
) {
  await c.query("INSERT INTO moderation_actions (actor, action, target_type, target_id, details) VALUES ($1,$2,$3,$4,$5)", [
    actor, action, target?.type ?? null, target?.id ?? null, JSON.stringify(details),
  ]);
}

/* ---------------- Özet ---------------- */

export async function summary() {
  const { rows } = await requirePool().query(`
    SELECT
      (SELECT count(*) FROM reports WHERE status = 'open')::int AS open_reports,
      (SELECT count(*) FROM reports WHERE status = 'open' AND priority = 'high')::int AS high_reports,
      (SELECT count(*) FROM reports WHERE status = 'legal_hold')::int AS held_reports,
      (SELECT count(*) FROM removal_requests WHERE status = 'open')::int AS open_removals,
      (SELECT count(*) FROM removal_requests WHERE status = 'open' AND created_at < now() - interval '24 hours')::int AS overdue_removals,
      (SELECT count(*) FROM bans WHERE lifted_at IS NULL AND (expires_at IS NULL OR expires_at > now()))::int AS active_bans,
      (SELECT count(*) FROM banned_words)::int AS words`);
  return rows[0] as {
    open_reports: number; high_reports: number; held_reports: number; open_removals: number;
    overdue_removals: number; active_bans: number; words: number;
  };
}

/* ---------------- Bildirimler ---------------- */

export type ReportView = "open" | "legal_hold" | "closed";

/** Önce yüksek öncelik (reşit olmama / tehdit), sonra eskiden yeniye. Kapalılar en yeni önce. */
export async function listReports(view: ReportView, limit = 50): Promise<ReportRow[]> {
  const order = view === "closed" ? "reviewed_at DESC NULLS LAST, id DESC" : "(priority = 'high') DESC, created_at ASC, id ASC";
  const { rows } = await requirePool().query(`SELECT * FROM reports WHERE status = $1 ORDER BY ${order} LIMIT $2`, [view, limit]);
  return rows as ReportRow[];
}

export async function getReport(c: pg.PoolClient, id: string): Promise<ReportRow | null> {
  const { rows } = await c.query("SELECT * FROM reports WHERE id = $1 FOR UPDATE", [id]);
  return (rows[0] as ReportRow) ?? null;
}

/**
 * Bildirimi (ve isteğe bağlı olarak aynı mesaj/köşe/kişi hakkındaki diğer açık bildirimleri) kapatır.
 * Yasal saklamadaki bildirimler saklamada kalır, sadece işlem bilgisi eklenir.
 */
export async function closeReports(
  c: pg.PoolClient,
  mainId: string,
  action: string,
  actor: string,
  related?: { column: "message_id" | "room_id" | "reported_sid"; value: string },
): Promise<string[]> {
  const params: unknown[] = [mainId, action, actor];
  let where = "id = $1";
  if (related) {
    params.push(related.value);
    where += ` OR (status = 'open' AND ${related.column} = $4)`;
  }
  const { rows } = await c.query(
    `UPDATE reports SET status = CASE WHEN status = 'legal_hold' THEN 'legal_hold' ELSE 'closed' END,
       action = $2, reviewed_by = $3, reviewed_at = now()
     WHERE ${where} RETURNING id`,
    params,
  );
  return rows.map((r) => String(r.id));
}

/* ---------------- Banlar ---------------- */

export async function listBans(): Promise<{ active: BanRow[]; ended: BanRow[] }> {
  const p = requirePool();
  const active = await p.query(
    `SELECT * FROM bans WHERE lifted_at IS NULL AND (expires_at IS NULL OR expires_at > now())
     ORDER BY created_at DESC LIMIT 200`,
  );
  const ended = await p.query(
    `SELECT * FROM bans WHERE lifted_at IS NOT NULL OR (expires_at IS NOT NULL AND expires_at <= now())
     ORDER BY COALESCE(lifted_at, expires_at) DESC LIMIT 50`,
  );
  return { active: active.rows as BanRow[], ended: ended.rows as BanRow[] };
}

export async function insertBan(
  c: pg.PoolClient,
  b: { sid: string | null; ipHash: string | null; reason: string; until: Date | null; createdBy: string },
): Promise<string> {
  const { rows } = await c.query(
    "INSERT INTO bans (session_id, ip_hash, reason, expires_at, created_by) VALUES ($1,$2,$3,$4,$5) RETURNING id",
    [b.sid, b.ipHash, b.reason, b.until, b.createdBy],
  );
  return String(rows[0].id);
}

/** Oturumun onay kaydındaki IP özeti (IP ile ban için). */
export async function ipHashOfSession(c: pg.PoolClient, sid: string): Promise<string | null> {
  const { rows } = await c.query("SELECT ip_hash FROM consent_records WHERE session_id = $1 ORDER BY created_at DESC LIMIT 1", [sid]);
  return (rows[0]?.ip_hash as string | undefined) ?? null;
}

/* ---------------- İçerik kaldırma talepleri ---------------- */

export async function listRemovals(): Promise<{ open: RemovalRow[]; resolved: RemovalRow[] }> {
  const p = requirePool();
  const open = await p.query("SELECT * FROM removal_requests WHERE status = 'open' ORDER BY created_at ASC LIMIT 200");
  const resolved = await p.query("SELECT * FROM removal_requests WHERE status <> 'open' ORDER BY resolved_at DESC NULLS LAST LIMIT 50");
  return { open: open.rows as RemovalRow[], resolved: resolved.rows as RemovalRow[] };
}

/* ---------------- Yasaklı kelimeler ---------------- */

export async function listWords(): Promise<WordRow[]> {
  const { rows } = await requirePool().query("SELECT * FROM banned_words ORDER BY pattern ASC");
  return rows as WordRow[];
}

/* ---------------- Denetim günlüğü ---------------- */

export async function listAudit(limit = 200): Promise<AuditRow[]> {
  const { rows } = await requirePool().query("SELECT * FROM moderation_actions ORDER BY created_at DESC, id DESC LIMIT $1", [limit]);
  return rows as AuditRow[];
}
