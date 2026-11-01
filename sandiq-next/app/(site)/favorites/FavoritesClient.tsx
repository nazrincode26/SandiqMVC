"use client";

import { useLang } from "@/lib/client/lang";
import { addToCart, formatPrice, removeFromFavorites, showToast, useFavoriteItems } from "@/lib/client/store";

/** Views/Favorites/Index.cshtml — favourites live in localStorage. */
export default function FavoritesClient() {
  const { t } = useLang();
  const items = useFavoriteItems();

  return (
    <>
      <h2>{t("favorites_title")}</h2>
      <div id="favoritesGrid" className="product-grid">
        {items !== null && items.length === 0 && <p>{t("favorites_empty")}</p>}
        {items?.map((item) => (
          <div key={item.productId} className="product-card" data-id={item.productId}>
            <div className="product-card__image">
              {item.image ? (
                <img src={item.image} alt={item.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", background: "#EFE6D6" }}></div>
              )}
            </div>
            <div className="product-card__body">
              <h3 className="product-card__title">{item.title}</h3>
              <p className="product-card__price">{formatPrice(item.price)}</p>
              <button
                className="cart-btn"
                onClick={() => {
                  addToCart({ id: item.productId, title: item.title, price: item.price, image: item.image });
                  showToast(t("cart_added_alert"));
                }}
              >
                {t("add_to_cart")}
              </button>
              <button className="remove-btn" onClick={() => removeFromFavorites(item.productId)}>
                {t("remove_from_favorites")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
