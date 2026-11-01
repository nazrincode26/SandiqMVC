import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { categoriesForClient, getCategoryTree } from "@/lib/data/categories";
import { parseId } from "@/lib/data/common";
import { getTitleKeywords } from "@/lib/data/keywords";
import { galleryImages, getProduct } from "@/lib/data/products";
import ListingForm from "../../ListingForm";

export const metadata: Metadata = { title: "Elanı redaktə et" };

/** ListingsController.Edit (GET) — only the owner can open it. */
export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const id = parseId((await params).id);
  const product = id ? await getProduct(id) : null;
  if (!product || product.submittedByUserId !== user.uid) notFound();

  const [tree, keywords] = await Promise.all([getCategoryTree(), getTitleKeywords()]);
  return (
    <ListingForm
      mode="edit"
      categories={categoriesForClient(tree)}
      titleKeywords={keywords}
      initial={{
        id: product.id,
        title: product.title,
        description: product.description ?? "",
        price: product.price,
        categoryId: product.categoryId,
        subcategoryId: product.subcategoryId,
        condition: product.condition ?? "used",
        location: product.location,
        existingImages: galleryImages(product),
      }}
    />
  );
}
