import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllCategories } from "@/lib/data/categories";
import { parseId } from "@/lib/data/common";
import { applyFilters, getApprovedProducts } from "@/lib/data/products";
import { getLang } from "@/lib/lang";
import CategoryListing, { firstParam, parseFilterNumber } from "@/components/site/CategoryListing";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = parseId((await params).id);
  const category = id ? (await getAllCategories()).find((c) => c.id === id) : null;
  if (!category) return {};
  const all = await getAllCategories();
  const top = category.parentId ? all.find((c) => c.id === category.parentId) ?? category : category;
  return { title: top.name };
}

/** CategoryController.Index */
export default async function CategoryPage({ params, searchParams }: Props) {
  const id = parseId((await params).id);
  const sp = await searchParams;
  const all = await getAllCategories();
  const requested = id ? all.find((c) => c.id === id) : undefined;
  if (!requested) notFound();

  const lang = await getLang();
  let top = requested;
  let selectedSubcategoryId: number | null = null;
  let products = await getApprovedProducts();

  if (requested.parentId !== null) {
    // A subcategory: filter by it but show the parent's subcategory chips.
    const parent = all.find((c) => c.id === requested.parentId);
    if (!parent) notFound();
    top = parent;
    selectedSubcategoryId = requested.id;
    products = products.filter((p) => p.subcategoryId === requested.id);
  } else {
    products = products.filter((p) => p.categoryId === requested.id);
  }

  const query = {
    q: firstParam(sp.q),
    minPrice: firstParam(sp.minPrice),
    maxPrice: firstParam(sp.maxPrice),
    condition: firstParam(sp.condition),
    sort: firstParam(sp.sort),
  };
  products = applyFilters(
    products,
    { minPrice: parseFilterNumber(query.minPrice), maxPrice: parseFilterNumber(query.maxPrice), condition: query.condition, sort: query.sort },
    lang
  );

  return (
    <CategoryListing
      lang={lang}
      title={top}
      topCategoryId={top.id}
      subcategories={all.filter((c) => c.parentId === top.id)}
      selectedSubcategoryId={selectedSubcategoryId}
      products={products}
      query={query}
    />
  );
}
