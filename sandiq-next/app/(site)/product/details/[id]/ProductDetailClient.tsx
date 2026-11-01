"use client";

import { useState, useSyncExternalStore } from "react";
import { addToCart, isFavorite, showToast, STORE_EVENT, toggleFavorite, type StoreProduct } from "@/lib/client/store";

interface Props {
  product: StoreProduct;
  images: string[];
  isOwner: boolean;
  labels: { addToCart: string; addToFavorites: string; added: string };
  children: React.ReactNode;
}

function subscribe(cb: () => void) {
  window.addEventListener(STORE_EVENT, cb);
  return () => window.removeEventListener(STORE_EVENT, cb);
}

/** Gallery + cart/favourite buttons from Views/Product/Details.cshtml. */
export default function ProductDetailClient({ product, images, isOwner, labels, children }: Props) {
  const [mainImage, setMainImage] = useState(images[0]);
  const favorite = useSyncExternalStore(subscribe, () => isFavorite(product.id), () => false);

  return (
    <div className="product-detail" data-id={product.id} data-title={product.title} data-price={product.price} data-image={product.image ?? ""}>
      <div className="product-detail__gallery">
        <div className="product-detail__image">
          {images.length ? (
            <img
              id="mainProductImage"
              src={mainImage}
              alt={product.title}
              style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: 8 }}
            />
          ) : (
            <div style={{ width: "100%", aspectRatio: "1/1", background: "#EFE6D6", borderRadius: 8 }}></div>
          )}
        </div>
        {images.length > 1 && (
          <div className="product-detail__thumbs">
            {images.map((img, i) => (
              <img key={i} src={img} alt={product.title} className="product-detail__thumb" onClick={() => setMainImage(img)} />
            ))}
          </div>
        )}
      </div>
      <div className="product-detail__info">
        {children}
        <div className="product-detail__actions">
          {isOwner ? (
            <button type="button" disabled title="Öz elanınızı ala bilməzsiniz">
              Öz elanınızdır
            </button>
          ) : (
            <button
              type="button"
              id="detailCartBtn"
              onClick={() => {
                addToCart(product);
                showToast(labels.added);
              }}
            >
              {labels.addToCart}
            </button>
          )}
          <button type="button" id="detailFavBtn" className={favorite ? "active" : undefined} onClick={() => toggleFavorite(product)}>
            ♥ <span>{labels.addToFavorites}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
