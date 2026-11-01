import "server-only";
import { createHash, randomUUID } from "node:crypto";

/**
 * Cloudinary access for listing images, using its REST API directly (no SDK).
 * Only the server knows the API secret. The browser gets signed upload
 * parameters for public IDs chosen here, uploads the file to Cloudinary itself
 * (so large photos never pass through a Vercel function), and the server then
 * checks the stored asset before a listing may use it.
 */

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_FORMATS = ["jpg", "jpeg", "png", "gif", "webp", "avif", "heic", "heif"];

const API_HOST = "https://api.cloudinary.com/v1_1";
const DELIVERY_HOST = "https://res.cloudinary.com";
/** Delivery transformation stored with each URL: at most 1600px wide, best format and quality for the browser. */
const DELIVERY_TRANSFORMATION = "c_limit,w_1600,f_auto,q_auto";
const UID_RE = /^[A-Za-z0-9_-]{1,128}$/;
const FOLDER_RE = /^[A-Za-z0-9_-]+(\/[A-Za-z0-9_-]+)*$/;
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder: string;
  algorithm: "sha1" | "sha256";
}

export class CloudinaryError extends Error {
  readonly code: "not_configured" | "invalid_upload" | "request_failed";

  constructor(message: string, code: CloudinaryError["code"]) {
    super(message);
    this.name = "CloudinaryError";
    this.code = code;
  }
}

/** Reads the server-only Cloudinary settings, or returns null when they are missing. */
export function readCloudinaryConfig(env: NodeJS.ProcessEnv = process.env): CloudinaryConfig | null {
  const cloudName = env.CLOUDINARY_CLOUD_NAME?.trim() ?? "";
  const apiKey = env.CLOUDINARY_API_KEY?.trim() ?? "";
  const apiSecret = env.CLOUDINARY_API_SECRET?.trim() ?? "";
  if (!cloudName || !apiKey || !apiSecret) return null;
  if (!/^[A-Za-z0-9_-]+$/.test(cloudName) || !/^\d+$/.test(apiKey)) return null;
  const folder = (env.CLOUDINARY_UPLOAD_FOLDER?.trim() || "sandiq/listings").replace(/^\/+|\/+$/g, "");
  if (!FOLDER_RE.test(folder)) return null;
  const algorithm = env.CLOUDINARY_SIGNATURE_ALGORITHM?.trim().toLowerCase() === "sha256" ? "sha256" : "sha1";
  return { cloudName, apiKey, apiSecret, folder, algorithm };
}

export function cloudinaryConfig(): CloudinaryConfig {
  const config = readCloudinaryConfig();
  if (!config) {
    throw new CloudinaryError(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET (see .env.example).",
      "not_configured"
    );
  }
  return config;
}

export const isCloudinaryConfigured = () => readCloudinaryConfig() !== null;

/**
 * Cloudinary's request signature: parameters sorted by name, joined as
 * key=value with "&", the API secret appended, then hashed.
 */
export function signParams(params: Record<string, string | number>, apiSecret: string, algorithm: "sha1" | "sha256" = "sha1") {
  const payload = Object.keys(params)
    .filter((k) => params[k] !== "" && params[k] !== undefined && params[k] !== null)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash(algorithm).update(payload + apiSecret).digest("hex");
}

/** Folder that holds one user's listing images. */
export function userFolder(config: CloudinaryConfig, uid: string) {
  if (!UID_RE.test(uid)) throw new CloudinaryError("Unsupported user id", "invalid_upload");
  return `${config.folder}/${uid}`;
}

/** True when the public ID is one this app issued for this user's uploads. */
export function isOwnPublicId(config: CloudinaryConfig, uid: string, publicId: string) {
  if (!UID_RE.test(uid)) return false;
  return new RegExp(`^${escapeRegExp(config.folder)}/${escapeRegExp(uid)}/${UUID}$`).test(publicId);
}

