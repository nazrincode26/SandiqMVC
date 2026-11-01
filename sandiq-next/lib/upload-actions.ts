"use server";

import { getCurrentUser } from "./auth";
import { createUploadTicket, readCloudinaryConfig, type UploadTicket } from "./cloudinary";
import { adminDb } from "./firebase/admin";
import { discardUnusedUploads } from "./images";
import { MAX_IMAGES } from "./money";

// Server actions (not route handlers) so Next.js' same-origin check applies.

const QUOTA_WINDOW_MS = 60 * 60 * 1000;
const QUOTA_PER_WINDOW = 100; // images a non-admin user may start uploading per hour

export type UploadTicketResult = { ok: true; ticket: UploadTicket } | { ok: false; error: "unauthorized" | "not_configured" | "quota" | "invalid" };

/** Counts requested uploads per user and hour so one account can't fill the Cloudinary quota. */
async function reserveQuota(uid: string, count: number): Promise<boolean> {
  const db = adminDb();
  const ref = db.collection("uploadQuotas").doc(uid);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const now = Date.now();
    const windowStart = Number(snap.get("windowStart") ?? 0);
    const used = now - windowStart < QUOTA_WINDOW_MS ? Number(snap.get("count") ?? 0) : 0;
    if (used + count > QUOTA_PER_WINDOW) return false;
    tx.set(ref, { windowStart: used === 0 ? now : windowStart, count: used + count });
    return true;
  });
}

/** Signed Cloudinary upload slots for the signed-in user's listing images. */
export async function requestUploadTicket(count: number): Promise<UploadTicketResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "unauthorized" };
  if (!Number.isSafeInteger(count) || count < 1 || count > MAX_IMAGES) return { ok: false, error: "invalid" };
  const config = readCloudinaryConfig();
  if (!config) return { ok: false, error: "not_configured" };
  if (!user.isAdmin && !(await reserveQuota(user.uid, count))) return { ok: false, error: "quota" };
  return { ok: true, ticket: createUploadTicket(config, user.uid, count) };
}

/** Removes images this user uploaded but could not attach (e.g. the form submission failed). */
export async function discardUploads(publicIds: string[]): Promise<void> {
  const user = await getCurrentUser();
  if (!user || !Array.isArray(publicIds)) return;
  await discardUnusedUploads(
    user.uid,
    publicIds.filter((id): id is string => typeof id === "string")
  );
}
