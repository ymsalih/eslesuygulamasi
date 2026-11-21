import { describe, expect, it } from "vitest";
import { PRIVACY_VERSION, TERMS_VERSION } from "../src";
import { decryptIp, encryptIp, newSessionId, readCookie, signSession, verifySession } from "../src/server";

const SECRET = "test-secret-test-secret-test-secret-123";

describe("oturum token'ı", () => {
  const payload = { sid: newSessionId(), tv: TERMS_VERSION, pv: PRIVACY_VERSION, age: true as const, iat: Date.now() };
  it("imzalanan token doğrulanır", () => {
    expect(verifySession(signSession(payload, SECRET), SECRET)?.sid).toBe(payload.sid);
  });
  it("değiştirilmiş token reddedilir", () => {
    const t = signSession(payload, SECRET);
    const tampered = Buffer.from(JSON.stringify({ ...payload, sid: "f".repeat(32) })).toString("base64url") + "." + t.split(".")[1];
    expect(verifySession(tampered, SECRET)).toBeNull();
    expect(verifySession(t, SECRET + "x")).toBeNull();
  });
  it("eski metin sürümüyle verilen onay geçersizdir", () => {
    expect(verifySession(signSession({ ...payload, tv: "2020-01-01" }, SECRET), SECRET)).toBeNull();
  });
  it("süresi dolan token geçersizdir", () => {
    expect(verifySession(signSession({ ...payload, iat: Date.now() - 31 * 86400000 }, SECRET), SECRET)).toBeNull();
  });
  it("çerez okunur", () => {
    expect(readCookie("a=1; sk_session=abc.def; b=2", "sk_session")).toBe("abc.def");
  });
});

describe("IP şifreleme", () => {
  it("şifreler ve çözer", () => {
    const key = "ab".repeat(32);
    const e = encryptIp("203.0.113.7", key);
    expect(e).not.toContain("203.0.113.7");
    expect(decryptIp(e, key)).toBe("203.0.113.7");
  });
});
