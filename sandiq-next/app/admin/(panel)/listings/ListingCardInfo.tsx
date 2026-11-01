import { formatPriceN0 } from "@/lib/format";
import type { Product } from "@/lib/data/products";

/** Areas/Admin/Views/Listings/_ListingCardInfo.cshtml */
export default function ListingCardInfo({
  product,
  categoryName,
  sellerName,
  statusLabel,
}: {
  product: Product;
  categoryName?: string;
  sellerName?: string | null;
  statusLabel?: string;
}) {
  return (
    <>
      {product.image ? (
        <img src={product.image} alt={product.title} style={{ width: 100, height: 100, borderRadius: 8, flexShrink: 0, objectFit: "cover" }} />
      ) : (
        <div style={{ width: 100, height: 100, background: "var(--admin-placeholder-bg)", borderRadius: 8, flexShrink: 0 }}></div>
      )}
      <div className="pending-row__info">
        <h3>{product.title}</h3>
        <p className="pending-row__desc">{product.description}</p>
        <p className="pending-row__meta">
          {formatPriceN0(product.price)} · {categoryName ?? ""}
          {sellerName !== undefined ? ` · Göndərən: ${sellerName ?? ""}` : ""}
        </p>
        {statusLabel && <span className="status-badge">{statusLabel}</span>}
      </div>
    </>
  );
}
