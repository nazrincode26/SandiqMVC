import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FieldValue } from "firebase-admin/firestore";
import { getCurrentUser, getUserNames } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import { getAllCategories } from "@/lib/data/categories";
import { parseId, toMillis } from "@/lib/data/common";
import { galleryImages, getProduct, productRef } from "@/lib/data/products";
import { formatBakuDate, formatOneDecimal, formatPriceN0 } from "@/lib/format";
import { localName, t } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import { StarRatingInput } from "@/components/site/FormBits";
import ProductDetailClient from "./ProductDetailClient";
import { addProductReview, addSellerReview } from "./actions";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = parseId((await params).id);
  const product = id ? await getProduct(id) : null;
  return product && product.status === "approved" ? { title: product.title } : {};
}

interface Review {
  authorId: string;
  rating: number;
  comment: string | null;
  createdAt: number;
}

const starText = (r: number | null) => {
  const rounded = r === null ? 0 : roundHalfEven(r);
  return "★".repeat(rounded) + "☆".repeat(5 - rounded);
};

// (int)Math.Round(double) in C# rounds midpoints to even.
function roundHalfEven(x: number) {
  const f = Math.floor(x);
  const diff = x - f;
  if (diff > 0.5) return f + 1;
  if (diff < 0.5) return f;
  return f % 2 === 0 ? f : f + 1;
}

const average = (items: Review[]) => (items.length ? items.reduce((s, r) => s + r.rating, 0) / items.length : null);

function toReview(d: FirebaseFirestore.QueryDocumentSnapshot, authorField: string): Review {
  const data = d.data();
  return {
    authorId: data[authorField] ?? d.id,
    rating: Number(data.rating ?? 0),
    comment: data.comment ?? null,
    createdAt: toMillis(data.createdAt) ?? 0,
  };
}

