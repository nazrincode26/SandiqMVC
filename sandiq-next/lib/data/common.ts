import "server-only";
import { revalidateTag } from "next/cache";
import { Timestamp, type Transaction } from "firebase-admin/firestore";
import { adminDb } from "../firebase/admin";

export const TAGS = {
  products: "products",
  categories: "categories",
  keywords: "keywords",
} as const;

/** Expire cached data immediately so the next request reads fresh Firestore data. */
export function invalidate(...tags: string[]) {
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
}

export function toMillis(value: unknown): number | null {
  if (value instanceof Timestamp) return value.toMillis();
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  return null;
}

/**
 * Sequential numeric ids (like SQL identity columns), so URLs such as
 * /product/details/12 and order numbers (#12) keep working.
 */
export async function nextId(tx: Transaction, counter: string): Promise<number> {
  const ref = adminDb().collection("counters").doc(counter);
  const snap = await tx.get(ref);
  const value = ((snap.get("value") as number | undefined) ?? 0) + 1;
  tx.set(ref, { value }, { merge: true });
  return value;
}

export function parseId(raw: string | undefined | null): number | null {
  if (!raw || !/^\d{1,10}$/.test(raw)) return null;
  const n = Number(raw);
  return n > 0 ? n : null;
}
