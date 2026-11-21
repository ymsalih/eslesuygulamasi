import "server-only";
import pg from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __sarkPool: pg.Pool | undefined;
}

/** DATABASE_URL tanımlı değilse null döner (sadece geliştirmede izin verilir). */
export function db(): pg.Pool | null {
  const url = process.env.DATABASE_URL;
  if (!url) {
    if (process.env.NODE_ENV === "production") throw new Error("Üretimde DATABASE_URL zorunludur.");
    return null;
  }
  globalThis.__sarkPool ??= new pg.Pool({ connectionString: url, max: 5 });
  return globalThis.__sarkPool;
}

export function clientIp(headers: Headers): string {
  if (process.env.TRUST_PROXY === "1") {
    const fwd = headers.get("x-forwarded-for");
    if (fwd) return fwd.split(",")[0].trim();
  }
  return headers.get("x-real-ip") ?? "0.0.0.0";
}
