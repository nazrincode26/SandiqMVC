# Inventory: original → rebuilt

URLs are case-insensitive like the original (`proxy.ts` lowercases them and maps `/Home/Index`,
`/Cart/Index`, … to their short forms), so old links such as `/Product/Details/12` keep working.

## Public site

| Original (controller/view) | New route | Notes |
| --- | --- | --- |
| Home/Index | `/` | Top-level categories with icons, all approved listings sorted alphabetically for the current language |
| Home/Privacy | `/home/privacy` | Template page (not linked, as before) |
| Home/NotFound, StatusCode, Error | `not-found.tsx`, `error.tsx` | Any unknown URL shows the site 404 page |
| Category/Index/{id} | `/category/index/[id]` | Subcategory chips, price/condition filters, 5 sort orders |
| Category/Search | `/category/search?q=` | Case-insensitive title search + same filters |
| Category/SearchSuggestions | `/category/searchsuggestions` | JSON keyword → category suggestions (az/ru/en), max 8 |
| Product/Details/{id} | `/product/details/[id]` | Gallery, view counter, seller rating, product + seller reviews |
| Product/AddProductReview, AddSellerReview | server actions | One review per user, not on own listing/self, rating clamped 1–5 |
| Favorites/Index | `/favorites` | localStorage (`favorites` key, same format) |
| Cart/Index | `/cart` | localStorage (`cart` key, same format) |
| Cart/Checkout | `/cart/checkout` | Login required; active payment cards; 3-step indicator |
| Cart/PlaceOrder | `POST /cart/placeorder` | Prices/sellers/fees computed on the server; own listings skipped; 30% fee with banker's rounding |
| Cart/OrderConfirmation/{id} | `/cart/orderconfirmation/[id]` | Buyer only |
| Cart/MyOrders | `/cart/myorders` | |
| Account/Login, Register, Logout | `/account/login`, `/account/register`, `/account/logout` | Email/password + Google; ReturnUrl preserved |
| Account/GoogleLogin, CompleteProfile | `/api/auth/session`, `/account/completeprofile` | Phone required after first Google sign-in |
| Account/ForgotPassword, ResetPassword | same paths | 6-digit emailed code, 15 minutes, same email text |
| Account/Settings | `/account/settings` | Name, email, phone (+994 format) |
| Listings/Create | `/listings/create` | Login gate, keyword-only titles, fee preview, up to 10 images, terms modal; status `pending` |
| Listings/MyListings | `/listings/mylistings` | Status badges, pending-request badges, flash messages |
| Listings/Edit/{id}, Delete | `/listings/edit/[id]`, server action | Create edit/delete *requests* for the admin; one pending request per listing |
| Info/Legal, Rules, About, Contact | `/info/*` | Anchors kept (`#user-agreement`, …) |
| Chat/Ask | `POST /chat/ask` | Gemini with the same system prompt, live catalogue, user's listings, cart and favourites |
| Layout | `app/(site)/layout.tsx` | Header (language picker, catalogue mega menu, search suggestions, badges, user menu), side menu, footer, chatbot |

Language: the az/ru/en dictionaries are the original `i18n/*.js` files. The choice is stored in a
`lang` cookie (and localStorage) so pages are rendered in that language on the server; older
localStorage-only choices are picked up automatically. Texts that were not translated in the
original (e.g. checkout, reviews, "Sifarişlərim") remain Azerbaijani.

## Admin area (`/admin`)

| Original | New route |
| --- | --- |
| Admin/Account/Login | `/admin/account/login` (non-admins are refused; signed-in non-admins see "Giriş qadağandır") |
| Admin/Home/Index | `/admin` → `/admin/categories` |
| Categories Index/Create/Edit/Delete | `/admin/categories`, `/create`, `/edit/[id]` + modal |
| Listings Index, Approve, Reject | `/admin/listings` |
| Listings AllListings, CreateAdmin, EditAdmin, SoftDelete, HardDelete, Restore | `/admin/listings/alllistings?filter=all|active|deleted` |
| Requests Index, Approve, Reject | `/admin/requests` (field-by-field diff) |
| Orders Index, Confirm, Cancel | `/admin/orders?filter=pending|confirmed|all` |
| PaymentCards Index/Create/Edit/ToggleActive/Delete | `/admin/paymentcards` |
| Nav badges | Pending requests and pending orders (Firestore `count()` queries) |

