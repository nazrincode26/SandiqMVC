import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getCategoryTree } from "@/lib/data/categories";
import { getApprovedProducts, sortByTitle } from "@/lib/data/products";
import { localName, t } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import CategoryIcon from "@/components/site/CategoryIcon";
import ProductCard from "@/components/site/ProductCard";

export const metadata: Metadata = { title: "Ana səhifə" };

/** HomeController.Index + Views/Home/Index.cshtml */
export default async function HomePage() {
  const [lang, user, categories, products] = await Promise.all([
    getLang(),
    getCurrentUser(),
    getCategoryTree(),
    getApprovedProducts(),
  ]);
  const sorted = sortByTitle(products, lang);

  return (
    <>
      <section className="categories-section">
        <h2>{t(lang, "home_categories")}</h2>
        <div className="home-category-grid">
          {categories.map((category) => (
            <a key={category.id} href={`/Category/Index/${category.id}`} className="home-category-card">
              <div className="home-category-card__icon">
                <CategoryIcon name={category.name} />
              </div>
              <span>{localName(lang, category)}</span>
            </a>
          ))}
        </div>
      </section>

      <section className="products-section">
        <h2>{t(lang, "home_all_listings")}</h2>
        <div className="product-grid" data-sort-mode="alpha">
          {sorted.length === 0 && <p>{t(lang, "no_products_found")}</p>}
          {sorted.map((product) => (
            <ProductCard key={product.id} product={product} currentUserId={user?.uid ?? null} addToCartLabel={t(lang, "add_to_cart")} />
          ))}
        </div>
      </section>
    </>
  );
}
