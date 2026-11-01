import type { Metadata } from "next";
import { getUserNames, requireAdmin } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import { getAllCategories } from "@/lib/data/categories";
import { productFromDoc, type Product } from "@/lib/data/products";
import { approveListing, rejectListing } from "../../actions";
import ConfirmForm from "../ConfirmForm";
import ListingCardInfo from "./ListingCardInfo";

export const metadata: Metadata = { title: "Gözləyən elanlar" };

/** Admin ListingsController.Index — listings waiting for approval. */
export default async function PendingListingsPage() {
  await requireAdmin();
  const [snap, categories] = await Promise.all([
    adminDb().collection("products").where("status", "==", "pending").get(),
    getAllCategories(),
  ]);
  const products = snap.docs
    .map((d) => productFromDoc(d))
    .filter((p): p is Product => p !== null)
    .sort((a, b) => a.id - b.id);
  const names = await getUserNames(products.map((p) => p.submittedByUserId));
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));

  return (
    <>
      <h2>Gözləyən elanlar</h2>

      <div className="pending-list">
        {products.length === 0 && <p>Gözləyən elan yoxdur.</p>}
        {products.map((product) => (
          <div key={product.id} className="pending-row">
            <ListingCardInfo
              product={product}
              categoryName={categoryName.get(product.categoryId)}
              sellerName={names.get(product.submittedByUserId) ?? null}
            />
            <div className="pending-row__actions">
              <ConfirmForm action={approveListing} id={product.id}>
                <button type="submit" className="admin-btn admin-btn--primary">Təsdiqlə</button>
              </ConfirmForm>
              <ConfirmForm action={rejectListing} id={product.id}>
                <button type="submit" className="admin-btn admin-btn--danger">Rədd et</button>
              </ConfirmForm>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