Every admin page **and** every admin server action checks the admin role on the server.

## Firestore schema

| Collection | Document id | Fields | Replaces |
| --- | --- | --- | --- |
| `users` | Firebase Auth uid | fullName, email, phone, isAdmin, googleId, createdAt | Users (passwords/reset tokens live in Firebase Auth / `passwordResets`) |
| `categories` | numeric id | id, name, nameRu, nameEn, icon, parentId | Categories |
| `products` | numeric id | id, title, description, price, image, **images[]**, imagePublicIds[], condition, location, categoryId, subcategoryId, submittedByUserId, status, createdAt, approvedAt, viewCount | Products + ProductImages (embedded, max 10). `images` holds delivery URLs (Cloudinary, or `/uploads/products/…` for migrated images); `imagePublicIds` the Cloudinary public IDs |
| `products/{id}/reviews` | reviewer uid | userId, rating, comment, createdAt | ProductReviews (doc id enforces one per user) |
| `sellerReviews` | `{sellerUid}_{reviewerUid}` | sellerId, reviewerUserId, rating, comment, createdAt | SellerReviews |
| `listingRequests` | auto | productId, requestedByUserId, type, status, title…location, image, images[], imagePublicIds[], createdAt, reviewedAt | ListingRequests (ImagesJson → images) |
| `orders` | numeric id | id, buyerUserId, totals, status, createdAt, confirmedAt, **items[]**, productIds[] | Orders + OrderItems (embedded) |
| `paymentCards` | auto | bankName, cardNumber, cardHolderName, isActive, sortOrder | PaymentCards |
| `searchKeywords` | auto | keyword, lang, categoryId | SearchKeywords |
| `counters` | `products`, `categories`, `orders` | value | SQL identity columns (keeps `/product/details/12` and `#12` style ids) |
| `passwordResets` | uid | codeHash, expiresAt, attempts | User.ResetToken / ResetTokenExpiry |
| `uploadQuotas` | uid | windowStart, count | — (new: limits image uploads per user and hour) |

The SQL foreign-key rules are kept in code: categories with subcategories or listings can't be
deleted; a listing that appears in an order can't be hard-deleted; deleting a listing removes its
reviews and requests; deleting a category removes its keywords.

All queries use single-field indexes (filtering/sorting of small result sets happens in memory),
so `firestore.indexes.json` is empty. Approved listings, categories and keywords are cached with
Next.js cache tags and refreshed immediately after every change.

## Deliberate differences from the original

These are fixes or security hardening; everything else follows the original behaviour.

- Seller reviews take the seller from the listing on the server instead of a hidden form field.
- Password-reset codes use a cryptographic random generator, are stored hashed, and allow 5 attempts.
- Changing the email in Settings checks that the address is not already used (Firebase requires unique emails).
- Admin "Çıxış" link pointed to a non-existent `/admin/account/logout`; it now logs out.
- Cart/favourite prices are real numbers (the original rendered `data-price` with the az culture, e.g. `12,50`, which JavaScript reads as `NaN`).
- The fee hint shows "(30%)" (the original JavaScript printed `30.000000000000004%`).
- Titles/names in the cart and favourites pages are HTML-escaped (the original inserted them with `innerHTML`).
- The unused admin `Categories/Search` action (it would have crashed: wrong model type) was not recreated.
- Images are stored in Cloudinary instead of the web server's disk. Each image is limited to 10 MB and to
  common image formats, and images that are no longer used (replaced, rejected edit, hard delete, failed
  submission) are deleted from Cloudinary; the original kept every file forever.

Kept as in the original: the heart on listing cards starts un-highlighted even for favourites
(only the details page reads the saved state); admin-created listings have no "approved at" date.
