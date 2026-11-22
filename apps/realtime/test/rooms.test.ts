import { beforeEach, describe, expect, it } from "vitest";
import { ROOM_CAPACITY, ROOM_IDLE_MS, ROOM_TTL_MS, type Ack } from "@sark/shared";
import { MemoryRepo } from "../src/repo";
import { RoomManager, type Emitter, type SessionInfo } from "../src/rooms";

class FakeEmitter implements Emitter {
  events: { to: string; event: string; payload: any }[] = [];
  kicked: string[] = [];
  toRoom(roomId: string, event: string, payload: unknown) { this.events.push({ to: roomId, event, payload }); }
  toSid(sid: string, event: string, payload: unknown) { this.events.push({ to: sid, event, payload }); }
  moveSockets() {}
  lobbyChanged() {}
  kick(sid: string) { this.kicked.push(sid); }
}

let now = 1_000_000_000_000;
const clock = () => now;
const session = (n: number, ageMs = 60 * 60 * 1000): SessionInfo => ({ sid: n.toString(16).padStart(32, "0"), ipHash: `ip${n}`, iat: now - ageMs });

let emitter: FakeEmitter;
let repo: MemoryRepo;
let m: RoomManager;

beforeEach(() => {
  now = 1_000_000_000_000;
  emitter = new FakeEmitter();
  repo = new MemoryRepo();
  m = new RoomManager(emitter, repo, clock);
});

function ok<T>(r: Ack<T>): T {
  if (!r.ok) throw new Error(JSON.stringify(r));
  return r;
}

describe("köşeler", () => {
  it("şehrin hazır köşeleri oluşur", () => {
    const rooms = m.listRooms("izmir");
    expect(rooms.length).toBeGreaterThanOrEqual(4);
    expect(rooms.some((r) => r.title.includes("Kordon"))).toBe(true);
    expect(rooms.every((r) => r.capacity === ROOM_CAPACITY)).toBe(true);
  });

  it("her kişiye farklı minder, takma ad ve renk verilir", () => {
    const room = m.listRooms("trabzon")[0];
    const states = Array.from({ length: ROOM_CAPACITY }, (_, i) => ok(m.join(session(i + 1), room.id)).state);
    const last = states[states.length - 1];
    expect(new Set(last.members.map((x) => x.seat)).size).toBe(ROOM_CAPACITY);
    expect(new Set(last.members.map((x) => x.nickname)).size).toBe(ROOM_CAPACITY);
    expect(new Set(last.members.map((x) => x.color)).size).toBe(ROOM_CAPACITY);
  });

  it("dolu köşeye giren kişi aynı konuda 2. köşeye oturur", () => {
    const room = m.listRooms("izmir")[0];
    for (let i = 1; i <= ROOM_CAPACITY; i++) ok(m.join(session(i), room.id));
    const st = ok(m.join(session(99), room.id)).state;
    expect(st.room.id).not.toBe(room.id);
    expect(st.room.title).toContain("2. köşe");
    // 2. köşe boşalınca kapanır
    m.leave(session(99).sid);
    expect(m.listRooms("izmir").some((r) => r.title.includes("2. köşe"))).toBe(false);
  });

  it("bir kişi aynı anda tek köşede oturur", () => {
    const [a, b] = m.listRooms("ankara");
    ok(m.join(session(1), a.id));
    ok(m.join(session(1), b.id));
    const rooms = m.listRooms("ankara");
    expect(rooms.find((r) => r.id === a.id)!.count).toBe(0);
    expect(rooms.find((r) => r.id === b.id)!.count).toBe(1);
  });

  it("rastgele köşe, içinde en az 2 kişi olan köşeyi tercih eder", () => {
    const rooms = m.listRooms("nevsehir");
    const target = rooms[2];
    ok(m.join(session(1), target.id));
    ok(m.join(session(2), target.id));
    for (let i = 0; i < 10; i++) {
      const st = ok(m.random(session(100 + i), "nevsehir")).state;
      expect(st.room.id).toBe(target.id);
      m.leave(session(100 + i).sid);
    }
  });

  it("odadan çıkıp dönen kişi aynı takma adı geri alır", () => {
    const room = m.listRooms("izmir")[0];
    const first = ok(m.join(session(1), room.id)).state.you.nickname;
    m.leave(session(1).sid);
    const again = ok(m.join(session(1), room.id)).state.you.nickname;
    expect(again).toBe(first);
  });

  it("boş minderde yer değiştirilebilir, dolu mindere geçilemez", () => {
    const room = m.listRooms("izmir")[0];
    const a = ok(m.join(session(1), room.id)).state.you;
    const b = ok(m.join(session(2), room.id)).state.you;
    m.changeSeat(session(1).sid, b.seat);
    expect(m.stateFor(session(1).sid)!.you.seat).toBe(a.seat);
    const free = [...Array(ROOM_CAPACITY).keys()].find((i) => i !== a.seat && i !== b.seat)!;
    m.changeSeat(session(1).sid, free);
    expect(m.stateFor(session(1).sid)!.you.seat).toBe(free);
  });
});

