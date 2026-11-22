import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@sark/shared";
import { verifySession, type SessionPayload } from "@sark/shared/server";

/** Geçerli onay çerezi varsa oturum bilgisini döndürür. */
export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();
  return verifySession(jar.get(SESSION_COOKIE)?.value, process.env.SESSION_SECRET);
}
