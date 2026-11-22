import { ALL_TURKEY_SLUG, CITIES, getCity } from "./cities";

const SUFFIXES: Record<string, string[]> = {
  f: ["Sever", "Ustası", "Meraklısı", "Tutkunu"],
  p: ["Gezgini", "Yolcusu", "Sakini", "Esintisi"],
  t: ["Dostu", "Meraklısı", "Tutkunu"],
};

/** Basit, tohumlanabilir rastgele sayı üreteci (mulberry32). */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Bir öğeden olası tüm takma adları üretir. */
export function expandItem(item: string): string[] {
  const [kind, value] = item.includes(":") ? (item.split(":", 2) as [string, string]) : ["r", item];
  if (kind === "r") return [value];
  const suffixes = SUFFIXES[kind] ?? [];
  return suffixes.map((s) => `${value} ${s}`);
}

/** Bir şehrin takma ad havuzu. Tüm Türkiye için bütün illerin havuzu birleşir. */
export function nicknamePool(citySlug: string): string[] {
  const items =
    citySlug === ALL_TURKEY_SLUG ? CITIES.flatMap((c) => c.items) : (getCity(citySlug)?.items ?? []);
  return [...new Set(items.flatMap(expandItem))];
}

/**
 * Odada henüz kullanılmayan bir takma ad seçer.
 * Havuz tükenirse sona sayı ekler ("Boyoz Sever 2").
 */
export function pickNickname(citySlug: string, taken: Iterable<string>, rand: () => number = Math.random): string {
  const used = new Set(taken);
  const pool = nicknamePool(citySlug);
  const free = pool.filter((n) => !used.has(n));
  if (free.length) return free[Math.floor(rand() * free.length)];
  const base = pool[Math.floor(rand() * pool.length)] ?? "Misafir";
  for (let i = 2; ; i++) {
    const candidate = `${base} ${i}`;
    if (!used.has(candidate)) return candidate;
  }
}

/** Karakter renkleri: aynı odada farklı kişilere farklı renk verilir. */
export const AVATAR_COLORS = [
  "#c0392b", "#2e86ab", "#8e44ad", "#27ae60", "#d35400",
  "#16a085", "#b7950b", "#7f5539", "#e84393", "#34495e",
];
export const SKIN_TONES = ["#f1c8a0", "#e0ac7e", "#c68b59", "#f5d6b4", "#d9a074"];
