"use client";

import { useLang } from "@/lib/client/lang";
import { formatPrice, removeFromCart, updateQuantity, useCartItems } from "@/lib/client/store";

/** Views/Cart/Index.cshtml — the cart lives in localStorage. */
export default function CartPageClient() {
  const { t } = useLang();
  const items = useCartItems();

  let content: React.ReactNode = null;
  let total: React.ReactNode = null;
  let checkout: React.ReactNode = null;

  if (items !== null) {
    if (items.length === 0) {
      content = <p>{t("cart_empty")}</p>;
    } else {
      checkout = (
        <a href="/Cart/Checkout" className="cart-checkout-btn">
          Sifarişi tamamla
        </a>
      );
      content = items.map((item) => (
        <div key={item.productId} className="cart-item" data-id={item.productId}>
          {item.image ? (
            <img src={item.image} alt={item.title} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8 }} />
          ) : (
            <div style={{ width: 80, height: 80, background: "#EFE6D6", borderRadius: 8 }}></div>
          )}
          <div className="cart-item__info">
            <h3>{item.title}</h3>
            <p>{formatPrice(item.price)}</p>
          </div>
          <input
            type="number"
            className="cart-item__qty"
            min="1"
            defaultValue={item.quantity}
            onChange={(e) => updateQuantity(item.productId, Number(e.target.value))}
          />
          <button className="cart-item__remove" onClick={() => removeFromCart(item.productId)}>
            {t("remove_button")}
          </button>
        </div>
      ));
      const sum = items.reduce((s, i) => s + i.price * i.quantity, 0);
      total = (
        <strong>
          {t("cart_total")}: {formatPrice(sum)}
        </strong>
      );
    }
  }

  return (
    <>
      <h2>{t("cart_title")}</h2>
      <div id="cartItems" className="cart-items">{content}</div>
      <div id="cartTotal" className="cart-total">{total}</div>
      <div id="cartCheckoutAction">{checkout}</div>
    </>
  );
}
