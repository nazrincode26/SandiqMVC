"use client";

import { signOut, type UserCredential } from "firebase/auth";
import { clientAuth } from "../firebase/client";

export interface SessionResult {
  ok: boolean;
  status: number;
  needsPhone?: boolean;
  message?: string;
}

/** Sends the fresh ID token to the server, which sets the httpOnly session cookie. */
export async function establishSession(credential: UserCredential, mode: "site" | "admin" = "site"): Promise<SessionResult> {
  const idToken = await credential.user.getIdToken();
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, mode }),
  });
  // The browser's Firebase state is not needed once the cookie exists.
  await signOut(clientAuth()).catch(() => {});
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, needsPhone: data.needsPhone, message: data.message };
}

/** Url.IsLocalUrl */
export function localReturnUrl(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  return value;
}

/** Reads ReturnUrl/returnUrl case-insensitively, like MVC model binding. */
export function getReturnUrlParam(): string | null {
  const params = new URLSearchParams(window.location.search);
  for (const [key, value] of params) if (key.toLowerCase() === "returnurl") return value;
  return null;
}
