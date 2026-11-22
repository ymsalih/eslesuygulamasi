import { config } from "./config";
import { MemoryRepo, PgRepo, type Repo } from "./repo";
import { createRealtime } from "./server";

if (!config.sessionSecret || config.sessionSecret.length < 32) {
  console.error("SESSION_SECRET tanımlı değil veya 32 karakterden kısa. Proje klasöründe .env dosyası olmalı (bkz. .env.example).");
  process.exit(1);
}
if (config.usingDevSecret) console.warn("BİLGİ: .env bulunamadı, yerel deneme anahtarı kullanılıyor (sadece bilgisayarda denemek için).");

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

const rt = createRealtime({ repo, sessionSecret: config.sessionSecret, webOrigins: config.webOrigins, trustProxy: config.trustProxy });
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
