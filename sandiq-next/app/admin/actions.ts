"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { requireAdmin } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import { getAllCategories } from "@/lib/data/categories";
import { invalidate, nextId, parseId, TAGS } from "@/lib/data/common";
import { productRef } from "@/lib/data/products";
import { setFlash } from "@/lib/flash";
import { readListingForm } from "@/lib/listing";
import { CloudinaryError } from "@/lib/cloudinary";
import { deleteImages, discardUnusedUploads, finalizeUploads, publicIdsOf, type StoredImages } from "@/lib/images";
import { optionalInt, str } from "@/lib/validation";

const db = () => adminDb();

function refreshAdmin() {
  revalidatePath("/admin", "layout");
}

// ---------------------------------------------------------------- Categories

export interface CategoryFormState {
  nameError?: string;
  values?: { Id: string; Name: string; NameRu: string; NameEn: string; Icon: string };
}

function readCategoryForm(form: FormData) {
  const opt = (k: string) => (str(form, k).trim() ? str(form, k) : null);
  return {
    id: parseId(str(form, "Id")),
    name: str(form, "Name"),
    nameRu: opt("NameRu"),
    nameEn: opt("NameEn"),
    icon: opt("Icon"),
    parentId: optionalInt(str(form, "ParentId")),
  };
}

/** CategoriesController.Create (POST) — used by the modal and the standalone page. */
export async function createCategory(_prev: CategoryFormState | undefined, form: FormData): Promise<CategoryFormState> {
  await requireAdmin();
  const c = readCategoryForm(form);
  if (!c.name.trim()) {
    return { nameError: "Ad tələb olunur", values: { Id: "0", Name: c.name, NameRu: c.nameRu ?? "", NameEn: c.nameEn ?? "", Icon: c.icon ?? "" } };
  }
  let parentId: number | null = null;
  if (c.parentId) {
    const parent = (await getAllCategories()).find((x) => x.id === c.parentId && x.parentId === null);
    if (!parent) throw new Error("Parent category not found");
    parentId = parent.id;
  }
  await db().runTransaction(async (tx) => {
    const id = await nextId(tx, "categories");
    tx.create(db().collection("categories").doc(String(id)), {
      id,
      name: c.name,
      nameRu: c.nameRu,
      nameEn: c.nameEn,
      icon: c.icon,
      parentId,
    });
  });
  invalidate(TAGS.categories);
  refreshAdmin();
  redirect("/admin/categories");
}

/** Plain form action for the modal on the categories list. */
export async function createCategoryFromModal(form: FormData) {
  const result = await createCategory(undefined, form);
  if (result.nameError) redirect("/admin/categories/create");
}

/** CategoriesController.Edit (POST) — the parent never changes. */
export async function editCategory(_prev: CategoryFormState | undefined, form: FormData): Promise<CategoryFormState> {
  await requireAdmin();
  const c = readCategoryForm(form);
  if (!c.name.trim()) {
    return {
      nameError: "Ad tələb olunur",
      values: { Id: String(c.id ?? 0), Name: c.name, NameRu: c.nameRu ?? "", NameEn: c.nameEn ?? "", Icon: c.icon ?? "" },
    };
  }
  const ref = db().collection("categories").doc(String(c.id ?? 0));
  if (!c.id || !(await ref.get()).exists) redirect("/not-found");
  await ref.update({ name: c.name, nameRu: c.nameRu, nameEn: c.nameEn, icon: c.icon });
  invalidate(TAGS.categories);
  refreshAdmin();
  redirect("/admin/categories");
}

export async function editCategoryFromModal(form: FormData) {
  const result = await editCategory(undefined, form);
  if (result.nameError) redirect(`/admin/categories/edit/${parseId(str(form, "Id")) ?? 0}`);
}

/**
 * CategoriesController.Delete. The SQL schema refused to delete a category that
 * still had subcategories or listings (DeleteBehavior.Restrict); the same rule
 * applies here. Its search keywords are removed with it (Cascade).
 */
