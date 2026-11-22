/**
 * Köşe (oda) yönetimi: minderler, takma adlar, mesajlar, filtre, hız sınırları, bildirimler ve süre dolumu.
 *
 * Bu sınıf soketlerden bağımsızdır; dış dünyaya `Emitter` üzerinden olay gönderir.
 * Tek süreçte bellekte çalışır. Çoklu sunucuya geçerken durum Redis'e taşınacaktır.
 */
import { randomBytes } from "node:crypto";
import {
  ALL_TURKEY_SLUG, AVATAR_COLORS, CATEGORIES, HIDE_MESSAGE_REPORTS, HIDE_ROOM_REPORTS, HISTORY_SIZE,
  MESSAGE_INTERVAL_MS, NEW_SESSION_TOPIC_DELAY_MS, REPORT_REASONS, ROOM_CAPACITY, ROOM_IDLE_MS, ROOM_TTL_MS,
  SKIN_TONES, SNAPSHOT_SIZE, TEA_INTERVAL_MS, defaultTopics, isValidCitySlug, moderateMessage, moderateTopic,
  pickNickname, topicNeedsReview,
  type Ack, type ChatMessage, type Member, type ReportReason, type RoomState, type RoomSummary,
} from "@sark/shared";
import type { Repo } from "./repo";

export interface Emitter {
  toRoom(roomId: string, event: string, payload: unknown, exceptSid?: string): void;
  toSid(sid: string, event: string, payload: unknown): void;
  /** Kişinin tüm soketlerini bir odaya sok / odadan çıkar */
  moveSockets(sid: string, from: string | null, to: string | null): void;
  lobbyChanged(city: string): void;
  kick(sid: string, reason: string): void;
}

export interface SessionInfo {
  sid: string;
  ipHash: string;
  iat: number;
}

interface MemberInternal extends Member {
  sid: string;
  joinedAt: number;
}

interface StoredMessage extends ChatMessage {
  sid: string | null;
}

interface Room {
  id: string;
  rootId: string;
  overflowIndex: number;
  city: string;
  title: string;
  category: string;
  system: boolean;
  createdAt: number;
  expiresAt: number | null;
  lastMessageAt: number | null;
  lastActivityAt: number;
  ownerSid: string | null;
  review: boolean;
  members: Map<string, MemberInternal>;
  messages: StoredMessage[];
  msgReporters: Map<string, Set<string>>;
  roomReporters: Set<string>;
}

interface Limits {
  lastMessageAt: number;
  lastTeaAt: number;
  rejects: number[];
  mutedUntil: number;
  topics: number[];
  reports: number[];
  strikes: number[];
  touchedAt: number;
}

const MAX_STORED_MESSAGES = 200;
const NICKNAME_KEEP_MS = 30 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;

const id = (n = 10) => randomBytes(n).toString("base64url").slice(0, n);

type Result<T = {}> = Ack<T>;
const fail = (error: string, reason?: string): { ok: false; error: string; reason?: string } => ({ ok: false, error, reason });

export class RoomManager {
  private rooms = new Map<string, Room>();
  private citiesSeeded = new Set<string>();
  private sidRoom = new Map<string, string>();
  private keptNicknames = new Map<string, { nickname: string; color: string; skin: string; until: number }>();
  private limits = new Map<string, Limits>();
  private bannedWords: { blockExact: string[]; blockPrefix: string[] } = { blockExact: [], blockPrefix: [] };

  constructor(private emitter: Emitter, private repo: Repo, private now: () => number = Date.now) {}

  setBannedWords(w: { blockExact: string[]; blockPrefix: string[] }) {
    this.bannedWords = w;
  }

  /* ---------------- Sorgular ---------------- */

  ensureCity(city: string) {
    if (this.citiesSeeded.has(city)) return;
    this.citiesSeeded.add(city);
    for (const t of defaultTopics(city)) this.createRoomInternal({ city, title: t.title, category: t.category, system: true, ownerSid: null });
  }

