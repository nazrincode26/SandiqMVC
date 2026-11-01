import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import { parseId } from "@/lib/data/common";
import { orderFromDoc, orderStatusClass, orderStatusLabel } from "@/lib/data/orders";
import { formatPriceN2 } from "@/lib/format";
import { fromCents, toCents } from "@/lib/money";
import CheckoutSteps from "@/components/site/CheckoutSteps";

export const metadata: Metadata = { title: "Sifariş qeydə alındı" };

/** CartController.OrderConfirmation — only the buyer can see their order. */
export default async function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const id = parseId((await params).id);
  if (!id) notFound();
  const order = orderFromDoc(await adminDb().collection("orders").doc(String(id)).get());
  if (!order || order.buyerUserId !== user.uid) notFound();

  return (
    <div className="checkout-page">
      <CheckoutSteps current={3} />

      <div className="checkout-card checkout-confirmation">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.6">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M8 12l3 3 5-6"></path>
        </svg>
        <h2>Sifarişiniz qəbul edildi</h2>
        <p className="checkout-hint">
          Sifariş nömrəniz: <strong>#{order.id}</strong>
        </p>
        <span className={`status-badge ${orderStatusClass(order.status)}`}>{orderStatusLabel(order.status)}</span>

        <div className="checkout-items" style={{ marginTop: 20 }}>
          {order.items.map((item, i) => (
            <div key={i} className="checkout-item">
              <span className="checkout-item__title">
                {item.title} <span className="checkout-item__qty">× {item.quantity}</span>
              </span>
              <span>{formatPriceN2(fromCents(toCents(item.unitPrice) * item.quantity))}</span>
            </div>
          ))}
          <div className="checkout-summary-row">
            <span>Cəmi</span>
            <strong>{formatPriceN2(order.totalAmount)}</strong>
          </div>
        </div>

        <p className="checkout-security-note" style={{ marginTop: 16 }}>
          Admin köçürməni təsdiqlədikdən sonra satıcı ilə əlaqə saxlanılacaq. Statusu <a href="/cart/myorders">Sifarişlərim</a> səhifəsindən
          izləyə bilərsiniz.
        </p>

        <a href="/" className="checkout-place-btn" style={{ display: "inline-block", textDecoration: "none", textAlign: "center" }}>
          Ana səhifəyə qayıt
        </a>
      </div>
    </div>
  );
}