export async function deleteCategory(form: FormData) {
  await requireAdmin();
  const id = parseId(str(form, "id"));
  const ref = db().collection("categories").doc(String(id ?? 0));
  if (!id || !(await ref.get()).exists) redirect("/not-found");

  const [subs, byCategory, bySubcategory] = await Promise.all([
    db().collection("categories").where("parentId", "==", id).limit(1).get(),
    db().collection("products").where("categoryId", "==", id).limit(1).get(),
    db().collection("products").where("subcategoryId", "==", id).limit(1).get(),
  ]);
  if (!subs.empty || !byCategory.empty || !bySubcategory.empty) {
    throw new Error("Category is still referenced by subcategories or listings.");
  }

  const keywords = await db().collection("searchKeywords").where("categoryId", "==", id).get();
  const batch = db().batch();
  keywords.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(ref);
  await batch.commit();
  invalidate(TAGS.categories, TAGS.keywords);
  refreshAdmin();
  redirect("/admin/categories");
}

// ------------------------------------------------------------------ Listings

async function setProductStatus(form: FormData, status: string, extra: Record<string, unknown> = {}) {
  await requireAdmin();
  const id = parseId(str(form, "id"));
  const ref = productRef(id ?? 0);
  if (!id || !(await ref.get()).exists) redirect("/not-found");
  await ref.update({ status, ...extra });
  invalidate(TAGS.products);
  refreshAdmin();
}

/** ListingsController.Approve */
export async function approveListing(form: FormData) {
  await setProductStatus(form, "approved", { approvedAt: FieldValue.serverTimestamp() });
  redirect("/admin/listings");
}

/** ListingsController.Reject */
export async function rejectListing(form: FormData) {
  await setProductStatus(form, "rejected");
  redirect("/admin/listings");
}

/** ListingsController.SoftDelete */
export async function softDeleteListing(form: FormData) {
  await setProductStatus(form, "deleted");
  redirect("/admin/listings/alllistings");
}

/** ListingsController.Restore */
export async function restoreListing(form: FormData) {
  await setProductStatus(form, "approved");
  redirect("/admin/listings/alllistings");
}

/**
 * ListingsController.HardDelete. Reviews and listing requests go with the
 * listing (Cascade); a listing that appears in an order cannot be removed (Restrict).
 */
export async function hardDeleteListing(form: FormData) {
  await requireAdmin();
  const id = parseId(str(form, "id"));
  const ref = productRef(id ?? 0);
  if (!id || !(await ref.get()).exists) redirect("/not-found");

  const ordered = await db().collection("orders").where("productIds", "array-contains", id).limit(1).get();
  if (!ordered.empty) throw new Error("Listing is referenced by an order.");

  const [product, requests] = await Promise.all([ref.get(), db().collection("listingRequests").where("productId", "==", id).get()]);
  const imageIds = [...publicIdsOf(product.data()), ...requests.docs.flatMap((d) => publicIdsOf(d.data()))];
  const batch = db().batch();
  requests.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  await db().recursiveDelete(ref);
  // Only after the listing is gone, so a failed delete never leaves it without images.
  await deleteImages(imageIds);
  invalidate(TAGS.products);
  refreshAdmin();
  redirect("/admin/listings/alllistings");
}

export interface AdminListingResult {
  error?: string;
}

/** Verified images for an admin form, or null when they can't be used (unusable uploads are deleted). */
async function attachAdminUploads(uid: string, publicIds: string[]): Promise<StoredImages | null> {
  try {
    return await finalizeUploads(uid, publicIds);
  } catch (error) {
    if (!(error instanceof CloudinaryError)) throw error;
    console.warn(`[admin] Images rejected: ${error.message}`);
    await discardUnusedUploads(uid, publicIds);
    return null;
  }
}

/** ListingsController.CreateAdmin — admin listings are published immediately. */
export async function createAdminListing(form: FormData): Promise<AdminListingResult> {
  const admin = await requireAdmin();
  const v = readListingForm(form);
  if (!v.title.trim() || v.price === null || v.categoryId === null) {
    await discardUnusedUploads(admin.uid, v.imagePaths);
    return { error: "invalid" };
  }
  const stored = await attachAdminUploads(admin.uid, v.imagePaths);
  if (!stored) return { error: "images" };

  try {
    await db().runTransaction(async (tx) => {
      const id = await nextId(tx, "products");
      tx.create(db().collection("products").doc(String(id)), {
        id,
        title: v.title,
        description: v.description.trim() ? v.description : null,
        price: v.price,
        image: stored.urls[0] ?? null,
        images: stored.urls,
        imagePublicIds: stored.publicIds,
        condition: str(form, "Condition") || null,
        location: v.location,
        categoryId: v.categoryId,
        subcategoryId: v.subcategoryId,
        submittedByUserId: admin.uid,
        status: "approved",
        createdAt: FieldValue.serverTimestamp(),
        approvedAt: null,
        viewCount: 0,
      });
    });
  } catch (error) {
    await discardUnusedUploads(admin.uid, stored.publicIds);
    throw error;
  }
  invalidate(TAGS.products);
  redirect("/admin/listings/alllistings");
}

