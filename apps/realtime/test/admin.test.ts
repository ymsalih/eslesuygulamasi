import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AddressInfo } from "node:net";
import { io as connect, type Socket } from "socket.io-client";
import { PRIVACY_VERSION, SESSION_COOKIE, TERMS_VERSION } from "@sark/shared";
import { newSessionId, realtimeAdminKey, signSession } from "@sark/shared/server";
import { MemoryRepo } from "../src/repo";
import { createRealtime, type Realtime } from "../src/server";

const SECRET = "integration-secret-integration-secret-123";
const ADMIN_SECRET = "yonetim-test-anahtari-yonetim-test-anahtari";
const repo = new MemoryRepo();
let rt: Realtime;
let noAdmin: Realtime;
let url: string;
let noAdminUrl: string;
const sockets: Socket[] = [];

const newSid = () => newSessionId();
const token = (sid = newSid()) => signSession({ sid, tv: TERMS_VERSION, pv: PRIVACY_VERSION, age: true, iat: Date.now() - 3600000 }, SECRET);
function client(t: string): Socket {
  const s = connect(url, { transports: ["websocket"], extraHeaders: { cookie: `${SESSION_COOKIE}=${t}` }, reconnection: false });
  sockets.push(s);
  return s;
}
const call = <T = any>(s: Socket, ev: string, p: unknown) => new Promise<T>((r) => s.emit(ev, p, r));
const once = <T = any>(s: Socket, ev: string) => new Promise<T>((r) => s.once(ev, r));
const connected = (s: Socket) => new Promise<void>((res, rej) => { s.once("connect", () => res()); s.once("connect_error", rej); });

const admin = (body: unknown, key: string | null = realtimeAdminKey(ADMIN_SECRET), base = () => url) =>
  fetch(`${base()}/internal/admin`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(key ? { "x-admin-key": key } : {}) },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

beforeAll(async () => {
  rt = createRealtime({ repo, sessionSecret: SECRET, webOrigins: ["http://localhost:3000"], adminSecret: ADMIN_SECRET });
  noAdmin = createRealtime({ repo, sessionSecret: SECRET, webOrigins: ["http://localhost:3000"] });
  await new Promise<void>((r) => rt.http.listen(0, r));
  await new Promise<void>((r) => noAdmin.http.listen(0, r));
  url = `http://localhost:${(rt.http.address() as AddressInfo).port}`;
  noAdminUrl = `http://localhost:${(noAdmin.http.address() as AddressInfo).port}`;
});
afterAll(async () => {
  sockets.forEach((s) => s.disconnect());
  await rt.close();
  await noAdmin.close();
});

describe("yönetim paneli iç uç noktası", () => {
  it("anahtarsız veya yanlış anahtarla reddedilir", async () => {
    expect((await admin({ action: "reload_words" }, null)).status).toBe(401);
    expect((await admin({ action: "reload_words" }, realtimeAdminKey(ADMIN_SECRET + "x"))).status).toBe(401);
    expect((await fetch(`${url}/internal/admin`)).status).toBe(405);
  });

  it("ADMIN_SECRET yoksa uç nokta kapalıdır", async () => {
    expect((await admin({ action: "reload_words" }, realtimeAdminKey(ADMIN_SECRET), () => noAdminUrl)).status).toBe(404);
  });

  it("geçersiz komutlar reddedilir", async () => {
    expect((await admin("{bozuk")).status).toBe(400);
    expect((await admin({ action: "drop_tables" })).status).toBe(400);
    expect((await admin({ action: "hide_message", roomId: "../x", messageId: "a" })).status).toBe(400);
    expect((await admin({ action: "kick", sid: "kisa" })).status).toBe(400);
  });

  it("mesaj gizlenir, köşe kapatılır, kişi çıkarılır", async () => {
    const sidA = newSid();
    const a = client(token(sidA));
    const b = client(token());
    await Promise.all([connected(a), connected(b)]);
    const lobby = await call(a, "lobby:watch", { city: "erzurum" });
    const roomId = lobby.rooms[0].id;
    await call(a, "room:join", { roomId });
    await call(b, "room:join", { roomId });
    const got = once<any>(b, "message:new");
    const sent = await call(a, "message:send", { text: "Cağ kebabı nerede yenir?" });
    expect(sent.ok).toBe(true);
    await got;

    // Mesajı gizle: köşedekiler "message:hidden" alır
    const hidden = once<any>(b, "message:hidden");
    const r1 = await admin({ action: "hide_message", roomId, messageId: sent.id });
    expect(await r1.json()).toEqual({ ok: true, found: true });
    expect(await hidden).toEqual({ id: sent.id });
    expect(await (await admin({ action: "hide_message", roomId, messageId: "yokboylebir" })).json()).toEqual({ ok: true, found: false });

    // Kişiyi çıkar: bağlantısı kesilir
    const kicked = once<any>(a, "notice");
    const gone = once(a, "disconnect");
    expect(await (await admin({ action: "kick", sid: sidA, text: "Test için uzaklaştırıldın." })).json()).toEqual({ ok: true, found: true });
    expect((await kicked).text).toBe("Test için uzaklaştırıldın.");
    await gone;

    // Köşeyi kapat
    const closed = once<any>(b, "room:closed");
    expect(await (await admin({ action: "close_room", roomId })).json()).toEqual({ ok: true, found: true });
    expect(await closed).toEqual({ reason: "moderation" });
    expect(await (await admin({ action: "close_room", roomId })).json()).toEqual({ ok: true, found: false });
  });

  it("yasaklı kelimeleri hemen yeniden okur", async () => {
    const s = client(token());
    await connected(s);
    const lobby = await call(s, "lobby:watch", { city: "sivas" });
    await call(s, "room:join", { roomId: lobby.rooms[0].id });
    repo.words = { blockExact: [], blockPrefix: ["kangalsiz"] };
    expect(await (await admin({ action: "reload_words" })).json()).toEqual({ ok: true, found: true });
    expect(await call(s, "message:send", { text: "kangalsizlar burada mı" })).toMatchObject({ ok: false, reason: "profanity" });
  });
});
