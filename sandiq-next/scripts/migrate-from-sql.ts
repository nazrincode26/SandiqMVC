// Copies data exported from the old SQL Server database into Firebase.
// See docs/MIGRATION.md. Reads JSON files produced by scripts/export-sql.ps1.
//
//   npm run migrate -- --dir migration-data            (dry run: validates and prints a report)
//   npm run migrate -- --dir migration-data --execute  (writes to Firebase — needs approval)
//
// The SQL database is never modified. Writes use the original ids, so re-running is idempotent.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Timestamp } from "firebase-admin/firestore";
import type { UserImportRecord } from "firebase-admin/auth";
import { auth, commitInChunks, db, hasFlag, option, target } from "./lib.ts";

type Row = Record<string, unknown>;
const dir = option("--dir") ?? "migration-data";
const execute = hasFlag("--execute");
const issues: string[] = [];

function load(table: string): Row[] {
  const file = join(dir, `${table}.json`);
  if (!existsSync(file)) {
    issues.push(`${table}.json not found — table skipped`);
    return [];
  }
  const text = readFileSync(file, "utf8").replace(/^﻿/, "").trim();
  return text ? (JSON.parse(text) as Row[]) : [];
}

const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));
const strOrNull = (v: unknown) => (v === null || v === undefined ? null : String(v));
/** SQL datetime2 values were written with DateTime.UtcNow. */
const ts = (v: unknown) => (v ? Timestamp.fromDate(new Date(String(v).endsWith("Z") ? String(v) : `${v}Z`)) : null);
const uidFor = (legacyId: unknown) => `legacy_${legacyId}`;

