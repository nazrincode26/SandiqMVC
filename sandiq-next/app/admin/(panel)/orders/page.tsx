import type { Metadata } from "next";
import { getUserNames, requireAdmin } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import { orderFromDoc, orderStatusClass, orderStatusLabel, type Order } from "@/lib/data/orders";
import { formatBakuDate, formatPriceN2 } from "@/lib/format";
import { fromCents, toCents } from "@/lib/money";
import { cancelOrder, confirmOrder } from "../../actions";
import ConfirmForm from "../ConfirmForm";

export const metadata: Metadata = { title: "Sifarişlər" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/** Admin OrdersController.Index */
export default async function AdminOrdersPage({ searchParams }: Props) {
  await requireAdmin();
  const raw = (await searchParams).filter;
  const filter = (Array.isArray(raw) ? raw[0] : raw) ?? "pending";

  const base = adminDb().collection("orders");
  const query = filter === "pending" || filter === "confirmed" ? base.where("status", "==", filter) : base;
  const orders = (await query.get()).docs
    .map((d) => orderFromDoc(d))
    .filter((o): o is Order => o !== null)
    .sort((a, b) => b.createdAt - a.createdAt);
  const names = await getUserNames(orders.flatMap((o) => [o.buyerUserId, ...o.items.map((i) => i.sellerUserId)]));

  const tab = (value: string, label: string) => (
    <a href={`/admin/orders?filter=${value}`} className={`admin-filter-tab ${filter === value ? "active" : ""}`}>
      {label}
    </a>
  );

  return (
    <>
      <div className="admin-page-header">
        <h2>Sifarişlər</h2>
      </div>

      <div className="admin-filter-tabs">
        {tab("pending", "Gözləyən")}
        {tab("confirmed", "Təsdiqlənmiş")}
        {tab("all", "Hamısı")}
      </div>

      <div className="pending-list">
        {orders.length === 0 && <p>Sifariş yoxdur.</p>}
        {orders.map((order) => (
          <div key={order.id} className="pending-row" style={{ flexDirection: "column", alignItems: "stretch" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
              <div>
                <h3>
                  Sifariş #{order.id} <span className={`status-badge ${orderStatusClass(order.status)}`}>{orderStatusLabel(order.status, "Gözləyir")}</span>
                </h3>
                <p className="pending-row__meta">
                  Alıcı: {names.get(order.buyerUserId)} · {formatBakuDate(order.createdAt, true)}
                </p>
              </div>
              <div className="pending-row__actions">
                {order.status === "pending" && (
                  <>
                    <ConfirmForm action={confirmOrder} id={order.id}>
                      <button type="submit" className="admin-btn admin-btn--primary">Ödəniş təsdiqləndi</button>
                    </ConfirmForm>
                    <ConfirmForm action={cancelOrder} id={order.id}>
                      <button type="submit" className="admin-btn admin-btn--danger">Ləğv et</button>
                    </ConfirmForm>
                  </>
                )}
              </div>
            </div>

            <table className="request-diff" style={{ marginTop: 10 }}>
              <thead>
                <tr>
                  <th>Məhsul</th>
                  <th>Satıcı</th>
                  <th>Miqdar</th>
                  <th>Məbləğ</th>
                  <th>Satıcıya</th>
                  <th>Platform payı</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, i) => (
                  <tr key={i}>
                    <td>{item.title}</td>
                    <td>{names.get(item.sellerUserId)}</td>
                    <td>{item.quantity}</td>
                    <td>{formatPriceN2(fromCents(toCents(item.unitPrice) * item.quantity))}</td>
                    <td>{formatPriceN2(item.sellerAmount)}</td>
                    <td>{formatPriceN2(item.platformFeeAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="pending-row__meta" style={{ textAlign: "right", marginTop: 6 }}>
              Cəmi: <strong>{formatPriceN2(order.totalAmount)}</strong> · Satıcılara: {formatPriceN2(order.sellerPayoutAmount)} · Platform:{" "}
              {formatPriceN2(order.platformFeeAmount)}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
