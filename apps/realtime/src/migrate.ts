/** Basit migration çalıştırıcı: infra/migrations altındaki .sql dosyalarını sırayla bir kez uygular. */
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";
import { config } from "./config";

const dir = resolve(import.meta.dirname, "../../../infra/migrations");

async function main() {
  if (!config.databaseUrl) throw new Error("DATABASE_URL tanımlı değil.");
  const client = new pg.Client({ connectionString: config.databaseUrl });
  await client.connect();
  await client.query("CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())");
  const done = new Set((await client.query("SELECT name FROM schema_migrations")).rows.map((r) => r.name));
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
    if (done.has(file)) continue;
    console.log(`Uygulanıyor: ${file}`);
    await client.query("BEGIN");
    await client.query(readFileSync(resolve(dir, file), "utf8"));
    await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
    await client.query("COMMIT");
  }
  await client.end();
  console.log("Veritabanı güncel.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
