import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { adminAuth, adminDb } from "./firebase/admin";

export const SESSION_COOKIE = "__session";
export const SESSION_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000; // ASP.NET cookie auth default

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  phone: string | null;
  isAdmin: boolean;
  googleId: string | null;
}

export function profileFromDoc(uid: string, data: FirebaseFirestore.DocumentData | undefined): UserProfile | null {
  if (!data) return null;
  return {
    uid,
    fullName: data.fullName ?? "",
    email: data.email ?? "",
    phone: data.phone ?? null,
    isAdmin: data.isAdmin === true,
    googleId: data.googleId ?? null,
  };
}

/** The signed-in user for this request, verified from the session cookie. */
export const getCurrentUser = cache(async (): Promise<UserProfile | null> => {
  const cookie = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!cookie) return null;
  try {
    const decoded = await adminAuth().verifySessionCookie(cookie);
    const snap = await adminDb().collection("users").doc(decoded.uid).get();
    return profileFromDoc(decoded.uid, snap.data());
  } catch {
    return null;
  }
});

async function currentPathAndQuery(): Promise<string> {
  const h = await headers();
  return h.get("x-sandiq-path") ?? "/";
}

/** [Authorize] — redirects anonymous users to the login page with a ReturnUrl. */
export async function requireUser(returnUrl?: string): Promise<UserProfile> {
  const user = await getCurrentUser();
  if (!user) {
    const target = returnUrl ?? (await currentPathAndQuery());
    redirect(`/account/login?ReturnUrl=${encodeURIComponent(target)}`);
  }
  return user;
}

/** [Authorize(Roles = "Admin")] for the admin area. */
export async function requireAdmin(): Promise<UserProfile> {
  const user = await getCurrentUser();
  if (!user) {
    const target = await currentPathAndQuery();
    redirect(`/admin/account/login?returnUrl=${encodeURIComponent(target)}`);
  }
  if (!user.isAdmin) redirect("/admin/account/login");
  return user;
}

/** Only allow local redirects, like Url.IsLocalUrl. */
export function safeReturnUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  return value;
}

/** Batch-loads display names for user ids (missing users map to undefined). */
export async function getUserNames(uids: Iterable<string>): Promise<Map<string, string>> {
  const ids = [...new Set([...uids].filter(Boolean))];
  const result = new Map<string, string>();
  if (!ids.length) return result;
  const db = adminDb();
  const snaps = await db.getAll(...ids.map((id) => db.collection("users").doc(id)));
  for (const snap of snaps) {
    if (snap.exists) result.set(snap.id, snap.get("fullName") ?? "");
  }
  return result;
}