/** True for any public ID inside this app's upload folder (used before deleting). */
export function isManagedPublicId(config: CloudinaryConfig, publicId: string) {
  return new RegExp(`^${escapeRegExp(config.folder)}/[A-Za-z0-9_-]{1,128}/${UUID}$`).test(publicId);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export interface UploadSlot {
  publicId: string;
  timestamp: number;
  signature: string;
}

export interface UploadTicket {
  uploadUrl: string;
  apiKey: string;
  /** Extra signed fields the browser must send unchanged with each file. */
  fields: Record<string, string>;
  slots: UploadSlot[];
  maxBytes: number;
}

/**
 * Signs one upload per image. Each slot is bound to a server-chosen public ID
 * in the user's folder; `overwrite=false` stops a reused signature from
 * replacing an image that is already stored. Signatures expire after an hour.
 */
export function createUploadTicket(config: CloudinaryConfig, uid: string, count: number, now = Date.now()): UploadTicket {
  const folder = userFolder(config, uid);
  const timestamp = Math.floor(now / 1000);
  const fields = { allowed_formats: ALLOWED_FORMATS.join(","), overwrite: "false" };
  const slots = Array.from({ length: count }, () => {
    const publicId = `${folder}/${randomUUID()}`;
    return {
      publicId,
      timestamp,
      signature: signParams({ ...fields, public_id: publicId, timestamp }, config.apiSecret, config.algorithm),
    };
  });
  return {
    uploadUrl: `${API_HOST}/${config.cloudName}/image/upload`,
    apiKey: config.apiKey,
    fields,
    slots,
    maxBytes: MAX_IMAGE_BYTES,
  };
}

export interface CloudinaryResource {
  public_id: string;
  version: number;
  format: string;
  resource_type: string;
  type: string;
  bytes: number;
}

/** Delivery URL stored in Firestore and used directly in <img> tags. */
export function deliveryUrl(config: Pick<CloudinaryConfig, "cloudName">, resource: Pick<CloudinaryResource, "public_id" | "version">) {
  return `${DELIVERY_HOST}/${config.cloudName}/image/upload/${DELIVERY_TRANSFORMATION}/v${resource.version}/${resource.public_id}`;
}

/** Why a stored asset may not be attached to a listing, or null when it is fine. */
export function resourceProblem(resource: CloudinaryResource | undefined): string | null {
  if (!resource) return "missing";
  if (resource.resource_type !== "image" || resource.type !== "upload") return "not an uploaded image";
  if (!ALLOWED_FORMATS.includes(String(resource.format).toLowerCase())) return "format not allowed";
  if (!(Number(resource.bytes) > 0) || Number(resource.bytes) > MAX_IMAGE_BYTES) return "too large";
  if (!Number.isSafeInteger(Number(resource.version))) return "missing version";
  return null;
}

function basicAuth(config: CloudinaryConfig) {
  return "Basic " + Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString("base64");
}

/** Admin API "get resources by public IDs" — one request for up to 100 images. */
export async function fetchImageResources(config: CloudinaryConfig, publicIds: string[]): Promise<Map<string, CloudinaryResource>> {
  const result = new Map<string, CloudinaryResource>();
  for (let i = 0; i < publicIds.length; i += 100) {
    const query = new URLSearchParams();
    publicIds.slice(i, i + 100).forEach((id) => query.append("public_ids[]", id));
    query.set("max_results", "100");
    const res = await fetch(`${API_HOST}/${config.cloudName}/resources/image/upload?${query}`, {
      headers: { Authorization: basicAuth(config) },
      cache: "no-store",
    });
    if (!res.ok) throw new CloudinaryError(`Cloudinary lookup failed (HTTP ${res.status})`, "request_failed");
    const body = (await res.json()) as { resources?: CloudinaryResource[] };
    for (const r of body.resources ?? []) result.set(r.public_id, r);
  }
  return result;
}

/** Upload API "destroy". Returns true when the image is gone (deleted now or already missing). */
export async function destroyImage(config: CloudinaryConfig, publicId: string, now = Date.now()): Promise<boolean> {
  const params = { invalidate: "true", public_id: publicId, timestamp: Math.floor(now / 1000) };
  const body = new URLSearchParams({
    ...params,
    timestamp: String(params.timestamp),
    api_key: config.apiKey,
    signature: signParams(params, config.apiSecret, config.algorithm),
  });
  const res = await fetch(`${API_HOST}/${config.cloudName}/image/destroy`, { method: "POST", body, cache: "no-store" });
  if (!res.ok) return false;
  const data = (await res.json().catch(() => ({}))) as { result?: string };
  return data.result === "ok" || data.result === "not found";
}
