import { existsSync } from "node:fs";
import { resolve } from "node:path";

// Kök dizindeki .env dosyasını (varsa) yükle
for (const p of [resolve(process.cwd(), ".env"), resolve(process.cwd(), "../../.env")]) {
  if (existsSync(p)) {
    process.loadEnvFile(p);
    break;
  }
}

export const config = {
  port: Number(process.env.REALTIME_PORT ?? 4000),
  webOrigins: (process.env.WEB_ORIGIN ?? "http://localhost:3000").split(",").map((s) => s.trim()),
  sessionSecret: process.env.SESSION_SECRET,
  databaseUrl: process.env.DATABASE_URL,
  ipKey: process.env.IP_ENCRYPTION_KEY,
  /** Ters vekil (nginx vb.) arkasında gerçek IP için X-Forwarded-For'a güven */
  trustProxy: process.env.TRUST_PROXY === "1",
  /** 5651: trafik logları en az 1, en fazla 2 yıl saklanır */
  trafficRetentionDays: Number(process.env.TRAFFIC_RETENTION_DAYS ?? 730),
  production: process.env.NODE_ENV === "production",
};
