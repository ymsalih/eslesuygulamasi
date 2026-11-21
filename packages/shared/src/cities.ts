/**
 * 81 il verisi.
 *
 * Her il için takma ad üretiminde kullanılan "öğeler" tutulur. Öğe formatı:
 *   "f:Boyoz"     → yemek / içecek   ("Boyoz Sever", "Boyoz Ustası" ...)
 *   "p:Kordon"    → yer / doğa       ("Kordon Gezgini", "Kordon Yolcusu" ...)
 *   "t:Çini"      → nesne / simge    ("Çini Dostu", "Çini Meraklısı" ...)
 *   "r:Van Kedisi"→ hazır takma ad, ek almaz
 *
 * Öğeler yemek, doğa, tarihi yer ve simgelerden seçilmiştir. Bir şehri, bölgeyi
 * veya topluluğu küçümseyen kalıp yargılardan kaçınılmıştır. Liste yayından
 * önce elle gözden geçirilmelidir.
 */

export type Region =
  | "Marmara"
  | "Ege"
  | "Akdeniz"
  | "İç Anadolu"
  | "Karadeniz"
  | "Doğu Anadolu"
  | "Güneydoğu Anadolu";

export interface City {
  plate: number;
  slug: string;
  name: string;
  /** "İzmir'in", "Ankara'nın" gibi tamlayan hâli */
  genitive: string;
  /** "İzmir'de", "Ankara'da" gibi bulunma hâli */
  locative: string;
  region: Region;
  items: string[];
}

export const ALL_TURKEY_SLUG = "turkiye";

type Row = [number, string, Region, string];

