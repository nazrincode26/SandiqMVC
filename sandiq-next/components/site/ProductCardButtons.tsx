"use client";

import { useState } from "react";
import { addToCart, showToast, toggleFavorite, type StoreProduct } from "@/lib/client/store";

/** .js-cart-btn handler from product-actions.js */
export function CardCartButton({ product, label }: { product: StoreProduct; label: string }) {
  return (
    <button
      type="button"
      className="product-card__cart-btn js-cart-btn"
      onClick={() => {
        addToCart(product);
        showToast("Məhsul səbətə əlavə olundu");
      }}
    >
      {label}
    </button>
  );
}

/**
 * .js-favorite-btn handler from product-actions.js. As in the original, the
 * heart starts unhighlighted on cards and toggles its highlight on each click.
 */
export function CardFavoriteButton({ product }: { product: StoreProduct }) {
  const [active, setActive] = useState(false);
  return (
    <button
      type="button"
      className={`product-card__favorite js-favorite-btn${active ? " active" : ""}`}
      aria-label="Favorilərə əlavə et"
      onClick={() => {
        toggleFavorite(product);
        setActive((v) => !v);
      }}
    >
      ♥
    </button>
  );
}
