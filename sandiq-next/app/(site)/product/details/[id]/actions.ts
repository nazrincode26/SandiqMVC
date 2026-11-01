"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { FieldValue } from "firebase-admin/firestore";
import { requireUser } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import { parseId } from "@/lib/data/common";
import { getProduct, productRef } from "@/lib/data/products";
import { str } from "@/lib/validation";

function readRating(form: FormData) {
  const raw = Number(str(form, "rating"));
  const rating = Number.isFinite(raw) ? Math.trunc(raw) : 0;
  return Math.min(5, Math.max(1, rating)); // Math.Clamp(rating, 1, 5)
}

const readComment = (form: FormData) => {
  const c = str(form, "comment");
  return c ? c.slice(0, 4000) : null;
};

/** ProductController.AddProductReview — one review per user, never on your own listing. */
export async function addProductReview(form: FormData) {
  const productId = parseId(str(form, "productId"));
  if (!productId) redirect("/not-found");
  const user = await requireUser(`/Product/Details/${productId}`);
  const product = await getProduct(productId);
  if (!product) redirect("/not-found");

  if (product.submittedByUserId !== user.uid) {
    try {
      // The review document id is the user id, so a second review fails atomically.
      await productRef(productId).collection("reviews").doc(user.uid).create({
        userId: user.uid,
        rating: readRating(form),
        comment: readComment(form),
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch {
      // Already reviewed: the original silently ignored this case too.
    }
  }
  revalidatePath(`/product/details/${productId}`);
  redirect(`/product/details/${productId}`);
}

/**
 * ProductController.AddSellerReview. The seller is taken from the listing on the
 * server rather than trusted from a hidden form field.
 */
export async function addSellerReview(form: FormData) {
  const productId = parseId(str(form, "productId"));
  if (!productId) redirect("/not-found");
  const user = await requireUser(`/Product/Details/${productId}`);
  const product = await getProduct(productId);
  if (!product) redirect("/not-found");

  const sellerId = product.submittedByUserId;
  if (sellerId && sellerId !== user.uid) {
    try {
      await adminDb().collection("sellerReviews").doc(`${sellerId}_${user.uid}`).create({
        sellerId,
        reviewerUserId: user.uid,
        rating: readRating(form),
        comment: readComment(form),
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch {
      // Already reviewed this seller.
    }
  }
  revalidatePath(`/product/details/${productId}`);
  redirect(`/product/details/${productId}`);
}
