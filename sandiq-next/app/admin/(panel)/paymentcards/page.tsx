import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import { readFlash } from "@/lib/flash";
import { PLATFORM_FEE_RATE } from "@/lib/money";
import FlashMessage from "@/components/FlashMessage";
import { deletePaymentCard, togglePaymentCard } from "../../actions";
import ConfirmForm from "../ConfirmForm";
import CardModal, { CreateCardButton, EditCardButton } from "./CardModal";

export const metadata: Metadata = { title: "Ödəniş kartları" };

/** Admin PaymentCardsController.Index */
export default async function PaymentCardsPage() {
  await requireAdmin();
  const [snap, flash] = await Promise.all([adminDb().collection("paymentCards").get(), readFlash()]);
  const cards = snap.docs
    .map((d) => ({
      id: d.id,
      bankName: String(d.get("bankName") ?? ""),
      cardNumber: String(d.get("cardNumber") ?? ""),
      cardHolderName: String(d.get("cardHolderName") ?? ""),
      isActive: d.get("isActive") === true,
      sortOrder: Number(d.get("sortOrder") ?? 0),
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <CardModal>
      <div className="admin-page-header">
        <h2>Ödəniş kartları</h2>
        <CreateCardButton />
      </div>

      <p className="admin-form__hint">
        Bu kartlar müştərilərə checkout səhifəsində köçürmə üçün göstərilir. Platform komissiyası: {Math.round(PLATFORM_FEE_RATE * 100)}%.
      </p>

      {flash && <FlashMessage className="admin-flash" message={flash} />}

      <div className="pending-list">
        {cards.length === 0 && <p>Hələ kart əlavə edilməyib.</p>}
        {cards.map((card) => (
          <div key={card.id} className="pending-row">
            <div className="pending-row__info">
              <h3>
                {card.bankName}{" "}
                <span className={`status-badge ${card.isActive ? "status--approved" : "status--rejected"}`}>{card.isActive ? "Aktiv" : "Deaktiv"}</span>
              </h3>
              <p className="pending-row__desc">
                {card.cardNumber} · {card.cardHolderName}
              </p>
            </div>
            <div className="pending-row__actions">
              <EditCardButton card={card} />
              <ConfirmForm action={togglePaymentCard} id={card.id}>
                <button type="submit" className="admin-btn">{card.isActive ? "Deaktiv et" : "Aktiv et"}</button>
              </ConfirmForm>
              <ConfirmForm action={deletePaymentCard} id={card.id} message="Silinsin?">
                <button type="submit" className="admin-btn admin-btn--danger">Sil</button>
              </ConfirmForm>
            </div>
          </div>
        ))}
      </div>
    </CardModal>
  );
}
