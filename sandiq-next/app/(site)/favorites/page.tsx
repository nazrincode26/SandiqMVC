import type { Metadata } from "next";
import FavoritesClient from "./FavoritesClient";

export const metadata: Metadata = { title: "Favorilərim" };

export default function FavoritesPage() {
  return <FavoritesClient />;
}
