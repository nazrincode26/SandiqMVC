"use client";

import { createContext, useContext, useState } from "react";
import { createPaymentCard, editPaymentCard } from "../../actions";

interface Card {
  id: string;
  bankName: string;
  cardNumber: string;
  cardHolderName: string;
  sortOrder: number;
}

type Open = (card: Card | null) => void;
const OpenContext = createContext<Open>(() => {});

export function CreateCardButton() {
  const open = useContext(OpenContext);
  return (
    <button type="button" id="createCardBtn" className="admin-btn admin-btn--primary" onClick={() => open(null)}>
      + Yeni kart
    </button>
  );
}

export function EditCardButton({ card }: { card: Card }) {
  const open = useContext(OpenContext);
  return (
    <button type="button" className="admin-btn edit-card-btn" onClick={() => open(card)}>
      Redaktə et
    </button>
  );
}

const formatCardNumber = (value: string) =>
  value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();

/** The card modal from Areas/Admin/Views/PaymentCards/Index.cshtml. */
export default function CardModal({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [card, setCard] = useState<Card | null>(null);
  const [number, setNumber] = useState("");
  const [key, setKey] = useState(0);

  const open: Open = (c) => {
    setCard(c);
    setNumber(c?.cardNumber ?? "");
    setKey((k) => k + 1);
    setVisible(true);
  };

  return (
    <OpenContext.Provider value={open}>
      {children}
      <div
        id="cardModal"
        className={`admin-modal${visible ? "" : " hidden"}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setVisible(false);
        }}
      >
        <div className="admin-modal__box admin-form">
          <h2 id="cardModalTitle">{card ? "Kartı redaktə et" : "Yeni kart"}</h2>

          <form id="cardForm" key={key} action={card ? editPaymentCard : createPaymentCard}>
            <input type="hidden" name="Id" id="cardFormId" value={card?.id ?? "0"} />
            <label>
              Bank adı
              <input type="text" name="BankName" id="cardFormBank" required placeholder="Məs. Kapital Bank" defaultValue={card?.bankName ?? ""} />
            </label>
            <label>
              Kart nömrəsi
              <input
                type="text"
                name="CardNumber"
                id="cardFormNumber"
                required
                placeholder="0000 0000 0000 0000"
                maxLength={19}
                inputMode="numeric"
                value={number}
                onChange={(e) => setNumber(formatCardNumber(e.target.value))}
              />
            </label>
            <label>
              Kart sahibinin adı
              <input type="text" name="CardHolderName" id="cardFormHolder" required defaultValue={card?.cardHolderName ?? ""} />
            </label>
            <label>
              Sıra nömrəsi
              <input type="number" name="SortOrder" id="cardFormSort" defaultValue={card?.sortOrder ?? 0} />
            </label>

            <div className="admin-modal__actions">
              <button type="button" id="cardModalCancelBtn" className="admin-btn" onClick={() => setVisible(false)}>
                Ləğv et
              </button>
              <button type="submit" className="admin-btn admin-btn--primary">
                Yadda saxla
              </button>
            </div>
          </form>
        </div>
      </div>
    </OpenContext.Provider>
  );
}
