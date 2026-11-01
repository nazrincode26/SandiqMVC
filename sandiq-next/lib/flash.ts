import "server-only";
import { cookies } from "next/headers";

// TempData["Message"] replacement: a one-time message carried across a redirect.
const FLASH_COOKIE = "flash";

export async function setFlash(message: string) {
  (await cookies()).set(FLASH_COOKIE, encodeURIComponent(message), { path: "/", maxAge: 60, sameSite: "lax" });
}

export async function readFlash(): Promise<string | null> {
  const raw = (await cookies()).get(FLASH_COOKIE)?.value;
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return null;
  }
}
