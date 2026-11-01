import "server-only";
import { toMillis } from "./common";

export type OrderStatus = "pending" | "confirmed" | "cancelled";

export interface OrderItem {
  productId: number;
  title: string;
  unitPrice: number;
  quantity: number;
  sellerUserId: string;
  platformFeeAmount: number;
  sellerAmount: number;
}

export interface Order {
  id: number;
  buyerUserId: string;
  totalAmount: number;
  platformFeeAmount: number;
  sellerPayoutAmount: number;
  status: OrderStatus;
  createdAt: number;
  confirmedAt: number | null;
  items: OrderItem[];
}

export function orderFromDoc(snap: FirebaseFirestore.DocumentSnapshot): Order | null {
  const d = snap.data();
  if (!d) return null;
  return {
    id: Number(d.id ?? snap.id),
    buyerUserId: d.buyerUserId ?? "",
    totalAmount: Number(d.totalAmount ?? 0),
    platformFeeAmount: Number(d.platformFeeAmount ?? 0),
    sellerPayoutAmount: Number(d.sellerPayoutAmount ?? 0),
    status: (d.status ?? "pending") as OrderStatus,
    createdAt: toMillis(d.createdAt) ?? 0,
    confirmedAt: toMillis(d.confirmedAt),
    items: Array.isArray(d.items)
      ? d.items.map((i: Record<string, unknown>) => ({
          productId: Number(i.productId ?? 0),
          title: String(i.title ?? ""),
          unitPrice: Number(i.unitPrice ?? 0),
          quantity: Number(i.quantity ?? 0),
          sellerUserId: String(i.sellerUserId ?? ""),
          platformFeeAmount: Number(i.platformFeeAmount ?? 0),
          sellerAmount: Number(i.sellerAmount ?? 0),
        }))
      : [],
  };
}

export function orderStatusLabel(status: OrderStatus, pendingLabel = "Ödəniş yoxlanılır") {
  return status === "confirmed" ? "Ödəniş təsdiqləndi" : status === "cancelled" ? "Ləğv edildi" : pendingLabel;
}

export function orderStatusClass(status: OrderStatus) {
  return status === "confirmed" ? "status--approved" : status === "cancelled" ? "status--rejected" : "status--pending";
}