const ROWS: Row[] = [
  [1, "Adana", "Akdeniz", "f:Kebap|f:Şalgam|p:Taşköprü|t:Portakal Çiçeği|p:Seyhan"],
  [2, "Adıyaman", "Güneydoğu Anadolu", "p:Nemrut|f:Çiğ Köfte|p:Cendere Köprüsü|p:Perre"],
  [3, "Afyonkarahisar", "Ege", "f:Kaymak|f:Sucuk|p:Afyon Kalesi|f:Lokum|p:Kaplıca"],
  [4, "Ağrı", "Doğu Anadolu", "p:Ağrı Dağı|p:İshak Paşa Sarayı|f:Abdigör Köftesi|p:Meteor Çukuru"],
  [5, "Amasya", "Karadeniz", "f:Elma|p:Kral Kaya Mezarları|p:Yeşilırmak|p:Yalıboyu"],
  [6, "Ankara", "İç Anadolu", "r:Ankara Kedisi|r:Tiftik Keçisi|p:Kuğulu Park|p:Hamamönü|f:Simit|p:Atakule"],
  [7, "Antalya", "Akdeniz", "p:Kaleiçi|p:Düden Şelalesi|f:Piyaz|t:Portakal|p:Konyaaltı"],
  [8, "Artvin", "Karadeniz", "p:Karagöl|p:Macahel|f:Bal|p:Çoruh"],
  [9, "Aydın", "Ege", "f:İncir|f:Zeytin|p:Kuşadası|p:Didim|p:Afrodisias"],
  [10, "Balıkesir", "Marmara", "f:Höşmerim|p:Ayvalık|p:Cunda|p:Kaz Dağları|f:Zeytin"],
  [11, "Bilecik", "Marmara", "p:Söğüt|f:Ayva|p:Osmaneli|p:Gölpazarı"],
  [12, "Bingöl", "Doğu Anadolu", "p:Yüzen Adalar|f:Bal|f:Mırtoğa|p:Bingöl Dağları"],
  [13, "Bitlis", "Doğu Anadolu", "p:Nemrut Krater Gölü|f:Büryan|p:Ahlat|p:Süphan Dağı"],
  [14, "Bolu", "Karadeniz", "p:Abant|p:Yedigöller|p:Gölcük|r:Mengen Aşçısı"],
  [15, "Burdur", "Akdeniz", "p:Salda Gölü|f:Şiş Köfte|p:Sagalassos|p:İnsuyu Mağarası"],
  [16, "Bursa", "Marmara", "f:İskender|p:Uludağ|f:Kestane Şekeri|t:İpek|f:Cantık"],
  [17, "Çanakkale", "Marmara", "p:Bozcaada|p:Assos|f:Peynir Helvası|r:Truva Atı"],
  [18, "Çankırı", "İç Anadolu", "p:Tuz Mağarası|p:Ilgaz|r:Yaren Sohbeti"],
  [19, "Çorum", "Karadeniz", "f:Leblebi|p:Hattuşa|p:Alacahöyük|p:İncesu Kanyonu"],
  [20, "Denizli", "Ege", "p:Pamukkale|r:Denizli Horozu|t:Havlu|p:Hierapolis|p:Laodikya"],
  [21, "Diyarbakır", "Güneydoğu Anadolu", "f:Karpuz|p:Surlar|p:On Gözlü Köprü|f:Ciğer|f:Kaburga Dolması"],
  [22, "Edirne", "Marmara", "f:Tava Ciğer|p:Selimiye|r:Kırkpınar Pehlivanı|f:Badem Ezmesi|p:Meriç"],
  [23, "Elazığ", "Doğu Anadolu", "p:Harput|p:Hazar Gölü|f:Orcik|f:Öküzgözü"],
  [24, "Erzincan", "Doğu Anadolu", "f:Tulum Peyniri|p:Kemaliye|p:Girlevik Şelalesi|p:Taş Yol"],
  [25, "Erzurum", "Doğu Anadolu", "f:Cağ Kebabı|p:Palandöken|t:Oltu Taşı|f:Kadayıf Dolması"],
  [26, "Eskişehir", "İç Anadolu", "f:Çibörek|f:Met Helvası|p:Porsuk|p:Odunpazarı|t:Lüle Taşı"],
  [27, "Gaziantep", "Güneydoğu Anadolu", "f:Baklava|f:Fıstık|p:Zeugma|f:Beyran|f:Katmer|p:Bakırcılar Çarşısı"],
  [28, "Giresun", "Karadeniz", "f:Fındık|p:Giresun Adası|p:Kümbet Yaylası|f:Karalahana"],
  [29, "Gümüşhane", "Karadeniz", "f:Pestil|f:Köme|p:Karaca Mağarası|p:Zigana"],
  [30, "Hakkari", "Doğu Anadolu", "p:Cilo Dağı|p:Zap Vadisi|f:Bal|p:Sat Gölleri"],
  [31, "Hatay", "Akdeniz", "f:Künefe|f:Kömbe|p:Harbiye|p:Samandağ|f:Tepsi Kebabı"],
  [32, "Isparta", "Akdeniz", "t:Gül|p:Eğirdir Gölü|t:Halı|p:Davraz"],
  [33, "Mersin", "Akdeniz", "f:Tantuni|f:Cezerye|p:Kızkalesi|f:Kerebiç"],
  [34, "İstanbul", "Marmara", "p:Galata|f:Simit|p:Boğaz|r:Vapur Yolcusu|p:Kadıköy|r:Galata Martısı|p:Balat"],
  [35, "İzmir", "Ege", "f:Boyoz|f:Kumru|p:Kordon|p:Saat Kulesi|f:Gevrek|p:Kemeraltı|f:Lokma"],
  [36, "Kars", "Doğu Anadolu", "f:Kaşar|f:Kaz|p:Ani|p:Sarıkamış|r:Doğu Ekspresi Yolcusu"],
  [37, "Kastamonu", "Karadeniz", "p:Valla Kanyonu|p:Horma Kanyonu|f:Sarımsak|f:Siyez Bulguru|p:Kastamonu Kalesi"],
  [38, "Kayseri", "İç Anadolu", "f:Mantı|f:Pastırma|p:Erciyes|f:Sucuk"],
  [39, "Kırklareli", "Marmara", "p:İğneada|p:Dupnisa Mağarası|f:Hardaliye|p:Longoz"],
  [40, "Kırşehir", "İç Anadolu", "p:Kaman Kalehöyük|p:Cacabey|r:Bozkır Tezenesi|p:Seyfe Gölü"],
  [41, "Kocaeli", "Marmara", "f:Pişmaniye|p:Kartepe|p:Seka Park|p:İzmit Körfezi"],
  [42, "Konya", "İç Anadolu", "f:Etli Ekmek|f:Fırın Kebabı|p:Alaaddin Tepesi|p:Sille|p:Çatalhöyük"],
  [43, "Kütahya", "Ege", "t:Çini|p:Aizanoi|p:Kütahya Kalesi|p:Ilıca"],
  [44, "Malatya", "Doğu Anadolu", "f:Kayısı|p:Arslantepe|p:Levent Vadisi|f:Kağıt Kebabı"],
  [45, "Manisa", "Ege", "f:Mesir Macunu|f:Üzüm|p:Spil Dağı|p:Sardes|p:Ağlayan Kaya"],
  [46, "Kahramanmaraş", "Akdeniz", "f:Dondurma|f:Tarhana|f:Pul Biber|p:Maraş Kalesi"],
  [47, "Mardin", "Güneydoğu Anadolu", "p:Taş Evler|p:Dara|t:Telkari|f:Sembusek|p:Midyat"],
  [48, "Muğla", "Ege", "p:Bodrum|p:Ölüdeniz|p:Datça|f:Çökertme Kebabı"],
  [49, "Muş", "Doğu Anadolu", "r:Muş Lalesi|p:Malazgirt|p:Muş Ovası"],
  [50, "Nevşehir", "İç Anadolu", "r:Peri Bacası|r:Balon Pilotu|p:Göreme|f:Testi Kebabı|p:Uçhisar|t:Çömlek"],
  [51, "Niğde", "İç Anadolu", "f:Gazoz|f:Elma|p:Aladağlar|p:Gümüşler Manastırı"],
  [52, "Ordu", "Karadeniz", "f:Fındık|p:Boztepe|p:Yason Burnu|p:Çambaşı Yaylası"],
  [53, "Rize", "Karadeniz", "f:Çay|p:Ayder|p:Kaçkar|f:Muhlama|r:Tulum Ustası"],
  [54, "Sakarya", "Marmara", "f:Islama Köfte|p:Sapanca|p:Acarlar Longozu|p:Poyrazlar Gölü"],
  [55, "Samsun", "Karadeniz", "f:Bafra Pidesi|p:Kızılırmak Deltası|p:Atakum|f:Nokul"],
  [56, "Siirt", "Güneydoğu Anadolu", "f:Büryan|f:Siirt Fıstığı|t:Battaniye|p:Botan Vadisi"],
  [57, "Sinop", "Karadeniz", "p:Hamsilos Koyu|f:Nokul|p:Sinop Kalesi|p:Erfelek Şelaleleri|p:İnceburun"],
  [58, "Sivas", "İç Anadolu", "f:Sivas Köftesi|p:Divriği|p:Balıklı Kaplıca|r:Kangal|p:Gökpınar"],
  [59, "Tekirdağ", "Marmara", "f:Tekirdağ Köftesi|p:Şarköy|p:Uçmakdere|f:Hayrabolu Tatlısı"],
  [60, "Tokat", "Karadeniz", "f:Tokat Kebabı|p:Ballıca Mağarası|t:Yazma|p:Zile"],
  [61, "Trabzon", "Karadeniz", "f:Hamsi|p:Uzungöl|p:Sümela|t:Kemençe|f:Akçaabat Köftesi|r:Horon Ustası"],
  [62, "Tunceli", "Doğu Anadolu", "p:Munzur Vadisi|p:Pülümür|p:Ovacık"],
  [63, "Şanlıurfa", "Güneydoğu Anadolu", "f:Çiğ Köfte|p:Göbeklitepe|p:Balıklıgöl|f:İsot|p:Harran"],
  [64, "Uşak", "Ege", "t:Halı|p:Ulubey Kanyonu|f:Tarhana"],
  [65, "Van", "Doğu Anadolu", "r:Van Kedisi|f:Otlu Peynir|p:Akdamar|p:Van Gölü|r:Kahvaltı Ustası"],
  [66, "Yozgat", "İç Anadolu", "p:Çamlık|p:Sorgun|f:Arabaşı|p:Kerkenes"],
  [67, "Zonguldak", "Karadeniz", "r:Kara Elmas|p:Gökgöl Mağarası|p:Filyos|p:Kapuz"],
  [68, "Aksaray", "İç Anadolu", "p:Ihlara Vadisi|p:Hasan Dağı|p:Tuz Gölü|p:Selime"],
  [69, "Bayburt", "Karadeniz", "p:Bayburt Kalesi|p:Baksı|f:Lor Dolması"],
  [70, "Karaman", "İç Anadolu", "r:Türk Dili Sevdalısı|f:Divle Obruk Peyniri|p:Binbir Kilise|p:Taşkale"],
  [71, "Kırıkkale", "İç Anadolu", "p:Kızılırmak|p:Kapulukaya|r:Bozkır Rüzgârı"],
  [72, "Batman", "Güneydoğu Anadolu", "p:Hasankeyf|p:Malabadi Köprüsü|p:Raman Dağı|p:Dicle"],
  [73, "Şırnak", "Güneydoğu Anadolu", "p:Cudi Dağı|p:Cizre|p:Dicle Kıyısı"],
  [74, "Bartın", "Karadeniz", "p:Amasra|f:Amasra Salatası|p:İnkumu|p:Güzelcehisar"],
  [75, "Ardahan", "Doğu Anadolu", "p:Çıldır Gölü|r:Atlı Kızak|f:Bal|p:Şeytan Kalesi"],
  [76, "Iğdır", "Doğu Anadolu", "f:Kayısı|f:Bozbaş|p:Aras|p:Tuzluca"],
  [77, "Yalova", "Marmara", "p:Termal|p:Erikli Şelalesi|t:Çiçek|p:Çınarcık"],
  [78, "Karabük", "Karadeniz", "p:Safranbolu|t:Safran|f:Safranbolu Lokumu|p:Yörük Köyü"],
  [79, "Kilis", "Güneydoğu Anadolu", "f:Kilis Tava|f:Zeytin|f:Cennet Çamuru"],
  [80, "Osmaniye", "Akdeniz", "f:Yer Fıstığı|p:Karatepe|p:Zorkun Yaylası|p:Hemite Kalesi"],
  [81, "Düzce", "Karadeniz", "p:Güzeldere Şelalesi|f:Fındık|p:Akçakoca|p:Efteni Gölü"],
];

