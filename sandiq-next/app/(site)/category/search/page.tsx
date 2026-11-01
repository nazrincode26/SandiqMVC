import type { Metadata } from "next";
import { applyFilters, getApprovedProducts } from "@/lib/data/products";
import { getLang } from "@/lib/lang";
import CategoryListing, { firstParam, parseFilterNumber } from "@/components/site/CategoryListing";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = firstParam((await searchParams).q) ?? "";
  return { title: `Axtarış: "${q}"` };
}

/** CategoryController.Search — title contains the query (case-insensitive, like SQL Server's default collation). */
export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const lang = await getLang();
  const q = firstParam(sp.q) ?? "";
  const query = {
    q,
    minPrice: firstParam(sp.minPrice),
    maxPrice: firstParam(sp.maxPrice),
    condition: firstParam(sp.condition),
    sort: firstParam(sp.sort),
  };

  let products = q.trim() ? await getApprovedProducts() : [];
  if (q.trim()) {
    const needle = q.toLowerCase();
    products = products.filter((p) => p.title.toLowerCase().includes(needle));
  }
  products = applyFilters(
    products,
    { minPrice: parseFilterNumber(query.minPrice), maxPrice: parseFilterNumber(query.maxPrice), condition: query.condition, sort: query.sort },
    lang
  );

  return (
    <CategoryListing
      lang={lang}
      title={{ name: `Axtarış: "${q}"` }}
      subcategories={[]}
      selectedSubcategoryId={null}
      products={products}
      query={query}
    />
  );
}
