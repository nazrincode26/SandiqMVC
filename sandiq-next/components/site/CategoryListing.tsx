import { getCurrentUser } from "@/lib/auth";
import type { Category } from "@/lib/data/categories";
import type { ProductSummary } from "@/lib/data/products";
import { localName, t, type Lang } from "@/lib/i18n";
import ProductCard from "./ProductCard";

export interface ListingQuery {
  q?: string;
  minPrice?: string;
  maxPrice?: string;
  condition?: string;
  sort?: string;
}

interface Props {
  lang: Lang;
  title: { name: string; nameRu?: string | null; nameEn?: string | null };
  topCategoryId?: number;
  subcategories: Category[];
  selectedSubcategoryId: number | null;
  products: ProductSummary[];
  query: ListingQuery;
}

/** Views/Category/Index.cshtml (used by both category and search pages). */
export default async function CategoryListing({ lang, title, topCategoryId, subcategories, selectedSubcategoryId, products, query }: Props) {
  const user = await getCurrentUser();
  const currentSort = query.sort ?? "";
  const isAlphaSort = !currentSort || currentSort === "alpha";

  return (
    <>
      <h2 id="categoryTitle">{localName(lang, title)}</h2>

      {subcategories.length > 0 && (
        <div className="subcategory-chips">
          <a href={`/Category/Index/${topCategoryId}`} className={`subcategory-chip ${selectedSubcategoryId === null ? "active" : ""}`}>
            {t(lang, "filter_all_conditions")}
          </a>
          {subcategories.map((sub) => (
            <a key={sub.id} href={`/Category/Index/${sub.id}`} className={`subcategory-chip ${selectedSubcategoryId === sub.id ? "active" : ""}`}>
              {localName(lang, sub)}
            </a>
          ))}
        </div>
      )}

      <form method="get" className="filter-bar">
        <input type="hidden" name="q" value={query.q ?? ""} />

        <div className="filter-bar__group">
          <label>{t(lang, "filter_price_label")}</label>
          <div className="filter-bar__price-row">
            <input type="number" name="minPrice" placeholder={t(lang, "filter_min_price")} min="0" defaultValue={query.minPrice ?? ""} />
            <span>-</span>
            <input type="number" name="maxPrice" placeholder={t(lang, "filter_max_price")} min="0" defaultValue={query.maxPrice ?? ""} />
          </div>
        </div>

        <div className="filter-bar__group">
          <label>{t(lang, "filter_condition_label")}</label>
          <select name="condition" defaultValue={query.condition === "new" || query.condition === "used" ? query.condition : ""}>
            <option value="">{t(lang, "filter_all_conditions")}</option>
            <option value="new">{t(lang, "condition_new")}</option>
            <option value="used">{t(lang, "condition_used")}</option>
          </select>
        </div>

        <div className="filter-bar__group">
          <label>{t(lang, "filter_sort_label")}</label>
          <select
            name="sort"
            defaultValue={["newest", "oldest", "price_asc", "price_desc"].includes(currentSort) ? currentSort : "alpha"}
          >
            <option value="alpha">{t(lang, "sort_alpha")}</option>
            <option value="newest">{t(lang, "sort_newest")}</option>
            <option value="oldest">{t(lang, "sort_oldest")}</option>
            <option value="price_asc">{t(lang, "sort_price_asc")}</option>
            <option value="price_desc">{t(lang, "sort_price_desc")}</option>
          </select>
        </div>

        <button type="submit" className="post-ad-btn post-ad-btn--filled">{t(lang, "apply_filters_button")}</button>
      </form>

      <div className="product-grid" data-sort-mode={isAlphaSort ? "alpha" : ""}>
        {products.length === 0 && <p>{t(lang, "no_products_found")}</p>}
        {products.map((product) => (
          <ProductCard key={product.id} product={product} currentUserId={user?.uid ?? null} addToCartLabel={t(lang, "add_to_cart")} />
        ))}
      </div>
    </>
  );
}

export function parseFilterNumber(raw: string | undefined): number | null {
  if (raw === undefined || raw.trim() === "") return null;
  const n = Number(raw.trim().replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
