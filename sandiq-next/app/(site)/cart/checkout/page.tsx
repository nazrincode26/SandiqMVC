import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import CheckoutClient, { CopyButton } from "./CheckoutClient";

export const metadata: Metadata = { title: "Sifarişi tamamla" };

/** CartController.Checkout ([Authorize]) */
export default async function CheckoutPage() {
  await requireUser();
  const snap = await adminDb().collection("paymentCards").where("isActive", "==", true).get();
  const cards = snap.docs
    .map((d) => ({
      id: d.id,
      bankName: String(d.get("bankName") ?? ""),
      cardNumber: String(d.get("cardNumber") ?? ""),
      cardHolderName: String(d.get("cardHolderName") ?? ""),
      sortOrder: Number(d.get("sortOrder") ?? 0),
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="checkout-page">
      <h2 className="checkout-page__title">Sifarişi tamamla</h2>

      <CheckoutClient
        cards={
          !cards.length ? (
            <p className="checkout-hint" style={{ color: "var(--color-danger)" }}>
              Hazırda aktiv ödəniş kartı yoxdur. Zəhmət olmasa əlaqə saxlayın.
            </p>
          ) : (
            <div className="checkout-cards">
              {cards.map((card) => (
                <div key={card.id} className="checkout-payment-card">
                  <div className="checkout-payment-card__bank">{card.bankName}</div>
                  <div className="checkout-payment-card__number" data-copy={card.cardNumber}>
                    {card.cardNumber}
                    <CopyButton value={card.cardNumber} />
                  </div>
                  <div className="checkout-payment-card__holder">{card.cardHolderName}</div>
                </div>
              ))}
            </div>
          )
        }
      />
    </div>
  );
}
