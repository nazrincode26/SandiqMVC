"use client";

import { useSyncExternalStore } from "react";
import { getCartCount, getFavorites, STORE_EVENT } from "@/lib/client/store";

function subscribe(callback: () => void) {
  window.addEventListener(STORE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(STORE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

/** product-actions.js updateHeaderBadges() */
export default function HeaderBadge({ kind }: { kind: "cart" | "favorites" }) {
  const count = useSyncExternalStore(
    subscribe,
    () => (kind === "cart" ? getCartCount() : getFavorites().length),
    () => 0
  );
  return (
    <span className="badge" id={kind === "cart" ? "cartBadge" : "favBadge"}>
      {count}
    </span>
  );
}
