import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { DEV_SESSION_SECRET } from "@sark/shared/server";

/**
 * .env dosyasını okur (Node sürümünden bağımsız). Zaten tanımlı değişkenlerin üzerine yazmaz.
 * Windows'ta not defteriyle oluşturulup ".env.txt" olarak kaydedilen dosyayı da tanır ve uyarır.
 */
function loadEnvFile(dirs: string[]): void {
  for (const dir of dirs) {
    for (const name of [".env", ".env.txt"]) {
      const p = resolve(dir, name);
      if (!existsSync(p)) continue;
      if (name === ".env.txt") console.warn(`UYARI: ${p} bulundu. Dosyanın adı ".env" olmalı (sonunda .txt olmadan).`);
      for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
        if (!m || line.trim().startsWith("#")) continue;
        const value = m[2].replace(/^(['"])(.*)\1$/, "$2");
        if (process.env[m[1]] === undefined) process.env[m[1]] = value;
      }
      return;
    }
  }
}

// Kök dizindeki .env dosyasını (varsa) yükle
loadEnvFile([process.cwd(), resolve(process.cwd(), "../..")]);

/** `npm run dev` ile başlatıldıysa (yerel deneme) */
const isDev = process.argv.includes("--dev") && process.env.NODE_ENV !== "production";

export const config = {
  port: Number(process.env.REALTIME_PORT ?? 4000),
  webOrigins: (process.env.WEB_ORIGIN ?? "http://localhost:3000").split(",").map((s) => s.trim()),
  sessionSecret: process.env.SESSION_SECRET || (isDev ? DEV_SESSION_SECRET : undefined),
  usingDevSecret: !process.env.SESSION_SECRET && isDev,
  databaseUrl: process.env.DATABASE_URL,
  /** Yönetim panelinin iç uç noktayı (/internal/admin) çağırırken kullandığı anahtarın kaynağı */
  adminSecret: process.env.ADMIN_SECRET,
  ipKey: process.env.IP_ENCRYPTION_KEY,
  /** Ters vekil (nginx vb.) arkasında gerçek IP için X-Forwarded-For'a güven */
  trustProxy: process.env.TRUST_PROXY === "1",
  /** 5651: trafik logları en az 1, en fazla 2 yıl saklanır */
  trafficRetentionDays: Number(process.env.TRAFFIC_RETENTION_DAYS ?? 730),
  production: process.env.NODE_ENV === "production",
};
