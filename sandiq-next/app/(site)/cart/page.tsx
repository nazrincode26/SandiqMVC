import type { Metadata } from "next";
import CartPageClient from "./CartPageClient";

export const metadata: Metadata = { title: "Səbətim" };

export default function CartPage() {
  return <CartPageClient />;
}
