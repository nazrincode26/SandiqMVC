import "server-only";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { adminDb } from "../firebase/admin";
import { TAGS, toMillis } from "./common";

export type ProductStatus = "pending" | "approved" | "rejected" | "deleted";

export interface ProductSummary {
  id: number;
  title: string;
  price: number;
  image: string | null;
  condition: string | null;
  location: string | null;
  categoryId: number;
  subcategoryId: number | null;
  submittedByUserId: string;
  status: ProductStatus;
  createdAt: number;
}

export interface Product extends ProductSummary {
  description: string | null;
  images: string[];
  approvedAt: number | null;
  viewCount: number;
}

export function productFromDoc(snap: FirebaseFirestore.DocumentSnapshot): Product | null {
  const data = snap.data();
  if (!data) return null;
  return {
    id: Number(data.id ?? snap.id),
    title: data.title ?? "",
    description: data.description ?? null,
    price: Number(data.price ?? 0),
    image: data.image ?? null,
    images: Array.isArray(data.images) ? data.images : [],
    condition: data.condition ?? null,
    location: data.location ?? null,
    categoryId: Number(data.categoryId ?? 0),
    subcategoryId: typeof data.subcategoryId === "number" ? data.subcategoryId : null,
    submittedByUserId: data.submittedByUserId ?? "",
    status: (data.status ?? "pending") as ProductStatus,
    createdAt: toMillis(data.createdAt) ?? 0,
    approvedAt: toMillis(data.approvedAt),
    viewCount: Number(data.viewCount ?? 0),
  };
}

const summary = (p: Product): ProductSummary => ({
  id: p.id,
  title: p.title,
  price: p.price,
  image: p.image,
  condition: p.condition,
  location: p.location,
  categoryId: p.categoryId,
  subcategoryId: p.subcategoryId,
  submittedByUserId: p.submittedByUserId,
  status: p.status,
  createdAt: p.createdAt,
});

/**
 * All approved listings. Home, category, search and the chatbot all read this
 * one cached list, which is expired whenever a listing changes.
 */
const loadApproved = unstable_cache(
  async (): Promise<ProductSummary[]> => {
    const snap = await adminDb().collection("products").where("status", "==", "approved").get();
    return snap.docs
      .map((d) => productFromDoc(d))
      .filter((p): p is Product => p !== null)
      .map(summary)
      .sort((a, b) => a.id - b.id);
  },
  ["approved-products-v1"],
  { tags: [TAGS.products], revalidate: 3600 }
);

export async function getApprovedProducts(): Promise<ProductSummary[]> {
  return loadApproved();
}

/** One read per request even when metadata and the page both need the listing. */
export const getProduct = cache(async (id: number): Promise<Product | null> => {
  const snap = await adminDb().collection("products").doc(String(id)).get();
  return productFromDoc(snap);
});

export function productRef(id: number) {
  return adminDb().collection("products").doc(String(id));
}

/** Product images in display order, falling back to the single cover image. */
export function galleryImages(p: Pick<Product, "images" | "image">): string[] {
  if (p.images.length) return p.images;
  return p.image ? [p.image] : [];
}

/** Ordinal-ish sort used by OrderBy(p => p.Title) before the client re-sorted with Intl.Collator. */
export function sortByTitle<T extends { title: string }>(items: T[], lang: string): T[] {
  const collator = new Intl.Collator(lang, { sensitivity: "base" });
  return [...items].sort((a, b) => collator.compare(a.title || "", b.title || ""));
}

export interface ProductFilters {
  minPrice?: number | null;
  maxPrice?: number | null;
  condition?: string | null;
  sort?: string | null;
}

/** CategoryController.ApplyFilters */
export function applyFilters<T extends ProductSummary>(items: T[], f: ProductFilters, lang: string): T[] {
  let result = items;
  if (f.minPrice != null) result = result.filter((p) => p.price >= f.minPrice!);
  if (f.maxPrice != null) result = result.filter((p) => p.price <= f.maxPrice!);
  if (f.condition) result = result.filter((p) => p.condition === f.condition);

  switch (f.sort) {
    case "price_asc":
      return [...result].sort((a, b) => a.price - b.price);
    case "price_desc":
      return [...result].sort((a, b) => b.price - a.price);
    case "newest":
      return [...result].sort((a, b) => b.createdAt - a.createdAt);
    case "oldest":
      return [...result].sort((a, b) => a.createdAt - b.createdAt);
    default:
      return sortByTitle(result, lang);
  }
}
