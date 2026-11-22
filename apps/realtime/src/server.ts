/**
 * Socket.IO sunucusu: kimlik doğrulama, ban kontrolü, trafik logu ve olayların RoomManager'a bağlanması.
 */
import { createServer, type Server as HttpServer } from "node:http";
import { Server, type Socket } from "socket.io";
import {
  REPORT_REASONS, SESSION_COOKIE, isValidCitySlug,
  type ClientToServer, type ReportReason, type ServerToClient,
} from "@sark/shared";
import { hashIp, readCookie, verifySession } from "@sark/shared/server";
import type { Repo } from "./repo";
import { RoomManager, type Emitter, type SessionInfo } from "./rooms";

interface SocketData {
  session: SessionInfo;
  lobbyCity: string | null;
}

type IO = Server<ClientToServer, ServerToClient, Record<string, never>, SocketData>;
type S = Socket<ClientToServer, ServerToClient, Record<string, never>, SocketData>;

export interface RealtimeOptions {
  repo: Repo;
  sessionSecret: string;
  webOrigins: string[];
  trustProxy?: boolean;
  now?: () => number;
}

export interface Realtime {
  http: HttpServer;
  io: IO;
  manager: RoomManager;
  close(): Promise<void>;
}

const noop = () => {};
const safeAck = <T>(ack: unknown): ((r: T) => void) => (typeof ack === "function" ? (ack as (r: T) => void) : noop);