  listRooms(city: string): RoomSummary[] {
    this.ensureCity(city);
    return [...this.rooms.values()]
      .filter((r) => r.city === city && !r.review)
      .sort((a, b) => b.members.size - a.members.size || Number(b.system) - Number(a.system) || b.createdAt - a.createdAt)
      .map((r) => this.summary(r));
  }

  membersInCity(city: string): string[] {
    const out: string[] = [];
    for (const r of this.rooms.values()) if (r.city === city) out.push(...r.members.keys());
    return out;
  }

  activeCities(): string[] {
    return [...new Set([...this.rooms.values()].filter((r) => r.members.size > 0).map((r) => r.city))];
  }

  roomOf(sid: string): string | null {
    return this.sidRoom.get(sid) ?? null;
  }

  cityOfRoom(roomId: string): string | null {
    return this.rooms.get(roomId)?.city ?? null;
  }

  stateFor(sid: string): RoomState | null {
    const room = this.rooms.get(this.sidRoom.get(sid) ?? "");
    const me = room?.members.get(sid);
    if (!room || !me) return null;
    return {
      room: this.summary(room),
      you: this.publicMember(me),
      members: [...room.members.values()].map((m) => this.publicMember(m)),
      messages: room.messages.slice(-HISTORY_SIZE).map((m) => this.publicMessage(m)),
    };
  }

  /* ---------------- Giriş / çıkış ---------------- */

  join(session: SessionInfo, roomId: string): Result<{ state: RoomState }> {
    let room = this.rooms.get(roomId);
    if (!room || room.review) return fail("Bu köşe artık açık değil.");
    if (room.members.has(session.sid)) return { ok: true, state: this.stateFor(session.sid)! };
    if (room.members.size >= ROOM_CAPACITY) room = this.overflowFor(room);
    return this.seat(session, room);
  }

  random(session: SessionInfo, city: string, excludeRoomId?: string): Result<{ state: RoomState }> {
    if (!isValidCitySlug(city)) return fail("Geçersiz şehir.");
    this.ensureCity(city);
    const current = this.sidRoom.get(session.sid);
    const open = [...this.rooms.values()].filter(
      (r) => r.city === city && !r.review && r.members.size < ROOM_CAPACITY && r.id !== excludeRoomId && r.id !== current,
    );
    // Önce en az 2 kişinin oturduğu köşeler, sonra en az 1, sonra herhangi biri
    const pool = [2, 1, 0].map((min) => open.filter((r) => r.members.size >= min)).find((p) => p.length) ?? [];
    let room = pool[Math.floor(Math.random() * pool.length)];
    if (!room) {
      const any = [...this.rooms.values()].find((r) => r.city === city && !r.review && r.system);
      if (!any) return fail("Şu an uygun köşe yok.");
      room = this.overflowFor(any);
    }
    return this.seat(session, room);
  }

  create(session: SessionInfo, city: string, title: string, category: string): Result<{ state: RoomState }> {
    if (!isValidCitySlug(city)) return fail("Geçersiz şehir.");
    if (!(CATEGORIES as readonly string[]).includes(category)) return fail("Geçersiz kategori.");
    const now = this.now();
    if (now - session.iat < NEW_SESSION_TOPIC_DELAY_MS)
      return fail("Yeni katılanlar ilk 5 dakika köşe açamaz. Bu sırada mevcut köşelere oturabilirsin.", "new_session");
    const l = this.limitsFor(session.sid);
    l.topics = l.topics.filter((t) => now - t < DAY);
    if (l.topics.some((t) => now - t < 30 * 60 * 1000)) return fail("30 dakikada en fazla 1 köşe açabilirsin.", "rate_limit");
    if (l.topics.length >= 5) return fail("Bugün en fazla 5 köşe açabilirsin.", "rate_limit");
    const clean = title.trim().replace(/\s+/g, " ");
    const mod = moderateTopic(clean, this.bannedWords);
    if (!mod.ok) return fail(mod.message!, mod.reason);
    l.topics.push(now);
    this.ensureCity(city);
    const room = this.createRoomInternal({ city, title: clean, category, system: false, ownerSid: session.sid });
    room.review = topicNeedsReview(clean);
    const r = this.seat(session, room);
    if (r.ok && room.review) this.emitter.toSid(session.sid, "notice", { text: "Konun inceleniyor. Onaylanana kadar köşe listesinde görünmeyecek." });
    return r;
  }