/** ListingsController.EditAdmin — new images replace the old ones. */
export async function editAdminListing(form: FormData): Promise<AdminListingResult> {
  const admin = await requireAdmin();
  const id = parseId(str(form, "Id"));
  const ref = productRef(id ?? 0);
  if (!id || !(await ref.get()).exists) redirect("/not-found");
  const v = readListingForm(form);
  if (!v.title.trim() || v.price === null || v.categoryId === null) {
    await discardUnusedUploads(admin.uid, v.imagePaths);
    return { error: "invalid" };
  }

  const update: Record<string, unknown> = {
    title: v.title,
    description: v.description.trim() ? v.description : null,
    price: v.price,
    categoryId: v.categoryId,
    subcategoryId: v.subcategoryId,
    condition: str(form, "Condition") || null,
    location: v.location,
  };
  let stored: StoredImages = { urls: [], publicIds: [] };
  if (v.imagePaths.length) {
    const attached = await attachAdminUploads(admin.uid, v.imagePaths);
    if (!attached) return { error: "images" };
    stored = attached;
    update.images = stored.urls;
    update.imagePublicIds = stored.publicIds;
    if (stored.urls[0]) update.image = stored.urls[0];
  }
  let replacedIds: string[];
  try {
    // Read the old image IDs in the same transaction that replaces them.
    replacedIds = await db().runTransaction(async (tx) => {
      const old = publicIdsOf((await tx.get(ref)).data());
      tx.update(ref, update);
      return stored.publicIds.length ? old.filter((oldId) => !stored.publicIds.includes(oldId)) : [];
    });
  } catch (error) {
    await discardUnusedUploads(admin.uid, stored.publicIds);
    throw error;
  }
  // The new images are saved, so the replaced ones can be removed.
  await deleteImages(replacedIds);
  invalidate(TAGS.products);
  redirect("/admin/listings/alllistings");
}

// ------------------------------------------------------------------ Requests

/** RequestsController.Approve — applies the requested edit or deletion. */
export async function approveRequest(form: FormData) {
  await requireAdmin();
  const id = str(form, "id");
  if (!/^[A-Za-z0-9]{1,64}$/.test(id)) redirect("/not-found");
  const requestRef = db().collection("listingRequests").doc(id);

  // Cloudinary images the approved edit replaced; deleted once the transaction has committed.
  let replacedIds: string[] = [];
  const found = await db().runTransaction(async (tx) => {
    replacedIds = [];
    const req = await tx.get(requestRef);
    if (!req.exists) return false;
    const r = req.data()!;
    if (r.status !== "pending") return true;
    const pRef = productRef(Number(r.productId));
    const product = await tx.get(pRef);
    if (!product.exists) return true;

    if (r.type === "edit") {
      const p = product.data()!;
      const update: Record<string, unknown> = {
        title: r.title ?? p.title,
        description: r.description ?? null,
        price: r.price ?? p.price,
        categoryId: r.categoryId ?? p.categoryId,
        subcategoryId: r.subcategoryId ?? null,
        condition: r.condition ?? null,
        location: r.location ?? null,
      };
      if (Array.isArray(r.images) && r.images.length) {
        const newIds = publicIdsOf(r);
        update.images = r.images;
        update.image = r.images[0] ?? p.image ?? null;
        update.imagePublicIds = newIds;
        replacedIds = publicIdsOf(p).filter((oldId) => !newIds.includes(oldId));
      }
      tx.update(pRef, update);
    } else if (r.type === "delete") {
      tx.update(pRef, { status: "deleted" });
    }
    tx.update(requestRef, { status: "approved", reviewedAt: FieldValue.serverTimestamp() });
    return true;
  });
  if (!found) redirect("/not-found");
  await deleteImages(replacedIds);

  invalidate(TAGS.products);
  refreshAdmin();
  redirect("/admin/requests");
}

