import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import { orderFromDoc, orderStatusClass, orderStatusLabel, type Order } from "@/lib/data/orders";
import { formatBakuDate, formatPriceN2 } from "@/lib/format";
import { fromCents, toCents } from "@/lib/money";

export const metadata: Metadata = { title: "Sifarişlərim" };

/** CartController.MyOrders */
export default async function MyOrdersPage() {
  const user = await requireUser();
  const snap = await adminDb().collection("orders").where("buyerUserId", "==", user.uid).get();
  const orders = snap.docs
    .map((d) => orderFromDoc(d))
    .filter((o): o is Order => o !== null)
    .sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div className="checkout-page">
      <h2 className="checkout-page__title">Sifarişlərim</h2>

      {orders.length === 0 && <p>Hələ sifarişiniz yoxdur.</p>}

      {orders.map((order) => (
        <div key={order.id} className="checkout-card" style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong>Sifariş #{order.id}</strong>
            <span className={`status-badge ${orderStatusClass(order.status)}`}>{orderStatusLabel(order.status)}</span>
          </div>
          <p className="checkout-hint">{formatBakuDate(order.createdAt, true)}</p>
          <div className="checkout-items">
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
        </div>
      ))}
    </div>
  );
}