  leave(sid: string) {
    const roomId = this.sidRoom.get(sid);
    if (!roomId) return;
    const room = this.rooms.get(roomId);
    this.sidRoom.delete(sid);
    this.emitter.moveSockets(sid, roomId, null);
    if (!room) return;
    const m = room.members.get(sid);
    room.members.delete(sid);
    if (m) {
      this.keptNicknames.set(`${room.id}:${sid}`, { nickname: m.nickname, color: m.color, skin: m.skin, until: this.now() + NICKNAME_KEEP_MS });
      this.emitter.toRoom(room.id, "member:left", { nickname: m.nickname });
    }
    room.lastActivityAt = this.now();
    // Taşma köşeleri boşalınca kapanır
    if (room.overflowIndex > 1 && room.members.size === 0) this.rooms.delete(room.id);
    this.emitter.lobbyChanged(room.city);
  }

  changeSeat(sid: string, seat: number) {
    const room = this.currentRoom(sid);
    const me = room?.members.get(sid);
    if (!room || !me) return;
    if (!Number.isInteger(seat) || seat < 0 || seat >= ROOM_CAPACITY) return;
    if ([...room.members.values()].some((m) => m.seat === seat)) return;
    me.seat = seat;
    this.emitter.toRoom(room.id, "member:moved", { nickname: me.nickname, seat });
  }

  /* ---------------- Mesajlar ---------------- */

  async sendMessage(session: SessionInfo, text: string, replyToId?: string): Promise<Result<{ id: string }>> {
    const room = this.currentRoom(session.sid);
    const me = room?.members.get(session.sid);
    if (!room || !me) return fail("Önce bir köşeye otur.");
    const now = this.now();
    const l = this.limitsFor(session.sid);
    if (l.mutedUntil > now) return fail(`Çok sayıda uygunsuz mesaj nedeniyle ${Math.ceil((l.mutedUntil - now) / 60000)} dakika yazamazsın.`, "muted");
    if (now - l.lastMessageAt < MESSAGE_INTERVAL_MS) return fail("Biraz yavaş, mesajlar arasında 2 saniye bekle.", "rate_limit");
    if (typeof text !== "string") return fail("Geçersiz mesaj.");

    const mod = moderateMessage(text, this.bannedWords);
    if (!mod.ok) {
      l.rejects = l.rejects.filter((t) => now - t < 5 * 60 * 1000);
      l.rejects.push(now);
      if (l.rejects.length >= 5) {
        l.mutedUntil = now + 10 * 60 * 1000;
        l.rejects = [];
      }
      return fail(mod.message!, mod.reason);
    }
    l.lastMessageAt = now;

    let replyTo: ChatMessage["replyTo"];
    if (replyToId) {
      const target = room.messages.find((m) => m.id === replyToId && !m.hidden && !m.system);
      if (target) replyTo = { id: target.id, nickname: target.nickname, text: target.text.slice(0, 80) };
    }
    const msg: StoredMessage = { id: id(12), sid: session.sid, nickname: me.nickname, color: me.color, text: text.trim(), ts: now, replyTo };
    this.pushMessage(room, msg);
    room.lastMessageAt = now;
    room.lastActivityAt = now;
    this.emitter.toRoom(room.id, "message:new", this.publicMessage(msg));

    // Reşit olmama veya tehdit ihtimali: mesaj gider ama otomatik olarak moderasyona düşer
    for (const flag of mod.flags) {
      await this.saveReport({
        room, reporterSid: null, reportedSid: session.sid, messageId: msg.id,
        reason: flag === "minor_hint" ? "minor" : "threat", note: "Otomatik işaretleme", auto: true,
      });
    }
    return { ok: true, id: msg.id };
  }

  typing(sid: string, isTyping: boolean) {
    const room = this.currentRoom(sid);
    const me = room?.members.get(sid);
    if (!room || !me) return;
    this.emitter.toRoom(room.id, "typing", { nickname: me.nickname, isTyping: Boolean(isTyping) }, sid);
  }

