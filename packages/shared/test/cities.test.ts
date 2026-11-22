import { describe, expect, it } from "vitest";
import { ALL_TURKEY_SLUG, CITIES, defaultTopics, genitive, getCity, locative, nicknamePool, pickNickname, seededRandom, themeFor } from "../src";

describe("iller", () => {
  it("81 il var, plakalar 1–81 ve benzersiz", () => {
    expect(CITIES).toHaveLength(81);
    expect(new Set(CITIES.map((c) => c.plate)).size).toBe(81);
    expect(Math.min(...CITIES.map((c) => c.plate))).toBe(1);
    expect(Math.max(...CITIES.map((c) => c.plate))).toBe(81);
    expect(new Set(CITIES.map((c) => c.slug)).size).toBe(81);
  });
  it("her ilin en az 3 öğesi var", () => {
    for (const c of CITIES) expect(c.items.length, c.name).toBeGreaterThanOrEqual(3);
  });
  it("Türkçe ekleri doğru üretir", () => {
    expect(genitive("İzmir")).toBe("İzmir'in");
    expect(genitive("Ankara")).toBe("Ankara'nın");
    expect(genitive("İstanbul")).toBe("İstanbul'un");
    expect(genitive("Bingöl")).toBe("Bingöl'ün");
    expect(genitive("Düzce")).toBe("Düzce'nin");
    expect(genitive("Bolu")).toBe("Bolu'nun");
    expect(locative("Kars")).toBe("Kars'ta");
    expect(locative("İzmir")).toBe("İzmir'de");
    expect(locative("Ankara")).toBe("Ankara'da");
    expect(locative("Sinop")).toBe("Sinop'ta");
  });
  it("slug'lar ASCII", () => {
    expect(getCity("sanliurfa")?.name).toBe("Şanlıurfa");
    expect(getCity("igdir")?.name).toBe("Iğdır");
    expect(getCity("istanbul")?.name).toBe("İstanbul");
  });
});

describe("takma adlar", () => {
  it("her il için havuz dolu", () => {
    for (const c of CITIES) expect(nicknamePool(c.slug).length, c.name).toBeGreaterThan(5);
    expect(nicknamePool(ALL_TURKEY_SLUG).length).toBeGreaterThan(500);
  });
  it("odada aynı takma adı iki kez vermez", () => {
    const taken: string[] = [];
    const rand = seededRandom(42);
    for (let i = 0; i < 40; i++) taken.push(pickNickname("mus", taken, rand));
    expect(new Set(taken).size).toBe(40);
  });
});

describe("temalar ve konular", () => {
  it("her ilin bir teması ve hazır konuları var", () => {
    for (const c of [...CITIES.map((c) => c.slug), ALL_TURKEY_SLUG]) {
      expect(themeFor(c).skyline.length).toBeGreaterThan(50);
      expect(defaultTopics(c).length).toBeGreaterThanOrEqual(4);
    }
    expect(themeFor("izmir").key).toBe("izmir");
    expect(themeFor("aydin").key).toBe("ege");
    expect(themeFor("rize").key).toBe("karadeniz");
  });
});
