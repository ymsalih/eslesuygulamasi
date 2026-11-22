import { describe, expect, it } from "vitest";
import {
  ADMIN_SESSION_MS, BAN_DURATIONS, banExpiry, formatDuration, moderateMessage, removalDeadline, validateBannedWord,
} from "../src";
import {
  EXAMPLE_ADMIN_PASSWORD, LoginRateLimiter, checkRealtimeAdminKey, hashAdminPassword, passwordFingerprint,
  realtimeAdminKey, signAdminToken, verifyAdminPassword, verifyAdminToken,
} from "../src/server";

const SECRET = "yonetici-test-anahtari-yonetici-test-anahtari";

describe("yönetici parolası", () => {
  const hash = hashAdminPassword("cok-gizli-parola-123");
  it("doğru parola kabul edilir, yanlışı reddedilir", () => {
    expect(hash).toMatch(/^scrypt:[A-Za-z0-9_-]+:[A-Za-z0-9_-]+$/);
    expect(verifyAdminPassword("cok-gizli-parola-123", hash)).toBe(true);
    expect(verifyAdminPassword("cok-gizli-parola-124", hash)).toBe(false);
  });
  it("aynı parolanın özeti her seferinde farklıdır (tuz)", () => {
    expect(hashAdminPassword("x".repeat(12))).not.toBe(hashAdminPassword("x".repeat(12)));
  });
  it("bozuk veya boş özet her zaman reddedilir", () => {
    for (const bad of [undefined, "", "scrypt:abc", "bcrypt:a:b", "scrypt:AAAAAAAAAAA:kisa"]) {
      expect(verifyAdminPassword("herhangi", bad)).toBe(false);
    }
  });
  it(".env.example'daki örnek özet örnek parolayla eşleşir", async () => {
    const { readFileSync } = await import("node:fs");
    const env = readFileSync(new URL("../../../.env.example", import.meta.url), "utf8");
    const line = env.split(/\r?\n/).find((l) => l.startsWith("ADMIN_PASSWORD_HASH="))!;
    expect(verifyAdminPassword(EXAMPLE_ADMIN_PASSWORD, line.split("=")[1])).toBe(true);
  });
});

describe("yönetici çerezi", () => {
  const passwordHash = hashAdminPassword("cok-gizli-parola-123");
  const expected = { username: "yonetici", passwordHash };
  const now = Date.now();
  const token = signAdminToken({ u: "yonetici", iat: now, pv: passwordFingerprint(passwordHash) }, SECRET);

  it("geçerli çerez doğrulanır", () => {
    expect(verifyAdminToken(token, SECRET, expected, now)?.u).toBe("yonetici");
  });
  it("başka anahtarla veya değiştirilmiş içerikle reddedilir", () => {
    expect(verifyAdminToken(token, SECRET + "x", expected, now)).toBeNull();
    const [, sig] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ u: "baska", iat: now, pv: "x", t: "admin" })).toString("base64url");
    expect(verifyAdminToken(`${forged}.${sig}`, SECRET, expected, now)).toBeNull();
  });
  it("8 saat sonra geçersizdir", () => {
    expect(verifyAdminToken(token, SECRET, expected, now + ADMIN_SESSION_MS + 1)).toBeNull();
  });
  it("parola veya kullanıcı adı değişince eski çerezler geçersiz olur", () => {
    expect(verifyAdminToken(token, SECRET, { ...expected, passwordHash: hashAdminPassword("yeni-parola-1234") }, now)).toBeNull();
    expect(verifyAdminToken(token, SECRET, { ...expected, username: "baskasi" }, now)).toBeNull();
  });
  it("kullanıcı oturum çereziyle (sk_session) karıştırılamaz", async () => {
    const { signSession, newSessionId } = await import("../src/server");
    const { TERMS_VERSION, PRIVACY_VERSION } = await import("../src");
    const userToken = signSession({ sid: newSessionId(), tv: TERMS_VERSION, pv: PRIVACY_VERSION, age: true, iat: now }, SECRET);
    expect(verifyAdminToken(userToken, SECRET, expected, now)).toBeNull();
  });
});

describe("sohbet sunucusu iç anahtarı", () => {
  it("sadece doğru anahtar kabul edilir", () => {
    expect(checkRealtimeAdminKey(realtimeAdminKey(SECRET), SECRET)).toBe(true);
    expect(checkRealtimeAdminKey(realtimeAdminKey(SECRET + "x"), SECRET)).toBe(false);
    expect(checkRealtimeAdminKey(undefined, SECRET)).toBe(false);
    expect(checkRealtimeAdminKey(realtimeAdminKey(SECRET), undefined)).toBe(false);
  });
  it("çerez anahtarından farklıdır", () => {
    const token = signAdminToken({ u: "y", iat: Date.now(), pv: "p" }, SECRET);
    expect(token.split(".")[1]).not.toBe(realtimeAdminKey(SECRET));
  });
});