  tea(sid: string, toNickname: string): Result {
    const room = this.currentRoom(sid);
    const me = room?.members.get(sid);
    if (!room || !me) return fail("Önce bir köşeye otur.");
    const target = [...room.members.values()].find((m) => m.nickname === toNickname);
    if (!target || target.sid === sid) return fail("Bu kişi köşede değil.");
    const l = this.limitsFor(sid);
    const now = this.now();
    if (now - l.lastTeaAt < TEA_INTERVAL_MS) return fail("Çaydanlık daha demleniyor, biraz bekle ☕", "rate_limit");
    l.lastTeaAt = now;
    this.emitter.toRoom(room.id, "tea:offered", { from: me.nickname, to: target.nickname });
    return { ok: true };
  }

  /* ---------------- Bildirimler ---------------- */

  async reportMessage(sid: string, messageId: string, reason: ReportReason, note?: string): Promise<Result> {
    const room = this.currentRoom(sid);
    if (!room) return fail("Önce bir köşeye otur.");
    if (!(reason in REPORT_REASONS)) return fail("Geçersiz sebep.");
    const msg = room.messages.find((m) => m.id === messageId);
    if (!msg || msg.system) return fail("Mesaj bulunamadı.");
    if (msg.sid === sid) return fail("Kendi mesajını bildiremezsin.");
    if (!this.allowReport(sid)) return fail("Çok fazla bildirim gönderdin, biraz sonra tekrar dene.", "rate_limit");

    const reporters = room.msgReporters.get(messageId) ?? new Set<string>();
    if (reporters.has(sid)) return { ok: true };
    reporters.add(sid);
    room.msgReporters.set(messageId, reporters);
    await this.saveReport({ room, reporterSid: sid, reportedSid: msg.sid, messageId, reason, note, auto: false });

    if (!msg.hidden && reporters.size >= HIDE_MESSAGE_REPORTS) {
      this.hide(room, msg);
      if (msg.sid) await this.strike(msg.sid, room);
    }
    return { ok: true };
  }

  async reportRoom(sid: string, reason: ReportReason, note?: string): Promise<Result> {
    const room = this.currentRoom(sid);
    if (!room) return fail("Önce bir köşeye otur.");
    if (!(reason in REPORT_REASONS)) return fail("Geçersiz sebep.");
    if (!this.allowReport(sid)) return fail("Çok fazla bildirim gönderdin, biraz sonra tekrar dene.", "rate_limit");
    if (room.roomReporters.has(sid)) return { ok: true };
    room.roomReporters.add(sid);
    await this.saveReport({ room, reporterSid: sid, reportedSid: room.ownerSid, messageId: null, reason, note, auto: false });
    if (!room.system && room.roomReporters.size >= HIDE_ROOM_REPORTS) this.closeRoom(room, "moderation");
    return { ok: true };
  }

  /* ---------------- Süre dolumu ve temizlik ---------------- */

  sweep() {
    const now = this.now();
    for (const room of [...this.rooms.values()]) {
      if (room.system) continue;
      if (room.expiresAt !== null && now >= room.expiresAt) this.closeRoom(room, "expired");
      else if (now - room.lastActivityAt >= ROOM_IDLE_MS) this.closeRoom(room, "idle");
    }
    for (const [k, v] of this.keptNicknames) if (v.until < now) this.keptNicknames.delete(k);
    for (const [k, v] of this.limits) if (now - v.touchedAt > DAY && v.mutedUntil < now) this.limits.delete(k);
    // Sistem köşelerinde eski mesajlar 24 saatten uzun tutulmaz
    for (const room of this.rooms.values()) room.messages = room.messages.filter((m) => now - m.ts < ROOM_TTL_MS);
  }

  /** Moderatör kararıyla bir mesajı gizler. Köşe veya mesaj artık yoksa `false`. */
  hideMessage(roomId: string, messageId: string): boolean {
    const room = this.rooms.get(roomId);
    const msg = room?.messages.find((m) => m.id === messageId && !m.system);
    if (!room || !msg) return false;
    if (!msg.hidden) this.hide(room, msg);
    return true;
  }

