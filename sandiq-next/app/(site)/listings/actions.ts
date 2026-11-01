"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { requireUser } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import { nextId, parseId } from "@/lib/data/common";
import { getProduct } from "@/lib/data/products";
import { setFlash } from "@/lib/flash";
import { readListingForm, validateListing } from "@/lib/listing";
import { CloudinaryError } from "@/lib/cloudinary";
import { discardUnusedUploads, finalizeUploads, UPLOAD_FAILED_MESSAGE, type StoredImages } from "@/lib/images";
import { str, type FieldErrors } from "@/lib/validation";

export interface ListingFormResult {
  fields?: FieldErrors;
  summary?: string[];
  /** Edit only: a request is already waiting, so the edit will be refused. */
  pendingExists?: boolean;
}

const PENDING_EXISTS = "Bu elan üçün artıq gözləyən sorğu var. Admin baxana qədər yeni sorğu göndərə bilməzsiniz.";

/**
 * Verifies the uploaded images and returns their URLs and public IDs, or null
 * (after deleting the user's unusable uploads) when they can't be attached.
 */
async function attachUploads(uid: string, publicIds: string[]): Promise<StoredImages | null> {
  try {
    return await finalizeUploads(uid, publicIds);
  } catch (error) {
    if (!(error instanceof CloudinaryError)) throw error;
    console.warn(`[listings] Images rejected: ${error.message}`);
    await discardUnusedUploads(uid, publicIds);
    return null;
  }
}

/**
 * Server-side validation run before the browser uploads images, so images are
 * not uploaded for a form that will be rejected anyway.
 */
export async function checkListingAction(mode: "create" | "edit", form: FormData): Promise<ListingFormResult> {
  const user = await requireUser();
  const v = readListingForm(form);
  const imageCount = Number(str(form, "ImageCount") || 0);
  const { fields, summary } = await validateListing(v, { requireTerms: mode === "create", imageCount });
  if (mode === "edit" && !Object.keys(fields).length && !summary.length) {
    const id = parseId(str(form, "Id"));
    const product = id ? await getProduct(id) : null;
    if (product && product.submittedByUserId === user.uid) {
      const pending = await adminDb()
        .collection("listingRequests")
        .where("productId", "==", product.id)
        .where("status", "==", "pending")
        .limit(1)
        .get();
      if (!pending.empty) return { fields, summary, pendingExists: true };
    }
  }
  return { fields, summary };
}

/** ListingsController.Create (POST) — new listings wait for admin approval. */
export async function createListingAction(form: FormData): Promise<ListingFormResult> {
  const user = await requireUser("/listings/create");
  const v = readListingForm(form);
  const { fields, summary } = await validateListing(v, { requireTerms: true, imageCount: v.imagePaths.length });
  if (Object.keys(fields).length || summary.length) {
    await discardUnusedUploads(user.uid, v.imagePaths);
    return { fields, summary };
  }

  const stored = await attachUploads(user.uid, v.imagePaths);
  if (!stored) return { summary: [UPLOAD_FAILED_MESSAGE] };
  const db = adminDb();
  try {
    await db.runTransaction(async (tx) => {
      const id = await nextId(tx, "products");
      tx.create(db.collection("products").doc(String(id)), {
        id,
        title: v.title,
        description: v.description,
        price: v.price,
        image: stored.urls[0] ?? null,
        images: stored.urls,
        imagePublicIds: stored.publicIds,
        condition: v.condition,
        location: v.location,
        categoryId: v.categoryId,
        subcategoryId: v.subcategoryId,
        submittedByUserId: user.uid,
        status: "pending",
        createdAt: FieldValue.serverTimestamp(),
        approvedAt: null,
        viewCount: 0,
      });
    });
  } catch (error) {
    // Nothing refers to the new images yet, so they can go.
    await discardUnusedUploads(user.uid, stored.publicIds);
    throw error;
  }

  redirect("/");
}

/** Creates a listing request unless one is already pending for the product. */
async function createRequest(productId: number, data: Record<string, unknown>): Promise<boolean> {
  const db = adminDb();
  return db.runTransaction(async (tx) => {
    const pending = await tx.get(
      db.collection("listingRequests").where("productId", "==", productId).where("status", "==", "pending").limit(1)
    );
    if (!pending.empty) return false;
    tx.create(db.collection("listingRequests").doc(), {
      productId,
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
      reviewedAt: null,
      ...data,
    });
    return true;
  });
}

/** ListingsController.Edit (POST) — changes go to the admin as an edit request. */
export async function editListingAction(form: FormData): Promise<ListingFormResult> {
  const id = parseId(str(form, "Id"));
  const user = await requireUser(id ? `/listings/edit/${id}` : "/listings/mylistings");
  const product = id ? await getProduct(id) : null;
  if (!product || product.submittedByUserId !== user.uid) redirect("/not-found");

  const v = readListingForm(form);
  const { fields, summary } = await validateListing(v, { requireTerms: false, imageCount: v.imagePaths.length });
  if (Object.keys(fields).length || summary.length) {
    await discardUnusedUploads(user.uid, v.imagePaths);
    return { fields, summary };
  }

  const stored = await attachUploads(user.uid, v.imagePaths);
  if (!stored) return { summary: [UPLOAD_FAILED_MESSAGE] };
  let created: boolean;
  try {
    // New images stay on the request until the admin approves it; the listing keeps its current ones.
    created = await createRequest(product.id, {
      requestedByUserId: user.uid,
      type: "edit",
      title: v.title,
      description: v.description,
      price: v.price,
      categoryId: v.categoryId,
      subcategoryId: v.subcategoryId,
      condition: v.condition,
      location: v.location,
      image: stored.urls[0] ?? null,
      images: stored.urls.length ? stored.urls : null,
      imagePublicIds: stored.publicIds.length ? stored.publicIds : null,
    });
  } catch (error) {
    await discardUnusedUploads(user.uid, stored.publicIds);
    throw error;
  }
  // A request was already pending, so these images are not used anywhere.
  if (!created) await discardUnusedUploads(user.uid, stored.publicIds);

  await setFlash(created ? "Redaktə sorğunuz göndərildi. Admin təsdiqindən sonra dəyişikliklər tətbiq olunacaq." : PENDING_EXISTS);
  revalidatePath("/listings/mylistings");
  redirect("/listings/mylistings");
}

/** ListingsController.Delete (POST) — asks the admin to delete the listing. */
export async function deleteListingAction(form: FormData) {
  const id = parseId(str(form, "id"));
  const user = await requireUser("/listings/mylistings");
  const product = id ? await getProduct(id) : null;
  if (!product || product.submittedByUserId !== user.uid) redirect("/not-found");

  const created = await createRequest(product.id, { requestedByUserId: user.uid, type: "delete" });
  await setFlash(created ? "Silmə sorğunuz göndərildi. Admin təsdiqindən sonra elan silinəcək." : PENDING_EXISTS);
  revalidatePath("/listings/mylistings");
  redirect("/listings/mylistings");
}
