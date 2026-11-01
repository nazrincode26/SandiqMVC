import type { Metadata } from "next";
import { getUserNames, requireAdmin } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import { getAllCategories } from "@/lib/data/categories";
import { toMillis } from "@/lib/data/common";
import { productFromDoc, productRef, type Product } from "@/lib/data/products";
import { formatBakuDate, formatPriceN0 } from "@/lib/format";
import { approveRequest, rejectRequest } from "../../actions";
import ConfirmForm from "../ConfirmForm";

export const metadata: Metadata = { title: "Sorğular" };

/** Admin RequestsController.Index — pending edit/delete requests, oldest first. */
export default async function RequestsPage() {
  await requireAdmin();
  const db = adminDb();
  const [snap, categories] = await Promise.all([db.collection("listingRequests").where("status", "==", "pending").get(), getAllCategories()]);
  const requests = snap.docs
    .map((d) => ({ id: d.id, ...d.data(), createdAtMs: toMillis(d.get("createdAt")) ?? 0 }) as Record<string, unknown> & { id: string; createdAtMs: number })
    .sort((a, b) => a.createdAtMs - b.createdAtMs);

  const productIds = [...new Set(requests.map((r) => Number(r.productId)).filter((n) => n > 0))];
  const productSnaps = productIds.length ? await db.getAll(...productIds.map((id) => productRef(id))) : [];
  const products = new Map(
    productSnaps
      .map((s) => productFromDoc(s))
      .filter((p): p is Product => p !== null)
      .map((p) => [p.id, p])
  );
  const names = await getUserNames(requests.map((r) => String(r.requestedByUserId ?? "")));
  const categoryName = (id: unknown) => (typeof id === "number" ? categories.find((c) => c.id === id)?.name ?? "-" : "-");

  return (
    <>
      <div className="admin-page-header">
        <h2>Sorğular</h2>
      </div>

      <div className="pending-list">
        {requests.length === 0 && <p>Gözləyən sorğu yoxdur.</p>}
        {requests.map((request) => {
          const product = products.get(Number(request.productId));
          const isDelete = request.type === "delete";
          const newImages = Array.isArray(request.images) ? (request.images as string[]) : null;
          return (
            <div key={request.id} className="pending-row request-row">
              {product?.image ? (
                <img src={product.image} alt={product.title} />
              ) : (
                <div style={{ width: 100, height: 100, background: "var(--admin-placeholder-bg)", borderRadius: 8, flexShrink: 0 }}></div>
              )}
              <div className="pending-row__info">
                <h3>
                  {product?.title}{" "}
                  <span className={`status-badge ${isDelete ? "status--rejected" : "status--pending"}`}>{isDelete ? "Silmə sorğusu" : "Redaktə sorğusu"}</span>
                </h3>
                <p className="pending-row__meta">
                  Göndərən: {names.get(String(request.requestedByUserId ?? ""))} · {formatBakuDate(request.createdAtMs, true)}
                </p>

                {request.type === "edit" && product ? (
                  <table className="request-diff">
                    <thead>
                      <tr>
                        <th></th>
                        <th>Cari</th>
                        <th>Təklif olunan</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Başlıq</td>
                        <td>{product.title}</td>
                        <td>{String(request.title ?? "")}</td>
                      </tr>
                      <tr>
                        <td>Təsvir</td>
                        <td>{product.description}</td>
                        <td>{String(request.description ?? "")}</td>
                      </tr>
                      <tr>
                        <td>Qiymət</td>
                        <td>{formatPriceN0(product.price)}</td>
                        <td>{typeof request.price === "number" ? formatPriceN0(request.price) : "- ₼"}</td>
                      </tr>
                      <tr>
                        <td>Kateqoriya</td>
                        <td>{categories.find((c) => c.id === product.categoryId)?.name}</td>
                        <td>{categoryName(request.categoryId)}</td>
                      </tr>
                      <tr>
                        <td>Vəziyyət</td>
                        <td>{product.condition}</td>
                        <td>{String(request.condition ?? "")}</td>
                      </tr>
                      <tr>
                        <td>Yer</td>
                        <td>{product.location}</td>
                        <td>{String(request.location ?? "")}</td>
                      </tr>
                      {newImages && newImages.length > 0 && (
                        <tr>
                          <td>Şəkillər</td>
                          <td>{product.images.length} ədəd</td>
                          <td>{newImages.length} yeni şəkil yükləndi</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                ) : isDelete ? (
                  <p className="pending-row__desc">Bu elanın silinməsi tələb olunur.</p>
                ) : null}
              </div>
              <div className="pending-row__actions">
                <ConfirmForm action={approveRequest} id={request.id}>
                  <button type="submit" className="admin-btn admin-btn--primary">Təsdiqlə</button>
                </ConfirmForm>
                <ConfirmForm action={rejectRequest} id={request.id}>
                  <button type="submit" className="admin-btn admin-btn--danger">Rədd et</button>
                </ConfirmForm>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
