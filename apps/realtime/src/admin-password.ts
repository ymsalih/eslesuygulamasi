/**
 * Yönetici parolası için .env satırları üretir: `npm run yonetici:parola`
 * Parola ekrana yazılmaz, sadece özeti (hash) yazdırılır.
 */
import { randomBytes } from "node:crypto";
import { stdin, stdout } from "node:process";
import { hashAdminPassword } from "@sark/shared/server";

/** Yazılanı ekranda göstermeden bir satır okur. */
function askHidden(question: string): Promise<string> {
  return new Promise((resolve) => {
    stdout.write(question);
    if (!stdin.isTTY) {
      // Yönlendirilmiş girişten (ör. echo parola | npm run ...) oku
      let data = "";
      stdin.setEncoding("utf8");
      stdin.on("data", (c) => (data += c));
      stdin.on("end", () => resolve(data.split(/\r?\n/)[0] ?? ""));
      return;
    }
    let value = "";
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    const onData = (ch: string) => {
      for (const c of ch) {
        if (c === "\r" || c === "\n") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", onData);
          stdout.write("\n");
          return resolve(value);
        }
        if (c === "\u0003") process.exit(1); // Ctrl+C
        if (c === "\u007f" || c === "\b") value = value.slice(0, -1);
        else value += c;
      }
    };
    stdin.on("data", onData);
  });
}

async function main() {
  const pw = await askHidden("Yönetici parolası (en az 12 karakter): ");
  if (pw.length < 12) {
    console.error("Parola en az 12 karakter olmalı.");
    process.exit(1);
  }
  if (stdin.isTTY) {
    const again = await askHidden("Parolayı tekrar yaz: ");
    if (again !== pw) {
      console.error("Parolalar aynı değil.");
      process.exit(1);
    }
  }
  console.log("\n.env dosyasına şu satırları yaz (eski ADMIN_ satırlarının yerine):\n");
  console.log(`ADMIN_PASSWORD_HASH=${hashAdminPassword(pw)}`);
  console.log(`ADMIN_SECRET=${randomBytes(32).toString("hex")}`);
  console.log("\nADMIN_SECRET'i değiştirirsen açık yönetici oturumları kapanır. Web sitesi ve sohbet sunucusu aynı .env'i kullanmalı.");
}

main();
