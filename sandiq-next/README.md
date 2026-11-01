# Sandıq — Next.js + Firebase + Cloudinary

A rebuild of the original Sandıq marketplace (an ASP.NET MVC app, still available in this repository's git history) as a single
Next.js 16 application (App Router, TypeScript). Firebase provides Authentication and Cloud
Firestore; Cloudinary stores and delivers listing images. Pages, styles, texts, routes and business
rules follow the original application.

- **Setup & deployment:** [docs/SETUP.md](docs/SETUP.md)
- **What was rebuilt, and how it maps to the original:** [docs/INVENTORY.md](docs/INVENTORY.md)
- **Moving the existing SQL Server data:** [docs/MIGRATION.md](docs/MIGRATION.md)

## Quick start (local, against Firebase emulators — no cloud account needed)

Requires Node 22.18+ (24 recommended) and Java 21 for the emulators.

```bash
npm install
npm run emulators                      # terminal 1 (auth 9099, firestore 8080)

# terminal 2 — point scripts and the app at the emulators
export FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
       NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true \
       FIREBASE_PROJECT_ID=demo-sandiq NEXT_PUBLIC_FIREBASE_PROJECT_ID=demo-sandiq \
       NEXT_PUBLIC_FIREBASE_API_KEY=demo-key FIREBASE_CLIENT_EMAIL= FIREBASE_PRIVATE_KEY=
npm run seed -- --with-categories
npm run set-admin -- admin@sandiq.test --create --password admin123 --name "Admin"
npm run dev                            # http://localhost:3000, admin at /admin
```

Image uploads need Cloudinary credentials (`CLOUDINARY_*`, see `.env.example`); there is no
Cloudinary emulator. Without them everything else works and the listing forms explain that image
upload is unavailable. Use a separate `CLOUDINARY_UPLOAD_FOLDER` (e.g. `sandiq-dev/listings`) for
development.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` / `build` / `start` | Next.js |
| `npm run typecheck` / `lint` | TypeScript and ESLint |
| `npm test` | Unit tests (Node's built-in test runner) |
| `npm run verify:cloudinary` | Checks the Cloudinary settings with a signed test upload (deleted afterwards) |
| `npm run seed [-- --with-categories]` | Search keywords (and, for empty projects, the category tree) |
| `npm run set-admin -- <email>` | Grant the admin role (`users/{uid}.isAdmin`) |
| `npm run migrate -- --dir migration-data [--execute]` | Copy exported SQL data into Firebase (dry run without `--execute`) |
| `npm run emulators` | Local Firebase emulators (needs the Firebase CLI, e.g. `npx firebase-tools`) |

## Layout

```
app/(site)/…        public site
app/admin/…         admin area
app/api/auth/…      session cookie endpoint
components/          shared UI (header, product card, forms)
lib/                 Firebase setup, auth, Cloudinary images, data access, formatting, validation
styles/              original CSS files, unchanged
public/              logo and the existing uploaded product images (/uploads/products/…)
scripts/             seed, set-admin, SQL export + migration (one-off migration tooling)
tests/               unit tests
firestore.rules, firestore.indexes.json, firebase.json
```
