/**
 * Mesaj ve başlık filtresi.
 *
 * Bu modül sunucuda çalışır (asıl karar sunucunundur). İstemci aynı kodu sadece
 * kullanıcıya anında uyarı göstermek için kullanabilir.
 *
 * Katmanlar:
 *   1. Uzunluk / boşluk
 *   2. Kişisel bilgi (telefon, TC kimlik no, IBAN, e-posta)
 *   3. Link ve iletişim hesabı paylaşımı
 *   4. Bahis / kumar spamı
 *   5. Küfür ve hakaret (normalizasyon + kök listesi + istisnalar)
 *   6. İşaretleme (engellemez): reşit olmama ihtimali, tehdit kalıpları
 *
 * Not: Hiçbir filtre kusursuz değildir. Bildirim sistemi ve moderasyon bu filtreyi tamamlar.
 * Yönetim panelinden eklenen kelimeler `extra` parametresiyle verilir.
 */

export type RejectReason = "empty" | "too_long" | "personal_info" | "link" | "spam" | "profanity" | "too_short";
export type Flag = "minor_hint" | "threat_hint";

export interface ModerationResult {
  ok: boolean;
  reason?: RejectReason;
  message?: string;
  flags: Flag[];
}

export interface ModerationOptions {
  maxLength?: number;
  minLength?: number;
  extra?: { blockExact?: string[]; blockPrefix?: string[] };
}

export const MESSAGE_MAX_LENGTH = 300;
export const TOPIC_MIN_LENGTH = 10;
export const TOPIC_MAX_LENGTH = 100;

const MESSAGES: Record<RejectReason, string> = {
  empty: "Boş mesaj gönderilemez.",
  too_long: "Mesaj çok uzun.",
  too_short: "Metin çok kısa.",
  personal_info: "Güvenliğin için telefon, kimlik no, IBAN ve e-posta paylaşımı engellenir.",
  link: "Link ve sosyal medya hesabı paylaşımı engellenir.",
  spam: "Reklam ve bahis içerikli mesajlar engellenir.",
  profanity: "Mesajın topluluk kurallarına uymadığı için gönderilmedi.",
};

/* ---------------- Normalizasyon ---------------- */

const TR_CHARS: Record<string, string> = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" };
const LEET: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", $: "s", "!": "i", "€": "e" };
const ZERO_WIDTH = /[​-‍⁠﻿­]/g;

/** Küçük harf, Türkçe karakterleri sadeleştir, rakam/sembol hilelerini çöz, 3+ tekrarı teke indir. */
export function normalize(input: string): string {
  return input
    .replace(ZERO_WIDTH, "")
    .toLocaleLowerCase("tr")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .split("")
    .map((ch) => TR_CHARS[ch] ?? LEET[ch] ?? ch)
    .join("")
    .replace(/(.)\1{2,}/g, "$1");
}

/** Normalize edilmiş metni kelimelere böler. Tek harfli ardışık parçaları ("s i k") ayrıca birleştirir. */
export function tokens(normalized: string): string[] {
  const words = normalized.split(/[^a-z]+/).filter(Boolean);
  const out = [...words];
  let run = "";
  for (const w of words) {
    if (w.length === 1) run += w;
    else {
      if (run.length >= 3) out.push(run);
      run = "";
    }
  }
  if (run.length >= 3) out.push(run);
  return out;
}

/* ---------------- Küfür listesi ---------------- */
/*
 * Kelimenin TAMAMI eşleşirse engellenenler (kısa ve başka kelimelerin içinde geçebilen kökler).
 * Örn. "am", "got", "mal" gibi kelimeler bilinçli olarak listede yok: masum kullanımları çok yaygın.
 */
const BLOCK_EXACT = new Set([
  "amk", "amq", "aq", "sik", "pic", "oc", "yarak", "yarrak", "yarram", "pezo", "amcik",
  "gotun", "gotune", "gotunu", "sikik", "sikim", "sikimi",
  // Kısaltmalar ve yaygın yazım biçimleri
  "mk", "mq", "skm", "sktr", "pust", "pustt",
]);

