/**
 * Her şehrin hazır (sistem) köşeleri.
 * Altı ilde elle yazılmış konular var. Diğer iller, il öğelerinden şablonla üretilir.
 */
import { ALL_TURKEY_SLUG, getCity } from "./cities";

export interface TopicSeed {
  category: string;
  title: string;
}

export const CATEGORIES = [
  "💬 Muhabbet", "📰 Gündem", "🍽️ Yeme-İçme", "🎶 Etkinlik", "⚽ Spor", "🎓 Okul",
  "💼 İş", "🚋 Ulaşım", "🏞️ Gezi", "🎬 Dizi-Film", "💭 Dertleşme", "🙊 İtiraf",
] as const;
export type Category = (typeof CATEGORIES)[number];

const CUSTOM: Record<string, TopicSeed[]> = {
  izmir: [
    { category: "🎶 Etkinlik", title: "Bu akşam Kordon'da ne yapılır?" },
    { category: "🍽️ Yeme-İçme", title: "Boyozun yanına ne yakışır: yumurta mı çay mı?" },
    { category: "⚽ Spor", title: "Göztepe mi Karşıyaka mı, bu sezon kim önde?" },
  ],
  istanbul: [
    { category: "🚋 Ulaşım", title: "Vapurda simit mi, poğaça mı?" },
    { category: "🎶 Etkinlik", title: "Hafta sonu Kadıköy'de ne yapılır?" },
    { category: "📰 Gündem", title: "Trafik yine kilit, siz nasıl gidiyorsunuz?" },
  ],
  ankara: [
    { category: "🏞️ Gezi", title: "Kuğulu Park'ta kuğular hâlâ yerinde mi?" },
    { category: "🍽️ Yeme-İçme", title: "Ankara'da en iyi simit nerede?" },
    { category: "🎶 Etkinlik", title: "Hafta sonu Ankara'da ne yapılır?" },
  ],
  trabzon: [
    { category: "🍽️ Yeme-İçme", title: "Hamsi en güzel nasıl pişer?" },
    { category: "🏞️ Gezi", title: "Uzungöl mü Sümela mı, ilk nereye gidilir?" },
    { category: "⚽ Spor", title: "Trabzonspor bu sezon nasıl gidiyor?" },
  ],
  nevsehir: [
    { category: "🏞️ Gezi", title: "Balonları sabah izlemek için en iyi tepe?" },
    { category: "🍽️ Yeme-İçme", title: "Testi kebabı mı, çömlekte fasulye mi?" },
    { category: "📰 Gündem", title: "Turist sezonu bitti mi, şehir nasıl?" },
  ],
  gaziantep: [
    { category: "🍽️ Yeme-İçme", title: "Sabah kahvaltısı: katmer mi beyran mı?" },
    { category: "🏞️ Gezi", title: "Zeugma Müzesi'ni gezmeyen kaldı mı?" },
    { category: "💬 Muhabbet", title: "Menengiç kahvesini seven var mı?" },
  ],
  [ALL_TURKEY_SLUG]: [
    { category: "🏞️ Gezi", title: "Türkiye'de mutlaka görülmesi gereken 3 yer?" },
    { category: "🍽️ Yeme-İçme", title: "Memleketinin en abartılan yemeği hangisi?" },
    { category: "💬 Muhabbet", title: "Hangi şehirden katılıyorsun, oralar nasıl?" },
  ],
};

const GENERIC: TopicSeed[] = [
  { category: "💬 Muhabbet", title: "Genel muhabbet, gel otur bir çay iç" },
  { category: "💭 Dertleşme", title: "Bugün nasıl geçti, anlat bakalım" },
  { category: "🎬 Dizi-Film", title: "Bu hafta ne izledin, öner bakalım" },
  { category: "🎓 Okul", title: "Sınav haftası, kim ne çalışıyor?" },
];

function itemValue(item: string): [string, string] {
  const [k, v] = item.includes(":") ? (item.split(":", 2) as [string, string]) : ["r", item];
  return [k, v];
}

export function defaultTopics(citySlug: string): TopicSeed[] {
  if (CUSTOM[citySlug]) return [...CUSTOM[citySlug], ...GENERIC];
  const city = getCity(citySlug);
  if (!city) return GENERIC;
  const food = city.items.map(itemValue).find(([k]) => k === "f")?.[1];
  const place = city.items.map(itemValue).find(([k]) => k === "p")?.[1];
  const seeds: TopicSeed[] = [{ category: "🎶 Etkinlik", title: `${city.locative} bu hafta sonu ne yapılır?` }];
  if (food) seeds.push({ category: "🍽️ Yeme-İçme", title: `${food} sevenler buraya, en iyisi nerede?` });
  if (place) seeds.push({ category: "🏞️ Gezi", title: `${place} için en güzel mevsim hangisi?` });
  seeds.push({ category: "📰 Gündem", title: `${city.genitive} en güzel yanı ne?` });
  return [...seeds, ...GENERIC];
}
