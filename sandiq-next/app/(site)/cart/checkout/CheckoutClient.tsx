"use client";

import { useState } from "react";
import CheckoutSteps from "@/components/site/CheckoutSteps";
import { clearCart, formatPrice, showToast, useCartItems } from "@/lib/client/store";

const PLACE_LABEL = "Ödədim, sifarişi göndər";

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="checkout-copy-btn"
      data-copy={value}
      title="Kopyala"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "Kopyalandı!" : "Kopyala"}
    </button>
  );
}

/** Client half of Views/Cart/Checkout.cshtml. */
export default function CheckoutClient({ cards }: { cards: React.ReactNode }) {
  const items = useCartItems() ?? [];
  const [paid, setPaid] = useState(false);
  const [sending, setSending] = useState(false);
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  async function placeOrder() {
    setSending(true);
    try {
      const res = await fetch("/Cart/PlaceOrder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })) }),
      });
      if (res.status === 401) {
        window.location.href = `/account/login?ReturnUrl=${encodeURIComponent("/Cart/Checkout")}`;
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || "Xəta baş verdi, yenidən cəhd edin");
        setSending(false);
        return;
      }
      if (data.skippedOwnListings > 0) {
        showToast("Öz elanınız səbətdən çıxarıldı, ona görə sifarişə daxil edilmədi");
      }
      clearCart();
      window.location.href = `/Cart/OrderConfirmation/${data.orderId}`;
    } catch {
      showToast("Xəta baş verdi, yenidən cəhd edin");
      setSending(false);
    }
  }

  return (
    <>
      <CheckoutSteps current={paid ? 2 : 1} />

      <div className="checkout-grid">
        <section className="checkout-card">
          <h3>Sifariş xülasəsi</h3>
          <div id="checkoutItems" className="checkout-items">
            {items.length === 0 ? (
              <p>Səbətiniz boşdur.</p>
            ) : (
              items.map((item) => (
                <div key={item.productId} className="checkout-item">
                  <span className="checkout-item__title">
                    {item.title} <span className="checkout-item__qty">× {item.quantity}</span>
                  </span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))
            )}
          </div>
          <div className="checkout-summary-row">
            <span>Cəmi</span>
            <strong id="checkoutTotal">{items.length ? formatPrice(total) : "0 ₼"}</strong>
          </div>
        </section>

        <section className="checkout-card">
          <h3>Ödəniş məlumatları</h3>
          <p className="checkout-hint">
            Aşağıdakı kartlardan birinə ümumi məbləği köçürün. Köçürmədən sonra &quot;Ödədim&quot; düyməsini basın — sifarişiniz admin
            tərəfindən yoxlanılıb təsdiqlənəcək.
          </p>

          {cards}

          <label className="checkout-confirm-check">
            <input type="checkbox" id="paidCheckbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} />
            <span>Yuxarıdakı kartlardan birinə köçürməni etdim</span>
          </label>

          <button type="button" id="placeOrderBtn" className="checkout-place-btn" disabled={!paid || items.length === 0 || sending} onClick={placeOrder}>
            {sending ? "Göndərilir..." : PLACE_LABEL}
          </button>
          <p className="checkout-security-note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Sifarişiniz qeydə alınır və admin ödənişi təsdiqlədikdən sonra satıcı ilə əlaqə saxlanılır.
          </p>
        </section>
      </div>
    </>
  );
}