/** ProductController.Details */
export default async function ProductDetailsPage({ params }: Props) {
  const id = parseId((await params).id);
  if (!id) notFound();
  const product = await getProduct(id);
  if (!product || product.status !== "approved") notFound();

  // product.ViewCount++ on every view.
  await productRef(id).update({ viewCount: FieldValue.increment(1) });
  const viewCount = product.viewCount + 1;

  const db = adminDb();
  const [lang, user, categories, productReviewsSnap, sellerReviewsSnap] = await Promise.all([
    getLang(),
    getCurrentUser(),
    getAllCategories(),
    productRef(id).collection("reviews").get(),
    db.collection("sellerReviews").where("sellerId", "==", product.submittedByUserId).get(),
  ]);

  const productReviews = productReviewsSnap.docs.map((d) => toReview(d, "userId")).sort((a, b) => b.createdAt - a.createdAt);
  const sellerReviews = sellerReviewsSnap.docs.map((d) => toReview(d, "reviewerUserId")).sort((a, b) => b.createdAt - a.createdAt);
  const names = await getUserNames([
    product.submittedByUserId,
    ...productReviews.map((r) => r.authorId),
    ...sellerReviews.map((r) => r.authorId),
  ]);

  const category = categories.find((c) => c.id === product.categoryId);
  const productAvg = average(productReviews);
  const sellerAvg = average(sellerReviews);
  const isAuthenticated = user !== null;
  const isOwner = isAuthenticated && user.uid === product.submittedByUserId;
  const hasReviewedProduct = isAuthenticated && productReviews.some((r) => r.authorId === user.uid);
  const hasReviewedSeller = isAuthenticated && sellerReviews.some((r) => r.authorId === user.uid);
  const images = galleryImages(product);
  const loginHref = `/account/login`;

  const reviewList = (reviews: Review[]) =>
    reviews.map((review, i) => (
      <div key={i} className="review-card">
        <div className="review-card__header">
          <span className="review-card__author">{names.get(review.authorId)}</span>
          <span className="review-card__date">{formatBakuDate(review.createdAt, false)}</span>
        </div>
        <div className="review-card__stars">{starText(review.rating)}</div>
        {review.comment?.trim() ? <p className="review-card__comment">{review.comment}</p> : null}
      </div>
    ));

  return (
    <>
      <ProductDetailClient
        product={{ id: product.id, title: product.title, price: product.price, image: product.image }}
        images={images}
        isOwner={isOwner}
        labels={{ addToCart: t(lang, "add_to_cart"), addToFavorites: t(lang, "add_to_favorites"), added: t(lang, "cart_added_alert") }}
      >
        <h1>{product.title}</h1>
        <p className="product-detail__viewcount">👁 {viewCount} baxış</p>
        <p className="product-detail__price">{formatPriceN0(product.price)}</p>
        <p className="product-detail__description">{product.description}</p>
        <ul className="list-unstyled">
          <li>
            <strong>{t(lang, "detail_category_label")}</strong> <span>{category ? localName(lang, category) : ""}</span>
          </li>
          <li>
            <strong>{t(lang, "detail_condition_label")}</strong>{" "}
            <span>{t(lang, product.condition === "new" ? "condition_new" : "condition_used")}</span>
          </li>
          <li>
            <strong>{t(lang, "detail_location_label")}</strong> {product.location}
          </li>
          <li>
            <strong>{t(lang, "detail_seller_label")}</strong> {names.get(product.submittedByUserId)}
            {sellerAvg !== null ? (
              <>
                {" "}
                <span className="review-card__stars">{starText(sellerAvg)}</span> ({sellerReviews.length})
              </>
            ) : (
              <>
                {" "}
                <span className="review-empty">(hələ rəy yoxdur)</span>
              </>
            )}
          </li>
          {product.approvedAt !== null && (
            <li>
              <strong>{t(lang, "detail_approved_at_label")}</strong> {formatBakuDate(product.approvedAt, true)}
            </li>
          )}
        </ul>
      </ProductDetailClient>

      <div className="reviews-section">
        <h2 className="reviews-section__title">Elana rəylər</h2>
        <div className="reviews-summary">
          {productAvg !== null ? (
            <>
              <span className="reviews-summary__stars">{starText(productAvg)}</span>
              <span>
                {formatOneDecimal(productAvg)} ({productReviews.length} rəy)
              </span>
            </>
          ) : (
            <span className="review-empty">Hələ rəy yoxdur</span>
          )}
        </div>

        {reviewList(productReviews)}

        {isOwner ? (
          <p className="review-already-note">Öz elanınıza rəy yaza bilməzsiniz.</p>
        ) : hasReviewedProduct ? (
          <p className="review-already-note">Bu elana artıq rəy yazmısınız.</p>
        ) : isAuthenticated ? (
          <form action={addProductReview} className="review-form">
            <input type="hidden" name="productId" value={product.id} />
            <StarRatingInput idPrefix="prRating" inputName="rating" />
            <textarea name="comment" placeholder="Rəyinizi yazın (istəyə bağlı)"></textarea>
            <button type="submit">Rəy göndər</button>
          </form>
        ) : (
          <p className="review-login-note">
            Rəy yazmaq üçün <a href={loginHref}>daxil olun</a>.
          </p>
        )}
      </div>

      <div className="reviews-section">
        <h2 className="reviews-section__title">Satıcı haqqında rəylər</h2>
        <div className="reviews-summary">
          {sellerAvg !== null ? (
            <>
              <span className="reviews-summary__stars">{starText(sellerAvg)}</span>
              <span>
                {formatOneDecimal(sellerAvg)} ({sellerReviews.length} rəy)
              </span>
            </>
          ) : (
            <span className="review-empty">Hələ rəy yoxdur</span>
          )}
        </div>

        {reviewList(sellerReviews)}

        {isOwner ? (
          <p className="review-already-note">Özünüzü qiymətləndirə bilməzsiniz.</p>
        ) : hasReviewedSeller ? (
          <p className="review-already-note">Bu satıcıya artıq rəy yazmısınız.</p>
        ) : isAuthenticated ? (
          <form action={addSellerReview} className="review-form">
            <input type="hidden" name="productId" value={product.id} />
            <StarRatingInput idPrefix="slRating" inputName="rating" />
            <textarea name="comment" placeholder="Satıcı haqqında rəyinizi yazın (istəyə bağlı)"></textarea>
            <button type="submit">Rəy göndər</button>
          </form>
        ) : (
          <p className="review-login-note">
            Rəy yazmaq üçün <a href={loginHref}>daxil olun</a>.
          </p>
        )}
      </div>
    </>
  );
}
