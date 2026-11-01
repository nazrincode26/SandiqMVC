import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import { productFromDoc, type Product } from "@/lib/data/products";
import { readFlash } from "@/lib/flash";
import { formatPriceN0 } from "@/lib/format";
import { t } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import FlashMessage from "@/components/FlashMessage";
import DeleteListingButton from "./DeleteListingButton";

export const metadata: Metadata = { title: "Mənim elanlarım" };

/** ListingsController.MyListings */
export default async function MyListingsPage() {
  const user = await requireUser();
  const db = adminDb();
  const [lang, flash, productsSnap, requestsSnap] = await Promise.all([
    getLang(),
    readFlash(),
    db.collection("products").where("submittedByUserId", "==", user.uid).get(),
    db.collection("listingRequests").where("requestedByUserId", "==", user.uid).where("status", "==", "pending").get(),
  ]);

  const listings = productsSnap.docs
    .map((d) => productFromDoc(d))
    .filter((p): p is Product => p !== null && p.status !== "deleted")
    .sort((a, b) => a.id - b.id);

  const pendingByProductId = new Map<number, string>();
  for (const r of requestsSnap.docs) {
    const productId = Number(r.get("productId"));
    if (!pendingByProductId.has(productId)) pendingByProductId.set(productId, String(r.get("type")));
  }

  return (
    <>
      <div className="my-listings__header">
        <h2>{t(lang, "my_listings_title")}</h2>
        <a href="/listings/create" className="post-ad-btn post-ad-btn--filled">{t(lang, "new_ad_button")}</a>
      </div>

      {flash && <FlashMessage className="my-listings__flash" message={flash} />}

      <div className="my-listings__list">
        {listings.length === 0 && <p>{t(lang, "no_listings")}</p>}
        {listings.map((listing) => {
          const statusClass = listing.status === "approved" ? "status--approved" : listing.status === "rejected" ? "status--rejected" : "status--pending";
          const statusKey = listing.status === "approved" ? "status_approved" : listing.status === "rejected" ? "status_rejected" : "status_pending";
          const pendingType = pendingByProductId.get(listing.id);

          return (
            <div key={listing.id} className="my-listing-row">
              {listing.image ? (
                <img src={listing.image} alt={listing.title} style={{ width: 70, height: 70, borderRadius: 8, objectFit: "cover" }} />
              ) : (
                <div style={{ width: 70, height: 70, background: "#EFE6D6", borderRadius: 8 }}></div>
              )}
              <div className="my-listing-row__info">
                <h3>{listing.title}</h3>
                <p>{formatPriceN0(listing.price)}</p>
              </div>
              <span className={`status-badge ${statusClass}`}>{t(lang, statusKey)}</span>
              <div className="my-listing-row__actions">
                {pendingType ? (
                  <span className="status-badge status--pending">
                    {t(lang, pendingType === "delete" ? "delete_request_pending" : "edit_request_pending")}
                  </span>
                ) : (
                  <>
                    <a href={`/listings/edit/${listing.id}`} className="my-listing-row__edit">{t(lang, "edit_button")}</a>
                    <DeleteListingButton id={listing.id} label={t(lang, "delete_button")} />
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