/** RequestsController.Reject */
export async function rejectRequest(form: FormData) {
  await requireAdmin();
  const id = str(form, "id");
  if (!/^[A-Za-z0-9]{1,64}$/.test(id)) redirect("/not-found");
  const ref = db().collection("listingRequests").doc(id);
  const unusedIds = await db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return null;
    const r = snap.data()!;
    // Reads must come before writes in a Firestore transaction.
    const product = r.status === "pending" ? await tx.get(productRef(Number(r.productId))) : null;
    tx.update(ref, { status: "rejected", reviewedAt: FieldValue.serverTimestamp() });
    if (!product) return [];
    // Images uploaded for a rejected edit are never shown, unless the listing already uses them.
    const inUse = publicIdsOf(product.data());
    return publicIdsOf(r).filter((imageId) => !inUse.includes(imageId));
  });
  if (unusedIds === null) redirect("/not-found");
  await deleteImages(unusedIds);
  refreshAdmin();
  redirect("/admin/requests");
}

// -------------------------------------------------------------------- Orders

async function setOrderStatus(form: FormData, status: string, extra: Record<string, unknown> = {}) {
  await requireAdmin();
  const id = parseId(str(form, "id"));
  const ref = db().collection("orders").doc(String(id ?? 0));
  if (!id || !(await ref.get()).exists) redirect("/not-found");
  await ref.update({ status, ...extra });
  refreshAdmin();
  redirect("/admin/orders");
}

/** OrdersController.Confirm */
export async function confirmOrder(form: FormData) {
  await setOrderStatus(form, "confirmed", { confirmedAt: FieldValue.serverTimestamp() });
}

/** OrdersController.Cancel */
export async function cancelOrder(form: FormData) {
  await setOrderStatus(form, "cancelled");
}

// -------------------------------------------------------------- Payment cards

/** PaymentCardsController.NormalizeCardNumber */
function normalizeCardNumber(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  return digits.length === 16 ? digits.match(/.{4}/g)!.join(" ") : null;
}

const CARD_ERROR = "Kart nömrəsi düz 16 rəqəmdən ibarət olmalıdır.";
const readSortOrder = (form: FormData) => {
  const n = Number(str(form, "SortOrder"));
  return Number.isSafeInteger(n) ? n : 0;
};

/** PaymentCardsController.Create */
export async function createPaymentCard(form: FormData) {
  await requireAdmin();
  const number = normalizeCardNumber(str(form, "CardNumber"));
  if (!number) {
    await setFlash(CARD_ERROR);
    redirect("/admin/paymentcards");
  }
  await db().collection("paymentCards").add({
    bankName: str(form, "BankName"),
    cardNumber: number,
    cardHolderName: str(form, "CardHolderName"),
    isActive: true,
    sortOrder: readSortOrder(form),
  });
  refreshAdmin();
  redirect("/admin/paymentcards");
}

function cardRef(form: FormData, key = "Id") {
  const id = str(form, key);
  if (!/^[A-Za-z0-9]{1,64}$/.test(id)) redirect("/not-found");
  return db().collection("paymentCards").doc(id);
}

/** PaymentCardsController.Edit — IsActive is not touched here. */
export async function editPaymentCard(form: FormData) {
  await requireAdmin();
  const ref = cardRef(form);
  if (!(await ref.get()).exists) redirect("/not-found");
  const number = normalizeCardNumber(str(form, "CardNumber"));
  if (!number) {
    await setFlash(CARD_ERROR);
    redirect("/admin/paymentcards");
  }
  await ref.update({
    bankName: str(form, "BankName"),
    cardNumber: number,
    cardHolderName: str(form, "CardHolderName"),
    sortOrder: readSortOrder(form),
  });
  refreshAdmin();
  redirect("/admin/paymentcards");
}

/** PaymentCardsController.ToggleActive */
export async function togglePaymentCard(form: FormData) {
  await requireAdmin();
  const ref = cardRef(form, "id");
  await db().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return;
    tx.update(ref, { isActive: !snap.get("isActive") });
  });
  refreshAdmin();
  redirect("/admin/paymentcards");
}

/** PaymentCardsController.Delete */
export async function deletePaymentCard(form: FormData) {
  await requireAdmin();
  const ref = cardRef(form, "id");
  if (!(await ref.get()).exists) redirect("/not-found");
  await ref.delete();
  refreshAdmin();
  redirect("/admin/paymentcards");
}
