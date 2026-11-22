import "server-only";
import { DEV_SESSION_SECRET } from "@sark/shared/server";

/**
 * Oturum anahtarı. Bilgisayarda denerken .env yoksa sabit deneme anahtarı kullanılır
 * (gerçek zamanlı sunucu da `npm run dev` ile aynısını kullanır). Canlı sitede zorunludur.
 */
export function sessionSecret(): string | undefined {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  return process.env.NODE_ENV === "production" ? undefined : DEV_SESSION_SECRET;
}