const TR_MAP: Record<string, string> = { ç: "c", ğ: "g", ı: "i", i: "i", ö: "o", ş: "s", ü: "u", â: "a", î: "i", û: "u" };

export function slugify(name: string): string {
  return name
    .toLocaleLowerCase("tr")
    .split("")
    .map((ch) => TR_MAP[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const BACK_VOWELS = "aıou";
const VOWELS = "aeıioöuü";

function lastVowel(word: string): string {
  const w = word.toLocaleLowerCase("tr");
  for (let i = w.length - 1; i >= 0; i--) if (VOWELS.includes(w[i])) return w[i];
  return "e";
}

/** Tamlayan eki: İzmir'in, Ankara'nın, İstanbul'un, Bingöl'ün */
export function genitive(name: string): string {
  const v = lastVowel(name);
  const endsWithVowel = VOWELS.includes(name.toLocaleLowerCase("tr").slice(-1));
  const harmony = v === "a" || v === "ı" ? "ı" : v === "e" || v === "i" ? "i" : v === "o" || v === "u" ? "u" : "ü";
  return `${name}'${endsWithVowel ? "n" : ""}${harmony}n`;
}

/** Bulunma eki: İzmir'de, Ankara'da, Kars'ta, Sinop'ta */
export function locative(name: string): string {
  const v = lastVowel(name);
  const last = name.toLocaleLowerCase("tr").slice(-1);
  const hard = "çfhkpsşt".includes(last);
  const a = BACK_VOWELS.includes(v) ? "a" : "e";
  return `${name}'${hard ? "t" : "d"}${a}`;
}

export const CITIES: City[] = ROWS.map(([plate, name, region, items]) => ({
  plate,
  slug: slugify(name),
  name,
  genitive: genitive(name),
  locative: locative(name),
  region,
  items: items.split("|"),
}));

/** "Tüm Türkiye" seçeneği: takma adlar tüm illerin öğelerinden gelir. */
export const ALL_TURKEY: City = {
  plate: 0,
  slug: ALL_TURKEY_SLUG,
  name: "Tüm Türkiye",
  genitive: "Tüm Türkiye'nin",
  locative: "Tüm Türkiye'de",
  region: "İç Anadolu",
  items: [],
};

const BY_SLUG = new Map<string, City>([[ALL_TURKEY_SLUG, ALL_TURKEY], ...CITIES.map((c) => [c.slug, c] as [string, City])]);

export function getCity(slug: string): City | undefined {
  return BY_SLUG.get(slug);
}

export function isValidCitySlug(slug: unknown): slug is string {
  return typeof slug === "string" && BY_SLUG.has(slug);
}

/** Şehirleri alfabetik sırada döndürür (Türkçe sıralama). */
export function citiesAlphabetical(): City[] {
  return [...CITIES].sort((a, b) => a.name.localeCompare(b.name, "tr"));
}