export function createRealtime(opts: RealtimeOptions): Realtime {
  const http = createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
      return;
    }
    // Şehir seçim ekranı için toplu, kişisel veri içermeyen çevrimiçi sayıları
    if (req.url === "/stats") {
      const origin = req.headers.origin;
      const byCity: Record<string, number> = {};
      for (const city of new Set([...lobbyWatchers.keys(), ...manager.activeCities()])) {
        const n = online(city);
        if (n > 0) byCity[city] = n;
      }
      res.writeHead(200, {
        "content-type": "application/json",
        "cache-control": "no-store",
        ...(origin && opts.webOrigins.includes(origin) ? { "access-control-allow-origin": origin, vary: "Origin" } : {}),
      });
      res.end(JSON.stringify({ total: io.engine.clientsCount, byCity }));
      return;
    }
    res.writeHead(404).end();
  });
  const io: IO = new Server(http, {
    cors: { origin: opts.webOrigins, credentials: true },
    maxHttpBufferSize: 16 * 1024,
    pingInterval: 20000,
  });

  const lobbyWatchers = new Map<string, Set<string>>();
  const pendingLobby = new Map<string, NodeJS.Timeout>();

  const online = (city: string) => new Set([...(lobbyWatchers.get(city) ?? []), ...manager.membersInCity(city)]).size;

  const emitter: Emitter = {
    toRoom(roomId, event, payload, exceptSid) {
      const target = exceptSid ? io.to(`room:${roomId}`).except(`sid:${exceptSid}`) : io.to(`room:${roomId}`);
      (target.emit as (e: string, p: unknown) => void)(event, payload);
    },
    toSid(sid, event, payload) {
      (io.to(`sid:${sid}`).emit as (e: string, p: unknown) => void)(event, payload);
    },
    moveSockets(sid, from, to) {
      if (from) io.in(`sid:${sid}`).socketsLeave(`room:${from}`);
      if (to) io.in(`sid:${sid}`).socketsJoin(`room:${to}`);
    },
    lobbyChanged(city) {
      // Lobi güncellemelerini 400 ms'de bir toplu gönder
      if (pendingLobby.has(city)) return;
      pendingLobby.set(city, setTimeout(() => {
        pendingLobby.delete(city);
        io.to(`lobby:${city}`).emit("lobby:rooms", { city, rooms: manager.listRooms(city), online: online(city) });
      }, 400));
    },
    kick(sid, reason) {
      io.to(`sid:${sid}`).emit("notice", { text: reason });
      setTimeout(() => io.in(`sid:${sid}`).disconnectSockets(true), 50);
    },
  };

  const manager = new RoomManager(emitter, opts.repo, opts.now);
  opts.repo.bannedWords().then((w) => manager.setBannedWords(w)).catch(() => {});

  const clientIp = (socket: S) => {
    const fwd = socket.handshake.headers["x-forwarded-for"];
    if (opts.trustProxy && typeof fwd === "string") return fwd.split(",")[0].trim();
    return socket.handshake.address;
  };

  // Kimlik doğrulama: onay ekranından geçmeden bağlanılamaz
  io.use(async (socket, next) => {
    const token = readCookie(socket.handshake.headers.cookie, SESSION_COOKIE) ?? (socket.handshake.auth?.token as string | undefined);
    const payload = verifySession(token, opts.sessionSecret);
    if (!payload) return next(new Error("consent_required"));
    const ipHash = hashIp(clientIp(socket), opts.sessionSecret);
    try {
      const ban = await opts.repo.findActiveBan(payload.sid, ipHash);
      if (ban) return next(Object.assign(new Error("banned"), { data: { reason: ban.reason, until: ban.until } }));
    } catch (e) {
      console.error("Ban kontrolü başarısız", e);
      return next(new Error("server_error"));
    }
    socket.data.session = { sid: payload.sid, ipHash, iat: payload.iat };
    socket.data.lobbyCity = null;
    next();
  });

  io.on("connection", (socket: S) => {
    const { session } = socket.data;
    const ip = clientIp(socket);
    const port = Number(socket.request.socket.remotePort) || null;
    socket.join(`sid:${session.sid}`);
    opts.repo.logTraffic({ sid: session.sid, ip, port, event: "connect" }).catch((e) => console.error("Trafik logu yazılamadı", e));

    // Aynı oturumun açık bir köşesi varsa yeni sekme de o köşeye bağlanır
    const current = manager.roomOf(session.sid);
    if (current) socket.join(`room:${current}`);

    const watchLobby = (city: string | null) => {
      const prev = socket.data.lobbyCity;
      if (prev) {
        socket.leave(`lobby:${prev}`);
        lobbyWatchers.get(prev)?.delete(session.sid);
        emitter.lobbyChanged(prev);
      }
      socket.data.lobbyCity = city;
      if (city) {
        socket.join(`lobby:${city}`);
        if (!lobbyWatchers.has(city)) lobbyWatchers.set(city, new Set());
        lobbyWatchers.get(city)!.add(session.sid);
        emitter.lobbyChanged(city);
      }
    };

    socket.on("lobby:watch", (p, ack) => {
      const reply = safeAck<Parameters<typeof ack>[0]>(ack);
      if (!isValidCitySlug(p?.city)) return reply({ ok: false, error: "Geçersiz şehir." });
      watchLobby(p.city);
      reply({ ok: true, rooms: manager.listRooms(p.city), online: online(p.city) });
    });

    socket.on("room:join", (p, ack) => safeAck<Parameters<typeof ack>[0]>(ack)(manager.join(session, String(p?.roomId ?? ""))));
    socket.on("room:random", (p, ack) =>
      safeAck<Parameters<typeof ack>[0]>(ack)(manager.random(session, String(p?.city ?? ""), p?.excludeRoomId ? String(p.excludeRoomId) : undefined)),
    );
    socket.on("room:create", (p, ack) =>
      safeAck<Parameters<typeof ack>[0]>(ack)(manager.create(session, String(p?.city ?? ""), String(p?.title ?? ""), String(p?.category ?? ""))),
    );
    socket.on("room:leave", () => manager.leave(session.sid));
    socket.on("seat:change", (p) => manager.changeSeat(session.sid, Number(p?.seat)));
    socket.on("typing", (p) => manager.typing(session.sid, Boolean(p?.isTyping)));
    socket.on("message:send", async (p, ack) => {
      const reply = safeAck<Parameters<typeof ack>[0]>(ack);
      try {
        reply(await manager.sendMessage(session, String(p?.text ?? ""), p?.replyToId ? String(p.replyToId) : undefined));
      } catch (e) {
        console.error(e);
        reply({ ok: false, error: "Mesaj gönderilemedi." });
      }
    });
    socket.on("tea:offer", (p, ack) => safeAck<Parameters<typeof ack>[0]>(ack)(manager.tea(session.sid, String(p?.to ?? ""))));
    socket.on("report:message", async (p, ack) => {
      const reply = safeAck<Parameters<typeof ack>[0]>(ack);
      const reason = String(p?.reason) as ReportReason;
      if (!(reason in REPORT_REASONS)) return reply({ ok: false, error: "Geçersiz sebep." });
      try {
        reply(await manager.reportMessage(session.sid, String(p?.messageId ?? ""), reason, p?.note ? String(p.note) : undefined));
      } catch (e) {
        console.error(e);
        reply({ ok: false, error: "Bildirim kaydedilemedi, lütfen tekrar dene." });
      }
    });
    socket.on("report:room", async (p, ack) => {
      const reply = safeAck<Parameters<typeof ack>[0]>(ack);
      const reason = String(p?.reason) as ReportReason;
      if (!(reason in REPORT_REASONS)) return reply({ ok: false, error: "Geçersiz sebep." });
      try {
        reply(await manager.reportRoom(session.sid, reason, p?.note ? String(p.note) : undefined));
      } catch (e) {
        console.error(e);
        reply({ ok: false, error: "Bildirim kaydedilemedi, lütfen tekrar dene." });
      }
    });

    socket.on("disconnect", async () => {
      watchLobby(null);
      opts.repo.logTraffic({ sid: session.sid, ip, port, event: "disconnect" }).catch((e) => console.error("Trafik logu yazılamadı", e));
      // Oturumun başka açık sekmesi yoksa köşeden kalk
      const others = await io.in(`sid:${session.sid}`).fetchSockets();
      if (others.length === 0) manager.leave(session.sid);
    });
  });

  const sweepTimer = setInterval(() => manager.sweep(), 60 * 1000);
  const wordsTimer = setInterval(() => opts.repo.bannedWords().then((w) => manager.setBannedWords(w)).catch(() => {}), 5 * 60 * 1000);

  return {
    http,
    io,
    manager,
    async close() {
      clearInterval(sweepTimer);
      clearInterval(wordsTimer);
      for (const t of pendingLobby.values()) clearTimeout(t);
      await new Promise<void>((r) => io.close(() => r()));
    },
  };
}
