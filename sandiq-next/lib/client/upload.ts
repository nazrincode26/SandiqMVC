"use client";

import { discardUploads, requestUploadTicket } from "../upload-actions";

/** Same limit the server enforces (lib/cloudinary.ts). */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export class UploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadError";
  }
}

const MESSAGES = {
  not_configured: "Şəkil yükləmə hazırda mümkün deyil. Zəhmət olmasa, sonra yenidən cəhd edin.",
  quota: "Çox sayda şəkil yükləndi. Zəhmət olmasa, bir az sonra yenidən cəhd edin.",
  failed: "Şəkillər yüklənə bilmədi. Yalnız 10 MB-dan kiçik şəkil faylları qəbul olunur.",
};

/** Client-side pre-check; the server checks every image again. */
export function imageFileProblem(file: File): string | null {
  if (!file.type.startsWith("image/")) return `${file.name}: yalnız şəkil faylları qəbul olunur`;
  if (file.size > MAX_IMAGE_BYTES) return `${file.name}: şəkil 10 MB-dan böyük ola bilməz`;
  return null;
}

/**
 * Uploads listing images straight to Cloudinary with server-signed parameters
 * (each file gets its own signed public ID in the user's folder). Returns the
 * public IDs in the order given. If any file fails, the ones already uploaded
 * are discarded and an UploadError is thrown.
 */
export async function uploadListingImages(files: File[]): Promise<string[]> {
  if (!files.length) return [];
  for (const file of files) {
    const problem = imageFileProblem(file);
    if (problem) throw new UploadError(problem);
  }

  const result = await requestUploadTicket(files.length);
  if (!result.ok) {
    throw new UploadError(result.error === "not_configured" ? MESSAGES.not_configured : result.error === "quota" ? MESSAGES.quota : MESSAGES.failed);
  }
  const { ticket } = result;

  const uploaded: string[] = [];
  async function uploadOne(file: File, index: number) {
    const slot = ticket.slots[index];
    const body = new FormData();
    body.append("file", file);
    body.append("api_key", ticket.apiKey);
    body.append("timestamp", String(slot.timestamp));
    body.append("public_id", slot.publicId);
    for (const [key, value] of Object.entries(ticket.fields)) body.append(key, value);
    body.append("signature", slot.signature);
    const res = await fetch(ticket.uploadUrl, { method: "POST", body });
    const data = (await res.json().catch(() => ({}))) as { public_id?: string };
    if (!res.ok || data.public_id !== slot.publicId) throw new UploadError(MESSAGES.failed);
    uploaded.push(slot.publicId);
  }

  try {
    // A few uploads at a time keeps mobile connections responsive.
    // allSettled so every started upload has finished before a failure is handled.
    for (let i = 0; i < files.length; i += 3) {
      const results = await Promise.allSettled(files.slice(i, i + 3).map((file, j) => uploadOne(file, i + j)));
      const failed = results.find((r) => r.status === "rejected");
      if (failed) throw failed.reason;
    }
  } catch (error) {
    if (uploaded.length) await discardUploads(uploaded).catch(() => {});
    throw error instanceof UploadError ? error : new UploadError(MESSAGES.failed);
  }
  return ticket.slots.slice(0, files.length).map((s) => s.publicId);
}

/** Tells the server to delete uploads that could not be attached to a listing. */
export function discardListingImages(publicIds: string[]) {
  if (publicIds.length) discardUploads(publicIds).catch(() => {});
}