async function main() {
  console.log(`${execute ? "MIGRATING" : "DRY RUN"} from ${dir} to ${target}\n`);

  const users = load("Users");
  const categories = load("Categories");
  const products = load("Products");
  const productImages = load("ProductImages");
  const productReviews = load("ProductReviews");
  const sellerReviews = load("SellerReviews");
  const requests = load("ListingRequests");
  const orders = load("Orders");
  const orderItems = load("OrderItems");
  const cards = load("PaymentCards");
  const keywords = load("SearchKeywords");

  const userIds = new Set(users.map((u) => Number(u.Id)));
  const productIds = new Set(products.map((p) => Number(p.Id)));
  const categoryIds = new Set(categories.map((c) => Number(c.Id)));
  const checkUser = (id: unknown, where: string) => {
    if (!userIds.has(Number(id))) issues.push(`${where}: user ${id} missing`);
  };

  // ---- Users -> Firebase Auth (BCrypt hashes import as-is, so passwords keep working)
  const emails = new Map<string, number>();
  const importRecords: UserImportRecord[] = [];
  for (const u of users) {
    const email = String(u.Email ?? "").trim();
    const key = email.toLowerCase();
    if (emails.has(key)) {
      issues.push(`Users: duplicate email ${email} (ids ${emails.get(key)} and ${u.Id}); only the first is imported to Auth`);
      continue;
    }
    emails.set(key, Number(u.Id));
    const record: UserImportRecord = { uid: uidFor(u.Id), email, displayName: String(u.FullName ?? "") };
    if (u.PasswordHash) record.passwordHash = Buffer.from(String(u.PasswordHash));
    if (u.GoogleId) {
      record.providerData = [{ uid: String(u.GoogleId), providerId: "google.com", email, displayName: String(u.FullName ?? "") }];
    }
    importRecords.push(record);
  }

  // ---- Firestore documents
  const ops: ((b: FirebaseFirestore.WriteBatch) => void)[] = [];
  const set = (path: string, data: Row) => ops.push((b) => b.set(db.doc(path), data));

  for (const u of users) {
    set(`users/${uidFor(u.Id)}`, {
      fullName: String(u.FullName ?? ""),
      email: String(u.Email ?? ""),
      phone: strOrNull(u.Phone),
      isAdmin: u.IsAdmin === true || u.IsAdmin === 1,
      googleId: strOrNull(u.GoogleId),
      legacyId: Number(u.Id),
    });
  }

  for (const c of categories) {
    if (c.ParentId !== null && c.ParentId !== undefined && !categoryIds.has(Number(c.ParentId))) issues.push(`Categories ${c.Id}: parent ${c.ParentId} missing`);
    set(`categories/${c.Id}`, {
      id: Number(c.Id),
      name: String(c.Name ?? ""),
      nameRu: strOrNull(c.NameRu),
      nameEn: strOrNull(c.NameEn),
      icon: strOrNull(c.Icon),
      parentId: num(c.ParentId),
    });
  }

  const imagesByProduct = new Map<number, Row[]>();
  for (const img of productImages) {
    const list = imagesByProduct.get(Number(img.ProductId)) ?? [];
    list.push(img);
    imagesByProduct.set(Number(img.ProductId), list);
  }
  for (const p of products) {
    checkUser(p.SubmittedByUserId, `Products ${p.Id}`);
    if (!categoryIds.has(Number(p.CategoryId))) issues.push(`Products ${p.Id}: category ${p.CategoryId} missing`);
    const images = (imagesByProduct.get(Number(p.Id)) ?? [])
      .sort((a, b) => Number(a.SortOrder) - Number(b.SortOrder))
      .map((i) => String(i.Path));
    set(`products/${p.Id}`, {
      id: Number(p.Id),
      title: String(p.Title ?? ""),
      description: strOrNull(p.Description),
      price: Number(p.Price ?? 0),
      image: strOrNull(p.Image),
      images,
      condition: strOrNull(p.Condition),
      location: strOrNull(p.Location),
      categoryId: Number(p.CategoryId),
      subcategoryId: num(p.SubcategoryId),
      submittedByUserId: uidFor(p.SubmittedByUserId),
      status: String(p.Status ?? "pending"),
      createdAt: ts(p.CreatedAt),
      approvedAt: ts(p.ApprovedAt),
      viewCount: Number(p.ViewCount ?? 0),
    });
  }

  for (const r of productReviews) {
    checkUser(r.UserId, `ProductReviews ${r.Id}`);
    if (!productIds.has(Number(r.ProductId))) issues.push(`ProductReviews ${r.Id}: product ${r.ProductId} missing`);
    set(`products/${r.ProductId}/reviews/${uidFor(r.UserId)}`, {
      userId: uidFor(r.UserId),
      rating: Number(r.Rating),
      comment: strOrNull(r.Comment),
      createdAt: ts(r.CreatedAt),
    });
  }

  for (const r of sellerReviews) {
    checkUser(r.SellerId, `SellerReviews ${r.Id}`);
    checkUser(r.ReviewerUserId, `SellerReviews ${r.Id}`);
    set(`sellerReviews/${uidFor(r.SellerId)}_${uidFor(r.ReviewerUserId)}`, {
      sellerId: uidFor(r.SellerId),
      reviewerUserId: uidFor(r.ReviewerUserId),
      rating: Number(r.Rating),
      comment: strOrNull(r.Comment),
      createdAt: ts(r.CreatedAt),
    });
  }

  for (const r of requests) {
    let images: string[] | null = null;
    if (r.ImagesJson) {
      try {
        images = JSON.parse(String(r.ImagesJson));
      } catch {
        issues.push(`ListingRequests ${r.Id}: ImagesJson is not valid JSON`);
      }
    }
    set(`listingRequests/legacy${r.Id}`, {
      productId: Number(r.ProductId),
      requestedByUserId: uidFor(r.RequestedByUserId),
      type: String(r.Type ?? "edit"),
      status: String(r.Status ?? "pending"),
      title: strOrNull(r.Title),
      description: strOrNull(r.Description),
      price: num(r.Price),
      categoryId: num(r.CategoryId),
      subcategoryId: num(r.SubcategoryId),
      condition: strOrNull(r.Condition),
      location: strOrNull(r.Location),
      image: strOrNull(r.Image),
      images,
      createdAt: ts(r.CreatedAt),
      reviewedAt: ts(r.ReviewedAt),
    });
  }

  const itemsByOrder = new Map<number, Row[]>();
  for (const i of orderItems) {
    const list = itemsByOrder.get(Number(i.OrderId)) ?? [];
    list.push(i);
    itemsByOrder.set(Number(i.OrderId), list);
  }
  for (const o of orders) {
    checkUser(o.BuyerUserId, `Orders ${o.Id}`);
    const items = (itemsByOrder.get(Number(o.Id)) ?? []).sort((a, b) => Number(a.Id) - Number(b.Id));
    set(`orders/${o.Id}`, {
      id: Number(o.Id),
      buyerUserId: uidFor(o.BuyerUserId),
      totalAmount: Number(o.TotalAmount ?? 0),
      platformFeeAmount: Number(o.PlatformFeeAmount ?? 0),
      sellerPayoutAmount: Number(o.SellerPayoutAmount ?? 0),
      status: String(o.Status ?? "pending"),
      createdAt: ts(o.CreatedAt),
      confirmedAt: ts(o.ConfirmedAt),
      items: items.map((i) => ({
        productId: Number(i.ProductId),
        title: String(i.Title ?? ""),
        unitPrice: Number(i.UnitPrice ?? 0),
        quantity: Number(i.Quantity ?? 0),
        sellerUserId: uidFor(i.SellerUserId),
        platformFeeAmount: Number(i.PlatformFeeAmount ?? 0),
        sellerAmount: Number(i.SellerAmount ?? 0),
      })),
      productIds: [...new Set(items.map((i) => Number(i.ProductId)))],
    });
  }

  for (const c of cards) {
    set(`paymentCards/legacy${c.Id}`, {
      bankName: String(c.BankName ?? ""),
      cardNumber: String(c.CardNumber ?? ""),
      cardHolderName: String(c.CardHolderName ?? ""),
      isActive: c.IsActive === true || c.IsActive === 1,
      sortOrder: Number(c.SortOrder ?? 0),
    });
  }

  for (const k of keywords) {
    set(`searchKeywords/legacy${k.Id}`, { keyword: String(k.Keyword ?? ""), lang: String(k.Lang ?? "az"), categoryId: Number(k.CategoryId) });
  }

  const maxId = (rows: Row[]) => rows.reduce((m, r) => Math.max(m, Number(r.Id) || 0), 0);
  for (const [name, rows] of [["categories", categories], ["products", products], ["orders", orders]] as const) {
    set(`counters/${name}`, { value: maxId(rows as Row[]) });
  }

  console.log("Rows read:");
  console.table({
    Users: users.length,
    Categories: categories.length,
    Products: products.length,
    ProductImages: productImages.length,
    ProductReviews: productReviews.length,
    SellerReviews: sellerReviews.length,
    ListingRequests: requests.length,
    Orders: orders.length,
    OrderItems: orderItems.length,
    PaymentCards: cards.length,
    SearchKeywords: keywords.length,
  });
  console.log(`Auth users to import: ${importRecords.length}`);
  console.log(`Firestore writes: ${ops.length}`);
  if (issues.length) {
    console.log(`\n${issues.length} issue(s):`);
    issues.forEach((i) => console.log(`  - ${i}`));
  } else {
    console.log("\nNo issues found.");
  }

  if (!execute) {
    console.log("\nDry run only. Re-run with --execute to write to Firebase.");
    return;
  }

  for (let i = 0; i < importRecords.length; i += 1000) {
    const result = await auth.importUsers(importRecords.slice(i, i + 1000), { hash: { algorithm: "BCRYPT" } });
    result.errors.forEach((e) => console.error(`Auth import failed for ${importRecords[i + e.index].email}: ${e.error.message}`));
    console.log(`Auth: imported ${result.successCount}, failed ${result.failureCount}`);
  }
  await commitInChunks(ops);
  console.log("Firestore: done.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
