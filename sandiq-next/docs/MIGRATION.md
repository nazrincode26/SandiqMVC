# Data migration plan (SQL Server → Firebase)

**Status: not executed.** Nothing has been read from or written to the production database or the
real Firebase project. Running the migration needs your explicit approval.

## What gets moved

| SQL table | Firebase target | Notes |
| --- | --- | --- |
| Users | Firebase Auth + `users/legacy_{Id}` | BCrypt `PasswordHash` imported as-is (`importUsers`, algorithm BCRYPT), so existing passwords keep working. Google users get a `google.com` provider link. |
| Categories | `categories/{Id}` | Same ids |
| Products + ProductImages | `products/{Id}` | Images embedded in `SortOrder`; `/uploads/products/…` paths still served from `public/uploads` (no `imagePublicIds`, so the app never deletes them). New uploads go to Cloudinary |
| ProductReviews | `products/{ProductId}/reviews/{uid}` | |
| SellerReviews | `sellerReviews/{seller}_{reviewer}` | |
| ListingRequests | `listingRequests/legacy{Id}` | `ImagesJson` parsed into `images` |
| Orders + OrderItems | `orders/{Id}` | Items embedded, `productIds` added |
| PaymentCards | `paymentCards/legacy{Id}` | |
| SearchKeywords | `searchKeywords/legacy{Id}` | (or run `npm run seed` instead) |
| — | `counters/*` | Set to the highest existing id so new ids continue the sequence |

Not migrated: `ResetToken`/`ResetTokenExpiry` (short-lived), EF migration history.

## Steps

1. **Export (read-only)** on the machine with SQL Server:
   `powershell -ExecutionPolicy Bypass -File scripts/export-sql.ps1` → `migration-data/*.json`
   (only `SELECT … FOR JSON` queries; `migration-data/` is gitignored because it contains personal data and password hashes).
2. **Dry run:** `npm run migrate -- --dir migration-data` — prints row counts, writes nothing, and lists
   problems (missing references, duplicate emails, bad JSON).
3. **Rehearse on the emulator** (`npm run emulators`, emulator env vars set) with `--execute`, then click through the site.
4. **Verify password import on the real project with one test account first.** The Auth emulator does not
   verify imported BCrypt hashes, so this could not be tested locally.
5. **Production run** (after approval): `npm run migrate -- --dir migration-data --execute`.
6. Spot-check counts in the Firebase console, log in with an old account, open old listing URLs.

## Risks and rollback

- **Duplicate emails** (the old Settings page allowed them): only the first account per email can sign in;
  the dry run lists them so they can be merged first.
- **Users with neither password nor Google id** are imported without a sign-in method; they can use "Şifrəni unutdum".
- **Google sign-in** links to an existing account with the same Gmail address automatically. For an account whose
  email is not verified, Firebase may remove the password sign-in in favour of Google — the user can set it again
  with "Şifrəni unutdum".
- **Timestamps** are assumed to be UTC (the app wrote `DateTime.UtcNow`).
- The migration only creates/overwrites documents with fixed ids, so it is safe to re-run. To roll back,
  delete the imported collections and the `legacy_*` Auth users (or start a fresh Firebase project);
  the SQL database is never modified and stays the source of truth until you switch over.
- Writes made in the old site after the export are not included — freeze the old site (or re-export) right before the final run.
