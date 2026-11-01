import { formatPriceN0 } from "@/lib/format";
import type { ProductSummary } from "@/lib/data/products";
import { CardCartButton, CardFavoriteButton } from "./ProductCardButtons";

interface Props {
  product: ProductSummary;
  currentUserId: string | null;
  addToCartLabel: string;
}

/** Views/Shared/_ProductCard.cshtml */
export default function ProductCard({ product, currentUserId, addToCartLabel }: Props) {
  const isOwnListing = currentUserId !== null && currentUserId === product.submittedByUserId;
  const storeProduct = { id: product.id, title: product.title, price: product.price, image: product.image };
  const href = `/Product/Details/${product.id}`;

  return (
    <div className="product-card" data-id={product.id} data-title={product.title} data-price={product.price} data-image={product.image ?? ""}>
      <div className="product-card__image">
        <a href={href} style={{ display: "block", width: "100%", height: "100%" }}>
          {product.image ? (
            <img src={product.image} alt={product.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", background: "#EFE6D6" }}></div>
          )}
        </a>
        <CardFavoriteButton product={storeProduct} />
      </div>
      <div className="product-card__body">
        <a href={href} style={{ textDecoration: "none", color: "inherit" }}>
          <h3 className="product-card__title">{product.title}</h3>
          <p className="product-card__price">{formatPriceN0(product.price)}</p>
        </a>
        {isOwnListing ? (
          <button type="button" className="product-card__cart-btn" disabled title="Öz elanınızı ala bilməzsiniz">
            Öz elanınızdır
          </button>
        ) : (
          <CardCartButton product={storeProduct} label={addToCartLabel} />
        )}
      </div>
    </div>
  );
}