/*
 * Kelime bu köklerle BAŞLIYORSA engellenir (Türkçe ekleri yakalamak için).
 * "sik" kökü bilinçli olarak burada yok: "sıkıntı", "sıkıcı", "sıkıştı" gibi kelimeler
 * normalizasyondan sonra aynı köke dönüşür. Bunun yerine çekimli biçimler tek tek yazıldı.
 */
const BLOCK_PREFIX = [
  "orospu", "orsb", "siktir", "sikerim", "sikeyim", "sikiyim", "siktim", "siktig", "sikerler",
  "amina", "amini", "aminak", "amcig", "piclik", "picler", "picin", "kahpe", "kaltak", "pezevenk",
  "ibne", "yavsak", "gavat", "gerizekali", "salak", "aptal", "dangalak", "dalyarak", "yarrag",
  "tasak", "gotveren", "gotlek", "serefsiz", "haysiyetsiz",
  "orspu", "orosbu", "kahbe", "avradin", "pustluk",
];

/** Bu kelimeler yukarıdaki kökleri içerse bile serbesttir. */
const ALLOW_EXACT = new Set(["amin", "amine", "aminah"]);

/** Kelimeler arasındaki boşluk ve noktalama silindiğinde de aranacak, yalnızca ayırt edici uzun kökler. */
/*
 * "ananı" tek başına bilinçli olarak engellenmez ("Ananı özledin mi?" masum). Sadece küfürle birleşik hâlleri aranır.
 */
const SQUASH_STEMS = [
  "orospu", "siktir", "yarrak", "pezevenk", "gerizekali", "amcik", "aminakoy", "sikerim", "sikeyim",
  "ananisik", "ananizisik", "bacinisik", "avradinisik",
];

function containsProfanity(text: string, extra?: ModerationOptions["extra"]): boolean {
  const n = normalize(text);
  // Panelden gelen boş/çok kısa kökler ("" her kelimeyle başlar) bütün mesajları engellemesin
  const exact = new Set([...BLOCK_EXACT, ...(extra?.blockExact ?? []).map(normalize).filter((w) => w.length >= 2)]);
  const prefixes = [...BLOCK_PREFIX, ...(extra?.blockPrefix ?? []).map(normalize).filter((w) => w.length >= 3)];
  for (const w of tokens(n)) {
    if (ALLOW_EXACT.has(w)) continue;
    if (exact.has(w)) return true;
    if (prefixes.some((p) => w.startsWith(p))) return true;
  }
  const squashed = n.replace(/[^a-z]+/g, "");
  return SQUASH_STEMS.some((s) => squashed.includes(s));
}

/* ---------------- Kişisel bilgi ---------------- */

/** TC kimlik numarası algoritmasıyla doğrulama (yanlış pozitifleri azaltır). */
export function isValidTcKimlik(digits: string): boolean {
  if (!/^[1-9]\d{10}$/.test(digits)) return false;
  const d = digits.split("").map(Number);
  const odd = d[0] + d[2] + d[4] + d[6] + d[8];
  const even = d[1] + d[3] + d[5] + d[7];
  const d10 = (((odd * 7 - even) % 10) + 10) % 10;
  const d11 = d.slice(0, 10).reduce((a, b) => a + b, 0) % 10;
  return d[9] === d10 && d[10] === d11;
}

function containsPersonalInfo(text: string): boolean {
  // Rakamların arasındaki boşluk, tire, nokta ve parantezleri kaldırarak ara
  const compact = text.replace(/[\s\-.()/]+/g, "");
  if (/(?:\+?90|0)?5\d{9}(?!\d)/.test(compact)) return true; // cep telefonu
  if (/(?:\+?90|0)[2-4]\d{9}(?!\d)/.test(compact)) return true; // sabit hat
  for (const m of compact.match(/\d{11}/g) ?? []) if (isValidTcKimlik(m)) return true;
  if (/tr\d{24}/i.test(compact)) return true; // IBAN
  if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text)) return true; // e-posta
  return false;
}

/* ---------------- Link ve iletişim hesabı ---------------- */

