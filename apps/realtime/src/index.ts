import { EXAMPLE_ADMIN_SECRET } from "@sark/shared/server";
import { config } from "./config";
import { MemoryRepo, PgRepo, type Repo } from "./repo";
import { createRealtime } from "./server";

if (!config.sessionSecret || config.sessionSecret.length < 32) {
  console.error("SESSION_SECRET tanımlı değil veya 32 karakterden kısa. Proje klasöründe .env dosyası olmalı (bkz. .env.example).");
  process.exit(1);
}
if (config.usingDevSecret) console.warn("BİLGİ: .env bulunamadı, yerel deneme anahtarı kullanılıyor (sadece bilgisayarda denemek için).");

// 5651 trafik loglarındaki IP'ler bu anahtarla şifrelenir: 64 karakterlik hex (32 bayt) olmalı.
// Örnek dosyadaki sıfırlardan oluşan anahtar canlı sitede kabul edilmez (şifreleme anlamsız kalır).
if (config.databaseUrl || config.production) {
  const key = config.ipKey ?? "";
  if (!/^[0-9a-fA-F]{64}$/.test(key)) {
    console.error("IP_ENCRYPTION_KEY 64 karakterlik hex olmalı. Üretmek için: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"");
    process.exit(1);
  }
  if (/^0+$/.test(key)) {
    if (config.production) {
      console.error("IP_ENCRYPTION_KEY örnek dosyadaki sıfır anahtar. Canlı sitede rastgele bir anahtar üretip .env dosyasına yazın.");
      process.exit(1);
    }
    console.warn("UYARI: IP_ENCRYPTION_KEY örnek dosyadaki sıfır anahtar (sadece bilgisayarda denemek için kabul edilir).");
  }
}

let repo: Repo;
if (config.databaseUrl) {
  repo = new PgRepo(config.databaseUrl, config.ipKey);
} else if (config.production) {
  console.error("Üretimde DATABASE_URL zorunludur (5651 trafik logları ve bildirimler).");
  process.exit(1);
} else {
  console.warn("UYARI: DATABASE_URL yok, kayıtlar bellekte tutuluyor (sadece geliştirme için).");
  repo = new MemoryRepo();
}

// Yönetim paneli anahtarı: yoksa panel canlı köşelere müdahale edemez (kayıtlar yine de işlenir)
let adminSecret = config.adminSecret;
if (adminSecret && adminSecret.length < 32) {
  console.warn("UYARI: ADMIN_SECRET 32 karakterden kısa, yönetim paneli bağlantısı kapalı.");
  adminSecret = undefined;
} else if (adminSecret === EXAMPLE_ADMIN_SECRET && config.production) {
  console.warn("UYARI: ADMIN_SECRET örnek dosyadaki değer. Canlı sitede kabul edilmez, yönetim paneli bağlantısı kapalı.");
  adminSecret = undefined;
} else if (!adminSecret) {
  console.warn("BİLGİ: ADMIN_SECRET yok, yönetim paneli canlı köşelerde mesaj gizleyemez / köşe kapatamaz.");
}

const rt = createRealtime({ repo, sessionSecret: config.sessionSecret, webOrigins: config.webOrigins, trustProxy: config.trustProxy, adminSecret });
rt.http.listen(config.port, () => console.log(`Gerçek zamanlı sunucu: http://localhost:${config.port}`));

// Saklama süresi dolan kayıtları günde bir sil
const purge = () => repo.purgeExpired(config.trafficRetentionDays).catch((e) => console.error("Temizlik başarısız", e));
purge();
setInterval(purge, 24 * 60 * 60 * 1000);

const shutdown = async () => {
  await rt.close();
  await repo.close();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