describe("konu açma", () => {
  it("yeni oturum ilk 5 dakika köşe açamaz", () => {
    const r = m.create(session(1, 60 * 1000), "izmir", "Bu akşam ne yapıyoruz?", "💬 Muhabbet");
    expect(r).toMatchObject({ ok: false, reason: "new_session" });
  });
  it("uygunsuz başlık reddedilir, uygun başlık köşe açar", () => {
    expect(m.create(session(1), "izmir", "salak başlık deneme", "💬 Muhabbet")).toMatchObject({ ok: false, reason: "profanity" });
    const st = ok(m.create(session(1), "izmir", "Bu akşam ne yapıyoruz?", "💬 Muhabbet")).state;
    expect(st.you.isOwner).toBe(true);
    expect(m.listRooms("izmir").some((r) => r.id === st.room.id)).toBe(true);
  });
  it("30 dakikada 1 köşe sınırı", () => {
    ok(m.create(session(1), "izmir", "Birinci konu burada", "💬 Muhabbet"));
    expect(m.create(session(1), "izmir", "İkinci konu burada", "💬 Muhabbet")).toMatchObject({ ok: false, reason: "rate_limit" });
  });
  it("kişiyi hedef alan başlık listede görünmez (incelemede)", () => {
    const st = ok(m.create(session(1), "izmir", "Ayşe Yılmaz adlı garson hakkında", "📰 Gündem")).state;
    expect(m.listRooms("izmir").some((r) => r.id === st.room.id)).toBe(false);
  });
  it("kullanıcı köşesi 24 saat sonra veya 3 saat sessizlikte kapanır, sistem köşeleri kalır", () => {
    const st = ok(m.create(session(1), "izmir", "Süreli bir konu burada", "💬 Muhabbet")).state;
    now += ROOM_IDLE_MS + 1;
    m.sweep();
    expect(m.listRooms("izmir").some((r) => r.id === st.room.id)).toBe(false);
    expect(emitter.events.some((e) => e.event === "room:closed" && e.payload.reason === "idle")).toBe(true);
    expect(m.listRooms("izmir").filter((r) => r.system).length).toBeGreaterThanOrEqual(4);
    expect(ROOM_TTL_MS).toBe(24 * 3600 * 1000);
  });
});

describe("mesajlar", () => {
  it("mesaj gönderilir, filtreye takılan gönderilmez", async () => {
    const room = m.listRooms("izmir")[0];
    ok(m.join(session(1), room.id));
    expect(await m.sendMessage(session(1), "Merhaba herkese")).toMatchObject({ ok: true });
    now += 3000;
    expect(await m.sendMessage(session(1), "0532 123 45 67 ara")).toMatchObject({ ok: false, reason: "personal_info" });
    const st = m.stateFor(session(1).sid)!;
    expect(st.messages.map((x) => x.text)).toEqual(["Merhaba herkese"]);
  });
  it("2 saniyeden hızlı mesaj reddedilir", async () => {
    const room = m.listRooms("izmir")[0];
    ok(m.join(session(1), room.id));
    await m.sendMessage(session(1), "bir");
    expect(await m.sendMessage(session(1), "iki")).toMatchObject({ ok: false, reason: "rate_limit" });
  });
  it("5 dakikada 5 filtre ihlali 10 dakika susturur", async () => {
    const room = m.listRooms("izmir")[0];
    ok(m.join(session(1), room.id));
    for (let i = 0; i < 5; i++) { await m.sendMessage(session(1), "salak"); now += 2500; }
    expect(await m.sendMessage(session(1), "merhaba")).toMatchObject({ ok: false, reason: "muted" });
  });
  it("susturmadan önce uyarır, 5. ihlalde susturulduğunu söyler", async () => {
    const room = m.listRooms("izmir")[0];
    ok(m.join(session(1), room.id));
    const results = [];
    for (let i = 0; i < 5; i++) { results.push(await m.sendMessage(session(1), "salak")); now += 2500; }
    const errors = results.map((r) => (r.ok ? "" : r.error));
    expect(errors[0]).not.toContain("Dikkat");
    expect(errors[1]).not.toContain("Dikkat");
    expect(errors[2]).toContain("Dikkat: 2 uygunsuz mesaj daha");
    expect(errors[3]).toContain("Dikkat: 1 uygunsuz mesaj daha");
    expect(results[4]).toMatchObject({ ok: false, reason: "muted" });
    expect(errors[4]).toContain("10 dakika yazamazsın");
  });
  it("reşit olmama ihtimali otomatik ve öncelikli bildirime dönüşür", async () => {
    const room = m.listRooms("izmir")[0];
    ok(m.join(session(1), room.id));
    await m.sendMessage(session(1), "ben 15 yaşındayım");
    expect(repo.reports).toHaveLength(1);
    expect(repo.reports[0]).toMatchObject({ reason: "minor", auto: true, priority: "high" });
  });
});

