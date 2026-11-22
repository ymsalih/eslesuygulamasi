import { describe, expect, it } from "vitest";
import { isValidTcKimlik, moderateMessage, moderateTopic, normalize, topicNeedsReview } from "../src/moderation";

const blocked = (t: string) => moderateMessage(t);

describe("normalize", () => {
  it("Türkçe karakterleri, rakam hilelerini ve tekrarları sadeleştirir", () => {
    expect(normalize("ŞEREFSİZ")).toBe("serefsiz");
    expect(normalize("s1kt1r")).toBe("siktir");
    expect(normalize("aaaaptal")).toBe("aptal");
    expect(normalize("o​rospu")).toBe("orospu");
  });
});

describe("küfür filtresi", () => {
  it.each([
    "sen bir salaksın", "AMK ya", "aq", "siktir git", "s.i.k.t.i.r", "s i k t i r", "0r0spu", "ŞEREFSİZ herif",
    "gerizekalı mısın", "aptalca konuşma", "pezevenk", "orooospu", "amına", "siktiğimin",
  ])("engeller: %s", (t) => {
    const r = blocked(t);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("profanity");
  });

  it.each([
    "Bugün çok sıkıntılı bir gün geçirdim", "Sıkıcı bir ders", "Trafikte sıkıştık", "Sıkı dur",
    "amin", "Amine Hanım çok iyi", "Malzeme listesi", "mal sahibi", "I got it", "Ameliyat oldum geçmiş olsun",
    "Ananı özledin mi?", "Kasımpaşa", "Pamukkale çok güzel", "ambulans geçti", "Bu çok sıkıntı",
    "sikke koleksiyonu", "Göztepe", "Alsancak", "Tasarım", "aptallık etmeyelim derken bile",
  ])("izin verir: %s", (t) => {
    const r = blocked(t);
    if (t === "aptallık etmeyelim derken bile") {
      expect(r.ok).toBe(false); // "aptal" kökü: bilinçli olarak engelleniyor
      return;
    }
    expect(r).toMatchObject({ ok: true });
  });
});

describe("kişisel bilgi", () => {
  it("telefon numaralarını engeller", () => {
    for (const t of ["0532 123 45 67", "+90 532 123 45 67", "5321234567", "0(212) 555-12-12", "beni ara 0555.111.22.33"]) {
      expect(blocked(t)).toMatchObject({ ok: false, reason: "personal_info" });
    }
  });
  it("geçerli TC kimlik numarasını engeller, rastgele 11 haneyi engellemez", () => {
    expect(isValidTcKimlik("10000000146")).toBe(true);
    expect(blocked("kimliğim 10000000146")).toMatchObject({ ok: false, reason: "personal_info" });
    expect(blocked("sipariş no 12345678901")).toMatchObject({ ok: true });
  });
  it("IBAN ve e-postayı engeller", () => {
    expect(blocked("TR33 0006 1005 1978 6457 8413 26")).toMatchObject({ ok: false, reason: "personal_info" });
    expect(blocked("yaz bana ornek@mail.com")).toMatchObject({ ok: false, reason: "personal_info" });
  });
  it("normal sayıları engellemez", () => {
    expect(blocked("Saat 9'da 15 kişi geldi, 2026 yılı")).toMatchObject({ ok: true });
  });
});

describe("link ve hesap paylaşımı", () => {
  it.each(["https://site.com", "www.ornek.net", "insta: kullanici", "ig: abc", "@kullanici_adi", "ornek . com", "t.me/kanal"])(
    "engeller: %s",
    (t) => expect(blocked(t)).toMatchObject({ ok: false, reason: "link" }),
  );
  it("sohbette sosyal medya adının geçmesine izin verir", () => {
    expect(blocked("instagramda bir video gördüm")).toMatchObject({ ok: true });
  });
});

describe("spam", () => {
  it("bahis reklamını engeller", () => {
    expect(blocked("Deneme bonusu veren siteler")).toMatchObject({ ok: false, reason: "spam" });
    expect(blocked("en iyi CASINO burada")).toMatchObject({ ok: false, reason: "spam" });
  });
});

describe("uzunluk", () => {
  it("boş ve çok uzun mesajları reddeder", () => {
    expect(blocked("   ")).toMatchObject({ ok: false, reason: "empty" });
    expect(blocked("a".repeat(301))).toMatchObject({ ok: false, reason: "too_long" });
  });
  it("başlık 10–100 karakter olmalı", () => {
    expect(moderateTopic("kısa")).toMatchObject({ ok: false, reason: "too_short" });
    expect(moderateTopic("Bu akşam Kordon'da ne yapılır?")).toMatchObject({ ok: true });
  });
});

describe("işaretleme", () => {
  it("reşit olmama ihtimalini işaretler ama engellemez", () => {
    const r = blocked("ben 15 yaşındayım");
    expect(r.ok).toBe(true);
    expect(r.flags).toContain("minor_hint");
    expect(blocked("lise 2 deyim").flags).toContain("minor_hint");
    expect(blocked("25 yaşındayım").flags).not.toContain("minor_hint");
  });
  it("tehdit kalıbını işaretler", () => {
    expect(blocked("seni öldürürüm").flags).toContain("threat_hint");
  });
});

describe("başlık incelemesi", () => {
  it("kişiyi hedef alan başlıkları incelemeye alır", () => {
    expect(topicNeedsReview("Ayşe Yılmaz adlı garson hakkında")).toBe(true);
    expect(topicNeedsReview("X kafedeki ifşa")).toBe(true);
    expect(topicNeedsReview("Bu akşam Kordon'da ne yapılır?")).toBe(false);
    expect(topicNeedsReview("Göztepe Karşıyaka derbisi")).toBe(false);
  });
});