describe("giriş hız sınırı", () => {
  it("5 yanlış denemeden sonra 15 dakika kilitler", () => {
    const rl = new LoginRateLimiter(5, 15 * 60 * 1000);
    const t = 1_000_000;
    for (let i = 0; i < 5; i++) {
      expect(rl.check("ip:1", t + i).allowed).toBe(true);
      rl.fail("ip:1", t + i);
    }
    const blocked = rl.check("ip:1", t + 10);
    expect(blocked.allowed).toBe(false);
    if (!blocked.allowed) expect(blocked.retryAfterMs).toBeGreaterThan(14 * 60 * 1000);
    expect(rl.check("ip:2", t + 10).allowed).toBe(true);
    expect(rl.check("ip:1", t + 15 * 60 * 1000 + 5).allowed).toBe(true);
  });
  it("başarılı girişten sonra sayaç sıfırlanır", () => {
    const rl = new LoginRateLimiter(2, 60_000);
    rl.fail("a", 0);
    rl.reset("a");
    rl.fail("a", 1);
    expect(rl.check("a", 2).allowed).toBe(true);
  });
});

describe("ban süreleri", () => {
  it("süreli ve süresiz ban", () => {
    const now = Date.UTC(2026, 0, 1);
    expect(banExpiry("24h", now)?.getTime()).toBe(now + 24 * 3600000);
    expect(banExpiry("permanent", now)).toBeNull();
    expect(banExpiry("sonsuz", now)).toBeUndefined();
    expect(banExpiry("__proto__", now)).toBeUndefined();
    expect(Object.keys(BAN_DURATIONS)).toContain("7d");
  });
});

describe("içerik kaldırma talebi 24 saat sayacı", () => {
  const created = Date.UTC(2026, 10, 22, 8, 0);
  it("süre içinde kalan zamanı gösterir", () => {
    const d = removalDeadline(created, created + 2 * 3600000);
    expect(d.overdue).toBe(false);
    expect(d.urgent).toBe(false);
    expect(d.label).toBe("22 sa kaldı");
  });
  it("son 4 saatte acil, süre geçince gecikmiş", () => {
    expect(removalDeadline(created, created + 21 * 3600000).urgent).toBe(true);
    const late = removalDeadline(created, created + 26 * 3600000 + 5 * 60000);
    expect(late.overdue).toBe(true);
    expect(late.label).toBe("2 sa 5 dk gecikti");
  });
  it("süre biçimi", () => {
    expect(formatDuration(45 * 60000)).toBe("45 dk");
    expect(formatDuration(3 * 86400000 + 4 * 3600000)).toBe("3 gün 4 sa");
  });
});

describe("panelden eklenen yasaklı kelimeler", () => {
  it("filtre biçimine çevrilir", () => {
    expect(validateBannedWord("  Şişko ", "exact")).toEqual({ ok: true, pattern: "sisko", kind: "exact" });
    expect(validateBannedWord("BAHİS", "prefix")).toEqual({ ok: true, pattern: "bahis", kind: "prefix" });
  });
  it("tehlikeli veya geçersiz girdiler reddedilir", () => {
    expect(validateBannedWord("", "exact").ok).toBe(false);
    expect(validateBannedWord("!!!", "exact").ok).toBe(false); // "iii" değil, "i" olur
    expect(validateBannedWord("ab", "prefix").ok).toBe(false); // kısa kök masum kelimeleri engeller
    expect(validateBannedWord("iki kelime", "exact").ok).toBe(false);
    expect(validateBannedWord("kelime", "regex").ok).toBe(false);
    expect(validateBannedWord("x".repeat(41), "exact").ok).toBe(false);
  });
  it("eklenen kelime mesaj filtresinde çalışır", () => {
    expect(moderateMessage("bu bahisci yine geldi", { blockPrefix: ["bahis"] }).ok).toBe(false);
    expect(moderateMessage("bugün hava güzel", { blockPrefix: ["bahis"] }).ok).toBe(true);
  });
  it("veritabanına bir şekilde boş kök girse bile bütün mesajlar engellenmez", () => {
    expect(moderateMessage("merhaba nasılsın", { blockPrefix: [""], blockExact: [""] }).ok).toBe(true);
    expect(moderateMessage("merhaba nasılsın", { blockPrefix: ["!!"] }).ok).toBe(true);
  });
});
