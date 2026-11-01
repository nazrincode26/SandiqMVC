import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import { getAllCategories, getCategoryTree } from "@/lib/data/categories";
import { galleryImages, productFromDoc, type Product } from "@/lib/data/products";
import { hardDeleteListing, restoreListing, softDeleteListing } from "../../../actions";
import ConfirmForm from "../../ConfirmForm";
import ListingCardInfo from "../ListingCardInfo";
import AdminListingModal, { CreateListingButton, EditListingButton } from "./AdminListingModal";

export const metadata: Metadata = { title: "Bütün elanlar" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const statusLabel = (status: string) =>
  status === "approved" ? "Təsdiqləndi" : status === "rejected" ? "Rədd edildi" : status === "deleted" ? "Silinib" : "Gözləyir";

/** Admin ListingsController.AllListings */
export default async function AllListingsPage({ searchParams }: Props) {
  await requireAdmin();
  const raw = (await searchParams).filter;
  const filter = (Array.isArray(raw) ? raw[0] : raw) ?? "all";

  const [snap, categories, tree] = await Promise.all([adminDb().collection("products").get(), getAllCategories(), getCategoryTree()]);
  let products = snap.docs
    .map((d) => productFromDoc(d))
    .filter((p): p is Product => p !== null)
    .sort((a, b) => a.id - b.id);
  if (filter === "active") products = products.filter((p) => p.status !== "deleted");
  else if (filter === "deleted") products = products.filter((p) => p.status === "deleted");
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));

  const tab = (value: string, label: string) => (
    <a href={`/admin/listings/alllistings?filter=${value}`} className={`admin-filter-tab ${filter === value ? "active" : ""}`}>
      {label}
    </a>
  );

  return (
    <AdminListingModal categories={tree.map((c) => ({ id: c.id, name: c.name, subcategories: c.subcategories.map((s) => ({ id: s.id, name: s.name })) }))}>
      <div className="admin-page-header">
        <h2>Bütün elanlar</h2>
        <CreateListingButton />
      </div>

      <div className="admin-filter-tabs">
        {tab("all", "Hamısı")}
        {tab("active", "Aktiv")}
        {tab("deleted", "Silinmiş (soft)")}
      </div>

      <div className="pending-list">
        {products.length === 0 && <p>Elan yoxdur.</p>}
        {products.map((product) => (
          <div key={product.id} className="pending-row">
            <ListingCardInfo product={product} categoryName={categoryName.get(product.categoryId)} statusLabel={statusLabel(product.status)} />
            <div className="pending-row__actions">
              <EditListingButton
                listing={{
                  id: product.id,
                  title: product.title,
                  description: product.description ?? "",
                  price: product.price,
                  categoryId: product.categoryId,
                  subcategoryId: product.subcategoryId,
                  condition: product.condition,
                  location: product.location ?? "",
                  images: galleryImages(product),
                }}
              />

              {product.status === "deleted" ? (
                <ConfirmForm action={restoreListing} id={product.id}>
                  <button type="submit" className="admin-btn admin-btn--primary">Bərpa et</button>
                </ConfirmForm>
              ) : (
                <ConfirmForm action={softDeleteListing} id={product.id}>
                  <button type="submit" className="admin-btn">Sil (soft)</button>
                </ConfirmForm>
              )}
              <ConfirmForm action={hardDeleteListing} id={product.id} message="Tam silmək istədiyinizə əminsiniz? Bu geri qaytarıla bilməz.">
                <button type="submit" className="admin-btn admin-btn--danger">Tam sil</button>
              </ConfirmForm>
            </div>
          </div>
        ))}
      </div>
    </AdminListingModal>
  );
}