  /** Moderatör kararıyla kişiyi köşeden çıkarır ve bağlantısını keser (ban sonrası). */
  kick(sid: string, text: string) {
    this.leave(sid);
    this.emitter.kick(sid, text);
  }

  /** Moderatör kararıyla veya testlerde kullanılır. Köşe yoksa `false`. */
  closeRoom(room: Room | string, reason: "expired" | "idle" | "moderation"): boolean {
    const r = typeof room === "string" ? this.rooms.get(room) : room;
    if (!r) return false;
    this.emitter.toRoom(r.id, "room:closed", { reason });
    for (const sid of [...r.members.keys()]) {
      this.sidRoom.delete(sid);
      this.emitter.moveSockets(sid, r.id, null);
    }
    this.rooms.delete(r.id);
    this.emitter.lobbyChanged(r.city);
    return true;
  }

  /* ---------------- İç yardımcılar ---------------- */

  private createRoomInternal(o: { city: string; title: string; category: string; system: boolean; ownerSid: string | null; root?: Room }): Room {
    const now = this.now();
    const roomId = id();
    const room: Room = {
      id: roomId,
      rootId: o.root?.rootId ?? roomId,
      overflowIndex: 1,
      city: o.city,
      title: o.title,
      category: o.category,
      system: o.system,
      createdAt: now,
      expiresAt: o.system ? null : (o.root?.expiresAt ?? now + ROOM_TTL_MS),
      lastMessageAt: null,
      lastActivityAt: now,
      ownerSid: o.ownerSid,
      review: false,
      members: new Map(),
      messages: [],
      msgReporters: new Map(),
      roomReporters: new Set(),
    };
    this.rooms.set(room.id, room);
    this.emitter.lobbyChanged(o.city);
    return room;
  }

  /** Köşe doluysa aynı konudaki boş bir kardeş köşeyi bulur ya da yenisini açar. */
  private overflowFor(room: Room): Room {
    const siblings = [...this.rooms.values()].filter((r) => r.rootId === room.rootId);
    const free = siblings.find((r) => r.members.size < ROOM_CAPACITY);
    if (free) return free;
    const next = this.createRoomInternal({ city: room.city, title: room.title, category: room.category, system: false, ownerSid: null, root: room });
    next.overflowIndex = Math.max(...siblings.map((r) => r.overflowIndex)) + 1;
    return next;
  }

  private seat(session: SessionInfo, room: Room): Result<{ state: RoomState }> {
    const prev = this.sidRoom.get(session.sid);
    if (prev && prev !== room.id) this.leave(session.sid);

    const taken = new Set([...room.members.values()].map((m) => m.seat));
    const free = Array.from({ length: ROOM_CAPACITY }, (_, i) => i).filter((i) => !taken.has(i));
    if (!free.length) return fail("Köşe dolu.");
    const kept = this.keptNicknames.get(`${room.id}:${session.sid}`);
    const names = [...room.members.values()].map((m) => m.nickname);
    const usedColors = new Set([...room.members.values()].map((m) => m.color));
    const nickname = kept && !names.includes(kept.nickname) ? kept.nickname : pickNickname(room.city === ALL_TURKEY_SLUG ? ALL_TURKEY_SLUG : room.city, names);
    const color = kept && !usedColors.has(kept.color) ? kept.color : (AVATAR_COLORS.find((c) => !usedColors.has(c)) ?? AVATAR_COLORS[0]);
    const member: MemberInternal = {
      sid: session.sid,
      nickname,
      color,
      skin: kept?.skin ?? SKIN_TONES[Math.floor(Math.random() * SKIN_TONES.length)],
      seat: free[Math.floor(Math.random() * free.length)],
      isOwner: room.ownerSid === session.sid,
      joinedAt: this.now(),
    };
    room.members.set(session.sid, member);
    room.lastActivityAt = this.now();
    this.sidRoom.set(session.sid, room.id);
    this.emitter.moveSockets(session.sid, null, room.id);
    this.emitter.toRoom(room.id, "member:joined", this.publicMember(member), session.sid);
    this.emitter.lobbyChanged(room.city);
    return { ok: true, state: this.stateFor(session.sid)! };
  }

