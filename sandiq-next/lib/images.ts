import "server-only";
import {
  CloudinaryError,
  cloudinaryConfig,
  destroyImage,
  deliveryUrl,
  fetchImageResources,
  isManagedPublicId,
  isOwnPublicId,
  readCloudinaryConfig,
  resourceProblem,
} from "./cloudinary";
import { adminDb } from "./firebase/admin";
import { MAX_IMAGES } from "./money";

/** Images attached to a listing: delivery URLs plus the Cloudinary public IDs behind them. */
export interface StoredImages {
  urls: string[];
  publicIds: string[];
}

export const UPLOAD_FAILED_MESSAGE = "Şəkillər yüklənə bilmədi. Yalnız 10 MB-dan kiçik şəkil faylları qəbul olunur.";

/**
 * Checks images the browser uploaded for this user and returns their delivery
 * URLs (in the order given). Rejects public IDs outside the user's folder,
 * missing assets, non-images and files over 10 MB, so a client can't attach
 * someone else's images. Rejected assets that belong to the user are deleted.
 */
export async function finalizeUploads(uid: string, publicIds: string[]): Promise<StoredImages> {
  const unique = [...new Set(publicIds)];
  if (!unique.length) return { urls: [], publicIds: [] };
  if (unique.length > MAX_IMAGES) throw new CloudinaryError("Too many images", "invalid_upload");

  const config = cloudinaryConfig();
  if (unique.some((id) => !isOwnPublicId(config, uid, id))) throw new CloudinaryError("Invalid upload", "invalid_upload");

  const resources = await fetchImageResources(config, unique);
  const rejected = unique.filter((id) => resourceProblem(resources.get(id)) !== null);
  if (rejected.length) {
    await deleteImages(rejected.filter((id) => resources.has(id)));
    throw new CloudinaryError("Invalid upload", "invalid_upload");
  }
  return { urls: unique.map((id) => deliveryUrl(config, resources.get(id)!)), publicIds: unique };
}

/**
 * Best-effort removal of Cloudinary images that nothing uses any more. Only IDs
 * inside the app's upload folder are touched; legacy /uploads/... files are never
 * deleted. Failures are logged and left for a manual cleanup — they never undo
 * the Firestore change that made the image unused.
 */
export async function deleteImages(publicIds: Iterable<string>): Promise<void> {
  const config = readCloudinaryConfig();
  const ids = [...new Set(publicIds)];
  if (!config || !ids.length) return;
  await Promise.all(
    ids
      .filter((id) => isManagedPublicId(config, id))
      .map(async (id) => {
        try {
          if (!(await destroyImage(config, id))) console.warn(`[images] Could not delete Cloudinary image ${id}`);
        } catch (error) {
          console.warn(`[images] Could not delete Cloudinary image ${id}: ${(error as Error).message}`);
        }
      })
  );
}

/** Cloudinary public IDs stored on a product or listing request document. */
export function publicIdsOf(data: FirebaseFirestore.DocumentData | undefined): string[] {
  const ids = data?.imagePublicIds;
  return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : [];
}

/** Of the given IDs, those that a product or listing request still refers to. */
async function referencedIds(publicIds: string[]): Promise<Set<string>> {
  const referenced = new Set<string>();
  const db = adminDb();
  for (let i = 0; i < publicIds.length; i += 30) {
    const chunk = publicIds.slice(i, i + 30);
    const [products, requests] = await Promise.all([
      db.collection("products").where("imagePublicIds", "array-contains-any", chunk).get(),
      db.collection("listingRequests").where("imagePublicIds", "array-contains-any", chunk).get(),
    ]);
    for (const doc of [...products.docs, ...requests.docs]) {
      for (const id of publicIdsOf(doc.data())) referenced.add(id);
    }
  }
  return referenced;
}

/**
 * Deletes uploads of this user that were never attached to a listing (a failed
 * or abandoned form submission). Images used by any listing or request are kept.
 */
export async function discardUnusedUploads(uid: string, publicIds: string[]): Promise<void> {
  const config = readCloudinaryConfig();
  if (!config) return;
  const own = [...new Set(publicIds)].filter((id) => isOwnPublicId(config, uid, id)).slice(0, MAX_IMAGES * 2);
  if (!own.length) return;
  const referenced = await referencedIds(own);
  await deleteImages(own.filter((id) => !referenced.has(id)));
}