const LINK_PATTERNS = [
  /https?:\/\//i,
  /\bwww\./i,
  /\b[a-z0-9-]{2,}\s?\.\s?(com|net|org|tr|io|me|co|xyz|app|link|ly|gg|info|biz|site|online|shop|live)\b/i,
  /\b(insta(gram)?|ig|snap(chat)?|telegram|tg|discord|whatsapp|wp|tiktok|twitter|x)\s*[:=]/i,
  /(^|\s)@[a-z0-9_.]{3,}/i,
  /\bt\.me\//i,
];

/* ---------------- Bahis / kumar spamı ---------------- */

const SPAM_PATTERNS = [
  /deneme\s*bonus/, /free\s*spin/, /casino/, /kumarhane/, /bahis\s*sitesi/, /canli\s*bahis/,
  /slot\s*oyun/, /bonus\s*veren/, /kazandiran\s*site/, /yatirimsiz/,
];

/* ---------------- İşaretleme ---------------- */

const MINOR_PATTERNS = [
  /\b(1[0-7])\s*yas(indayim|inda|im)\b/,
  /\blise\s*[1-4]\b/,
  /\b(5|6|7|8|9|10|11|12)\s*\.?\s*sinif(tayim|ta|im)?\b/,
  /\bortaokul(dayim|a gidiyorum)?\b/,
];
const THREAT_PATTERNS = [/\bseni\s*(oldur|vur|bul)/, /\b(adresini|evini)\s*(bul|biliyorum)/];

/* ---------------- Ana fonksiyonlar ---------------- */

export function moderateText(text: string, opts: ModerationOptions = {}): ModerationResult {
  const max = opts.maxLength ?? MESSAGE_MAX_LENGTH;
  const trimmed = text.trim();
  const reject = (reason: RejectReason): ModerationResult => ({ ok: false, reason, message: MESSAGES[reason], flags: [] });

  if (!trimmed) return reject("empty");
  if (opts.minLength && trimmed.length < opts.minLength) return reject("too_short");
  if (trimmed.length > max) return reject("too_long");
  if (containsPersonalInfo(trimmed)) return reject("personal_info");
  if (LINK_PATTERNS.some((p) => p.test(trimmed))) return reject("link");

  const n = normalize(trimmed);
  if (SPAM_PATTERNS.some((p) => p.test(n))) return reject("spam");
  if (containsProfanity(trimmed, opts.extra)) return reject("profanity");

  const flags: Flag[] = [];
  const plain = normalize(trimmed.replace(/\d/g, (d) => ` ${d}`)).replace(/\s+/g, " ");
  const withDigits = trimmed.toLocaleLowerCase("tr").split("").map((c) => TR_CHARS[c] ?? c).join("");
  if (MINOR_PATTERNS.some((p) => p.test(withDigits))) flags.push("minor_hint");
  if (THREAT_PATTERNS.some((p) => p.test(plain) || p.test(withDigits))) flags.push("threat_hint");
  return { ok: true, flags };
}

export function moderateMessage(text: string, extra?: ModerationOptions["extra"]): ModerationResult {
  return moderateText(text, { maxLength: MESSAGE_MAX_LENGTH, extra });
}

export function moderateTopic(text: string, extra?: ModerationOptions["extra"]): ModerationResult {
  return moderateText(text, { maxLength: TOPIC_MAX_LENGTH, minLength: TOPIC_MIN_LENGTH, extra });
}

/**
 * Başlıkta belirli bir kişiyi tanımlıyor olabilecek kalıplar.
 * Bu başlıklar engellenmez, "incelemede" olarak açılır (listede görünmez, moderatör onayı bekler).
 */
export function topicNeedsReview(title: string): boolean {
  const t = title.trim();
  // İki büyük harfle başlayan ardışık kelime (Ad Soyad) + kişi bildiren bağlam
  const fullName = /\b[A-ZÇĞİÖŞÜ][a-zçğıöşü]{2,}\s+[A-ZÇĞİÖŞÜ][a-zçğıöşü]{2,}\b/;
  const personContext = /(adlı|isimli|diye biri|tanıyan|kim bu|hakkında|ifşa|okulundaki|şirketindeki|çalışan|garson|hoca(sı)?|öğretmen|komşu)/i;
  return (fullName.test(t) && personContext.test(t)) || /\bifşa\b/i.test(t);
}
