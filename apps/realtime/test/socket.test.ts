import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AddressInfo } from "node:net";
import { io as connect, type Socket } from "socket.io-client";
import { PRIVACY_VERSION, SESSION_COOKIE, TERMS_VERSION } from "@sark/shared";
import { newSessionId, signSession } from "@sark/shared/server";
import { MemoryRepo } from "../src/repo";
import { createRealtime, type Realtime } from "../src/server";

const SECRET = "integration-secret-integration-secret-123";
let rt: Realtime;
let url: string;
const repo = new MemoryRepo();
const sockets: Socket[] = [];

function client(token?: string): Socket {
  const s = connect(url, {
    transports: ["websocket"],
    extraHeaders: token ? { cookie: `${SESSION_COOKIE}=${token}` } : {},
    reconnection: false,
  });
  sockets.push(s);
  return s;
}
const token = (age = 60 * 60 * 1000) => signSession({ sid: newSessionId(), tv: TERMS_VERSION, pv: PRIVACY_VERSION, age: true, iat: Date.now() - age }, SECRET);
const call = <T = any>(s: Socket, ev: string, p: unknown) => new Promise<T>((r) => s.emit(ev, p, r));
const once = <T = any>(s: Socket, ev: string) => new Promise<T>((r) => s.once(ev, r));
const connected = (s: Socket) => new Promise<void>((res, rej) => { s.once("connect", () => res()); s.once("connect_error", rej); });

beforeAll(async () => {
  rt = createRealtime({ repo, sessionSecret: SECRET, webOrigins: ["http://localhost:3000"] });
  await new Promise<void>((r) => rt.http.listen(0, r));
  url = `http://localhost:${(rt.http.address() as AddressInfo).port}`;
});
afterAll(async () => {
  sockets.forEach((s) => s.disconnect());
  await rt.close();
});

describe("gerçek zamanlı sunucu", () => {
  it("onay token'ı olmadan bağlantı reddedilir", async () => {
    await expect(connected(client())).rejects.toThrow("consent_required");
  });

  it("iki kişi aynı köşede sohbet eder", async () => {
    const a = client(token());
    const b = client(token());
    await Promise.all([connected(a), connected(b)]);

    const lobby = await call(a, "lobby:watch", { city: "izmir" });
    expect(lobby.ok).toBe(true);
    const roomId = lobby.rooms[0].id;

    const ja = await call(a, "room:join", { roomId });
    const joinedEvent = once(a, "member:joined");
    const jb = await call(b, "room:join", { roomId });
    expect(ja.ok && jb.ok).toBe(true);
    expect((await joinedEvent).nickname).toBe(jb.state.you.nickname);
    expect(jb.state.members).toHaveLength(2);

    const got = once(b, "message:new");
    const sent = await call(a, "message:send", { text: "Selam, Kordon'a giden var mı?", clientId: "1" });
    expect(sent.ok).toBe(true);
    const msg = await got;
    expect(msg).toMatchObject({ text: "Selam, Kordon'a giden var mı?", nickname: ja.state.you.nickname });
    expect(msg).not.toHaveProperty("sid");

    const rejected = await call(b, "message:send", { text: "salak", clientId: "2" });
    expect(rejected).toMatchObject({ ok: false, reason: "profanity" });

    const tea = once(a, "tea:offered");
    expect(await call(b, "tea:offer", { to: ja.state.you.nickname })).toMatchObject({ ok: true });
    expect(await tea).toEqual({ from: jb.state.you.nickname, to: ja.state.you.nickname });

    const lobbyUpdate = await once<any>(a, "lobby:rooms");
    expect(lobbyUpdate.rooms.find((r: any) => r.id === roomId).count).toBe(2);

    expect(repo.traffic.length).toBeGreaterThanOrEqual(2);
  });

  it("banlı oturum bağlanamaz", async () => {
    const t = token();
    const sid = JSON.parse(Buffer.from(t.split(".")[0], "base64url").toString()).sid;
    await repo.addBan({ sid, ipHash: null, reason: "test", until: new Date(Date.now() + 60000), createdBy: "test" });
    await expect(connected(client(t))).rejects.toThrow("banned");
  });
});