  private currentRoom(sid: string): Room | undefined {
    return this.rooms.get(this.sidRoom.get(sid) ?? "");
  }

  /** Mesajı gizler; ona verilen yanıtlardaki alıntıyı da temizler. */
  private hide(room: Room, msg: StoredMessage) {
    msg.hidden = true;
    for (const m of room.messages) if (m.replyTo?.id === msg.id) m.replyTo = { ...m.replyTo, text: "" };
    this.emitter.toRoom(room.id, "message:hidden", { id: msg.id });
  }

  private pushMessage(room: Room, msg: StoredMessage) {
    room.messages.push(msg);
    if (room.messages.length > MAX_STORED_MESSAGES) room.messages.splice(0, room.messages.length - MAX_STORED_MESSAGES);
  }

  private limitsFor(sid: string): Limits {
    let l = this.limits.get(sid);
    if (!l) {
      l = { lastMessageAt: 0, lastTeaAt: 0, rejects: [], mutedUntil: 0, topics: [], reports: [], strikes: [], touchedAt: 0 };
      this.limits.set(sid, l);
    }
    l.touchedAt = this.now();
    return l;
  }

  private allowReport(sid: string): boolean {
    const now = this.now();
    const l = this.limitsFor(sid);
    l.reports = l.reports.filter((t) => now - t < 60 * 60 * 1000);
    if (l.reports.length >= 10) return false;
    l.reports.push(now);
    return true;
  }

  /** Mesajı bildirimlerle gizlenen kişiye kademeli yaptırım: 3. ihlalde 1 saat, 5. ihlalde 24 saat ban. */
  private async strike(sid: string, room: Room) {
    const now = this.now();
    const l = this.limitsFor(sid);
    l.strikes = l.strikes.filter((t) => now - t < DAY);
    l.strikes.push(now);
    const n = l.strikes.length;
    if (n === 3 || n >= 5) {
      const hours = n >= 5 ? 24 : 1;
      await this.repo.addBan({ sid, ipHash: null, reason: `Otomatik: 24 saatte ${n} mesajı bildirimlerle gizlendi (${room.city})`, until: new Date(now + hours * 3600000), createdBy: "system" });
      this.emitter.kick(sid, `Topluluk kurallarını ihlal eden mesajlar nedeniyle ${hours} saat uzaklaştırıldın.`);
      this.leave(sid);
    }
  }

  private async saveReport(o: { room: Room; reporterSid: string | null; reportedSid: string | null; messageId: string | null; reason: ReportReason; note?: string; auto: boolean }) {
    const snapshot = o.room.messages.slice(-SNAPSHOT_SIZE).map((m) => ({ id: m.id, sid: m.sid, nickname: m.nickname, text: m.text, ts: m.ts, hidden: Boolean(m.hidden) }));
    await this.repo.createReport({
      roomId: o.room.id,
      city: o.room.city,
      roomTitle: o.room.title,
      reporterSid: o.reporterSid,
      reportedSid: o.reportedSid,
      messageId: o.messageId,
      reason: o.reason,
      note: o.note?.slice(0, 300) ?? null,
      auto: o.auto,
      priority: o.reason === "minor" || o.reason === "threat" ? "high" : "normal",
      snapshot,
    });
  }

  private summary(r: Room): RoomSummary {
    return {
      id: r.id,
      city: r.city,
      title: r.overflowIndex > 1 ? `${r.title} · ${r.overflowIndex}. köşe` : r.title,
      category: r.category,
      count: r.members.size,
      capacity: ROOM_CAPACITY,
      system: r.system,
      expiresAt: r.expiresAt,
      lastMessageAt: r.lastMessageAt,
    };
  }

  private publicMember(m: MemberInternal): Member {
    return { nickname: m.nickname, color: m.color, skin: m.skin, seat: m.seat, isOwner: m.isOwner };
  }

  private publicMessage(m: StoredMessage): ChatMessage {
    const { sid: _sid, ...rest } = m;
    return m.hidden ? { ...rest, text: "" } : rest;
  }
}