describe("bildirim ve yaptırım", () => {
  async function setup() {
    const room = m.listRooms("izmir")[0];
    for (let i = 1; i <= 5; i++) ok(m.join(session(i), room.id));
    const r = await m.sendMessage(session(1), "rahatsız edici bir mesaj");
    return ok(r).id;
  }
  it("kendi mesajını bildiremezsin", async () => {
    const id = await setup();
    expect(await m.reportMessage(session(1).sid, id, "harassment")).toMatchObject({ ok: false });
  });
  it("3 farklı kişi bildirince mesaj herkes için gizlenir ve kesit kaydedilir", async () => {
    const id = await setup();
    await m.reportMessage(session(2).sid, id, "harassment");
    await m.reportMessage(session(2).sid, id, "harassment"); // aynı kişi iki kez sayılmaz
    await m.reportMessage(session(3).sid, id, "harassment");
    expect(emitter.events.some((e) => e.event === "message:hidden")).toBe(false);
    await m.reportMessage(session(4).sid, id, "harassment");
    expect(emitter.events.some((e) => e.event === "message:hidden" && e.payload.id === id)).toBe(true);
    expect(repo.reports.length).toBe(3);
    expect((repo.reports[0].snapshot as any[])[0]).toMatchObject({ text: "rahatsız edici bir mesaj", sid: session(1).sid });
    expect(m.stateFor(session(5).sid)!.messages.find((x) => x.id === id)).toMatchObject({ hidden: true, text: "" });
  });
  it("24 saatte 3 mesajı gizlenen kişi 1 saat uzaklaştırılır", async () => {
    const room = m.listRooms("izmir")[0];
    for (let i = 1; i <= 4; i++) ok(m.join(session(i), room.id));
    for (let k = 0; k < 3; k++) {
      now += 3000;
      const id = ok(await m.sendMessage(session(1), `mesaj ${k}`)).id;
      for (let i = 2; i <= 4; i++) await m.reportMessage(session(i).sid, id, "harassment");
    }
    // Oturuma 1 saatlik ban + çerezi silip geri dönmeyi engelleyen IP özeti banı
    expect(repo.bans).toHaveLength(2);
    expect(repo.bans[0]).toMatchObject({ sid: session(1).sid, ipHash: null, until: new Date(now + 3600000) });
    expect(repo.bans[1]).toMatchObject({ sid: null, ipHash: session(1).ipHash, until: new Date(now + 3600000) });
    expect(emitter.kicked).toContain(session(1).sid);
    expect(m.roomOf(session(1).sid)).toBeNull();
  });
  it("5 farklı kişi bildirince kullanıcı köşesi kapanır", async () => {
    const st = ok(m.create(session(1), "izmir", "Tartışmalı bir konu", "💬 Muhabbet")).state;
    for (let i = 2; i <= 6; i++) { ok(m.join(session(i), st.room.id)); await m.reportRoom(session(i).sid, "hate"); }
    expect(m.listRooms("izmir").some((r) => r.id === st.room.id)).toBe(false);
  });
});

describe("çay", () => {
  it("çay ikramı odaya yayınlanır ve hız sınırı vardır", () => {
    const room = m.listRooms("izmir")[0];
    ok(m.join(session(1), room.id));
    const b = ok(m.join(session(2), room.id)).state.you;
    expect(m.tea(session(1).sid, b.nickname)).toMatchObject({ ok: true });
    expect(m.tea(session(1).sid, b.nickname)).toMatchObject({ ok: false, reason: "rate_limit" });
    expect(emitter.events.some((e) => e.event === "tea:offered")).toBe(true);
  });
});
