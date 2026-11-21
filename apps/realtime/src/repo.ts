/**
 * Kalıcı kayıtlar: trafik logları, bildirimler, banlar, yasaklı kelimeler.
 * Mesaj içerikleri burada saklanmaz (sadece bildirim kesitleri).
 */
import pg from "pg";
import { encryptIp } from "@sark/shared/server";

export interface ReportInput {
  roomId: string;
  city: string;
  roomTitle: string;
  reporterSid: string | null;
  reportedSid: string | null;
  messageId: string | null;
  reason: string;
  note: string | null;
  auto: boolean;
  priority: "normal" | "high";
  snapshot: unknown;
}

export interface BanInput {
  sid: string | null;
  ipHash: string | null;
  reason: string;
  until: Date | null;
  createdBy: string;
}

export interface Repo {
  logTraffic(e: { sid: string; ip: string; port: number | null; event: "connect" | "disconnect" }): Promise<void>;
  createReport(r: ReportInput): Promise<void>;
  findActiveBan(sid: string, ipHash: string): Promise<{ reason: string; until: Date | null } | null>;
  addBan(b: BanInput): Promise<void>;
  bannedWords(): Promise<{ blockExact: string[]; blockPrefix: string[] }>;
  /** Saklama süresi dolan kayıtları siler. */
  purgeExpired(trafficRetentionDays: number): Promise<void>;
  close(): Promise<void>;
}

export class PgRepo implements Repo {
  private pool: pg.Pool;
  constructor(url: string, private ipKey: string | undefined) {
    this.pool = new pg.Pool({ connectionString: url, max: 10 });
  }
  async logTraffic(e: { sid: string; ip: string; port: number | null; event: string }) {
    await this.pool.query("INSERT INTO traffic_logs (session_id, ip_encrypted, port, event) VALUES ($1,$2,$3,$4)", [
      e.sid, encryptIp(e.ip, this.ipKey), e.port, e.event,
    ]);
  }
  async createReport(r: ReportInput) {
    await this.pool.query(
      `INSERT INTO reports (room_id, city, room_title, reporter_sid, reported_sid, message_id, reason, note, auto, priority, snapshot)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [r.roomId, r.city, r.roomTitle, r.reporterSid, r.reportedSid, r.messageId, r.reason, r.note, r.auto, r.priority, JSON.stringify(r.snapshot)],
    );
  }
  async findActiveBan(sid: string, ipHash: string) {
    const { rows } = await this.pool.query(
      `SELECT reason, expires_at FROM bans
       WHERE (session_id = $1 OR ip_hash = $2) AND (expires_at IS NULL OR expires_at > now())
       ORDER BY expires_at DESC NULLS FIRST LIMIT 1`,
      [sid, ipHash],
    );
    return rows[0] ? { reason: rows[0].reason as string, until: rows[0].expires_at as Date | null } : null;
  }
  async addBan(b: BanInput) {
    await this.pool.query("INSERT INTO bans (session_id, ip_hash, reason, expires_at, created_by) VALUES ($1,$2,$3,$4,$5)", [
      b.sid, b.ipHash, b.reason, b.until, b.createdBy,
    ]);
  }
  async bannedWords() {
    const { rows } = await this.pool.query("SELECT pattern, kind FROM banned_words");
    return {
      blockExact: rows.filter((r) => r.kind === "exact").map((r) => r.pattern as string),
      blockPrefix: rows.filter((r) => r.kind === "prefix").map((r) => r.pattern as string),
    };
  }
  async purgeExpired(trafficRetentionDays: number) {
    await this.pool.query("DELETE FROM traffic_logs WHERE created_at < now() - make_interval(days => $1)", [trafficRetentionDays]);
    await this.pool.query("DELETE FROM reports WHERE delete_after < now() AND status <> 'legal_hold'");
  }
  close() {
    return this.pool.end();
  }
}

/** Testler ve veritabanısız geliştirme için bellek içi uygulama. */
export class MemoryRepo implements Repo {
  traffic: unknown[] = [];
  reports: ReportInput[] = [];
  bans: (BanInput & { at: Date })[] = [];
  words = { blockExact: [] as string[], blockPrefix: [] as string[] };
  async logTraffic(e: unknown) { this.traffic.push(e); }
  async createReport(r: ReportInput) { this.reports.push(r); }
  async findActiveBan(sid: string, ipHash: string) {
    const b = this.bans.find((x) => (x.sid === sid || x.ipHash === ipHash) && (!x.until || x.until > new Date()));
    return b ? { reason: b.reason, until: b.until } : null;
  }
  async addBan(b: BanInput) { this.bans.push({ ...b, at: new Date() }); }
  async bannedWords() { return this.words; }
  async purgeExpired() {}
  async close() {}
}
