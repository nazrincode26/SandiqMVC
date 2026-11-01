"use client";

import { useEffect } from "react";

/** Shows a one-time message (TempData) and clears it so it isn't shown again. */
export default function FlashMessage({ message, className }: { message: string; className: string }) {
  useEffect(() => {
    document.cookie = "flash=; path=/; max-age=0; samesite=lax";
  }, []);
  return <div className={className}>{message}</div>;
}
