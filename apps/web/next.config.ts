import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { NextConfig } from "next";

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

// Kök dizindeki .env dosyasını (varsa) yükle: web ve gerçek zamanlı sunucu aynı ayarları kullanır
loadEnvFile([resolve(process.cwd(), "../.."), process.cwd()]);

const nextConfig: NextConfig = {
  transpilePackages: ["@sark/shared"],
  serverExternalPackages: ["pg"],
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
