import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getCurrentUser } from "@/lib/auth";
import { adminDb } from "@/lib/firebase/admin";
import { nextId } from "@/lib/data/common";
import { productFromDoc, productRef } from "@/lib/data/products";
import { fromCents, platformFeeCents, toCents } from "@/lib/money";

const MAX_LINES = 200;

/**
 * CartController.PlaceOrder. The client only sends product ids and quantities;
 * titles, prices, sellers and fees all come from Firestore.
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Səbət boşdur." }, { status: 400 });
  }

  const rawItems = (body as { items?: unknown })?.items;
  const lines = Array.isArray(rawItems)
    ? rawItems
        .slice(0, MAX_LINES)
        .map((i) => ({
          productId: Number((i as Record<string, unknown>)?.productId),
          quantity: Number((i as Record<string, unknown>)?.quantity),
        }))
        .filter((i) => Number.isSafeInteger(i.productId) && i.productId > 0)
    : [];

  if (!lines.length) return NextResponse.json({ message: "Səbət boşdur." }, { status: 400 });

  const productIds = [...new Set(lines.map((l) => l.productId))];
  const db = adminDb();

  const result = await db.runTransaction(async (tx) => {
    const snaps = await tx.getAll(...productIds.map((id) => productRef(id)));
    const products = new Map(
      snaps
        .map((s) => productFromDoc(s))
        .filter((p) => p !== null && p.status === "approved")
        .map((p) => [p!.id, p!])
    );

    let skippedOwnListings = 0;
    const items = [];
    for (const line of lines) {
      const product = products.get(line.productId);
      if (!product) continue;
      if (product.submittedByUserId === user.uid) {
        skippedOwnListings++;
        continue;
      }
      const quantity = Math.max(1, Number.isFinite(line.quantity) ? Math.trunc(line.quantity) : 0);
      const lineTotal = toCents(product.price) * quantity;
      const fee = platformFeeCents(lineTotal);
      items.push({
        productId: product.id,
        title: product.title,
        unitPrice: product.price,
        quantity,
        sellerUserId: product.submittedByUserId,
        platformFeeAmount: fromCents(fee),
        sellerAmount: fromCents(lineTotal - fee),
        _total: lineTotal,
        _fee: fee,
      });
    }

    if (!items.length) {
      return { error: skippedOwnListings > 0 ? "Öz elanınızı ala bilməzsiniz." : "Səbətdəki məhsullar artıq mövcud deyil." };
    }

    const totalCents = items.reduce((s, i) => s + i._total, 0);
    const feeCents = items.reduce((s, i) => s + i._fee, 0);
    const orderId = await nextId(tx, "orders");
    tx.create(db.collection("orders").doc(String(orderId)), {
      id: orderId,
      buyerUserId: user.uid,
      totalAmount: fromCents(totalCents),
      platformFeeAmount: fromCents(feeCents),
      sellerPayoutAmount: fromCents(totalCents - feeCents),
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
      confirmedAt: null,
      items: items.map(({ _total, _fee, ...rest }) => (void _total, void _fee, rest)),
      productIds: [...new Set(items.map((i) => i.productId))],
    });
    return { orderId, skippedOwnListings };
  });

  if ("error" in result) return NextResponse.json({ message: result.error }, { status: 400 });
  return NextResponse.json(result);
}
