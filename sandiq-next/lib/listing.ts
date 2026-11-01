import "server-only";
import { getAllCategories } from "./data/categories";
import { isValidTitle } from "./data/keywords";
import { MAX_IMAGES, parsePrice } from "./money";
import { addError, optionalInt, str, type FieldErrors } from "./validation";

export interface ListingValues {
  title: string;
  description: string;
  price: number | null;
  priceRaw: string;
  categoryId: number | null;
  subcategoryId: number | null;
  condition: "new" | "used";
  location: string | null;
  acceptTerms: boolean;
  imagePaths: string[];
}

export function readListingForm(form: FormData): ListingValues {
  const priceRaw = str(form, "Price").trim();
  const condition = str(form, "Condition");
  const location = str(form, "Location");
  let imagePaths: string[] = [];
  try {
    const parsed = JSON.parse(str(form, "ImagePaths") || "[]");
    if (Array.isArray(parsed)) imagePaths = parsed.filter((p): p is string => typeof p === "string");
  } catch {
    imagePaths = [];
  }
  return {
    title: str(form, "Title"),
    description: str(form, "Description"),
    price: parsePrice(priceRaw),
    priceRaw,
    categoryId: optionalInt(str(form, "CategoryId")),
    subcategoryId: optionalInt(str(form, "SubcategoryId")),
    condition: condition === "new" ? "new" : "used",
    location: location.trim() ? location : null,
    acceptTerms: str(form, "AcceptTerms") === "true",
    imagePaths,
  };
}

/** Validation from CreateListingViewModel/EditListingViewModel and ListingsController. */
export async function validateListing(
  v: ListingValues,
  opts: { requireTerms: boolean; imageCount: number }
): Promise<{ fields: FieldErrors; summary: string[] }> {
  const fields: FieldErrors = {};
  const summary: string[] = [];

  if (opts.requireTerms && !v.acceptTerms) summary.push("Zəhmət olmasa elan paylaşma şərtlərini oxuyub qəbul edin.");
  if (opts.imageCount > MAX_IMAGES) summary.push(`Maksimum ${MAX_IMAGES} şəkil yükləyə bilərsiniz.`);

  if (!v.title.trim()) addError(fields, "Title", "Başlıq tələb olunur");
  else if (!(await isValidTitle(v.title))) addError(fields, "Title", "Başlıq yalnız siyahıdakı açar sözlərdən biri ola bilər.");

  if (!v.description.trim()) addError(fields, "Description", "Təsvir tələb olunur");

  if (!v.priceRaw) addError(fields, "Price", "Qiymət tələb olunur");
  else if (v.price === null) addError(fields, "Price", `The value '${v.priceRaw}' is not valid for Qiymət (₼).`);

  const categories = await getAllCategories();
  const category = v.categoryId !== null ? categories.find((c) => c.id === v.categoryId && c.parentId === null) : undefined;
  if (!category) addError(fields, "CategoryId", "Kateqoriya seçin");
  else if (v.subcategoryId !== null && !categories.some((c) => c.id === v.subcategoryId && c.parentId === category.id)) {
    addError(fields, "CategoryId", "Kateqoriya seçin");
  }

  return { fields, summary };
}
