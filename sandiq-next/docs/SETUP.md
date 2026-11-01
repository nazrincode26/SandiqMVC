# Setup and deployment

The app is one Next.js project. Firebase (free Spark plan is enough) provides Authentication and
Cloud Firestore; Cloudinary (free plan is enough to start) stores and delivers listing images.
Firebase Storage is **not** used, so no Blaze upgrade is needed.

## 1. Firebase project (`sandiq-9d8f2`)

In the [Firebase console](https://console.firebase.google.com/project/sandiq-9d8f2):

1. **Authentication → Sign-in method**
   - Enable **Email/Password**.
   - Enable **Google**. Open its settings and copy the **Web client ID** — this is
     `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. (To keep using the old client ID
     `206848495869-…`, add it under *Allowlist client IDs from external projects* instead.)
   - **Settings → Authorized domains:** add your Vercel domain(s) and `localhost`.
   - Keep the default *one account per email address*.
2. **Firestore Database:** create it (production mode, a region close to Azerbaijan such as
   `europe-west` / `eur3`). The region cannot be changed later.
3. **Deploy the security rules and indexes** (from this folder):
   ```bash
   npx firebase-tools login
   npx firebase-tools deploy --only firestore:rules,firestore:indexes --project sandiq-9d8f2
   ```
   Firestore rules deny all browser access: the server reads and writes with the Admin SDK.
   All queries use automatic single-field indexes, so `firestore.indexes.json` is empty.
4. **Service account:** Project settings → Service accounts → *Generate new private key*.
   Put `client_email` and `private_key` into `FIREBASE_CLIENT_EMAIL` / `FIREBASE_PRIVATE_KEY`
   (server-only variables). Never commit the JSON file (`service-account*.json` is gitignored).
5. Seed and create the first admin:
   ```bash
   npm run seed              # search keywords (categories come from the migration, or add --with-categories)
   npm run set-admin -- you@example.com
   ```

## 2. Cloudinary

In the [Cloudinary console](https://console.cloudinary.com/):

1. **Settings → API Keys:** note the **cloud name**, the **API key** and the **API secret**. Put them in
   `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (server-only — never with a
   `NEXT_PUBLIC_` prefix). A dedicated API key for this app is recommended so it can be rotated alone.
2. No upload preset is needed: every upload is **signed** by the server. Leave *unsigned* uploading
   off (no unsigned preset), so nobody can upload without a signature.
3. Optional: **Settings → Security → Restricted media types** can stay at the defaults; the app only
   accepts `jpg, jpeg, png, gif, webp, avif, heic, heif`. If you enable *Strict transformations*, allow
   the transformation `c_limit,w_1600,f_auto,q_auto`, which the stored image URLs use.
4. If the account's API signature algorithm was changed to SHA-256, set
   `CLOUDINARY_SIGNATURE_ALGORITHM=sha256` (the default is SHA-1).

How uploads work:

1. The browser asks the server (a server action, so Next.js' same-origin check applies) for one
   signed upload slot per image. The server checks the session, limits non-admins to 100 images per
   hour, and signs a public ID it chose: `sandiq/listings/{uid}/{uuid}` (`allowed_formats` and
   `overwrite=false` are part of the signature).
2. The browser uploads each file straight to Cloudinary (so Vercel's 4.5 MB request limit does not
   apply). The API secret never leaves the server.
3. When the listing form is submitted, the server looks the images up with the Admin API and only
   attaches them if they are in the user's own folder, exist, are images in an allowed format and are
   at most 10 MB. Firestore stores both the delivery URLs (`images`, `image`) and the public IDs
   (`imagePublicIds`).
4. Replaced images are deleted only **after** the new ones are saved (admin edit, approved edit
   request). Images of rejected edit requests, hard-deleted listings and failed submissions are
   deleted too. Soft-deleted or rejected listings keep their images.

## 3. Environment variables

See [`.env.example`](../.env.example). `.env.local` already contains the web config for
`sandiq-9d8f2`; fill in the service account, Cloudinary, SMTP and Gemini values.

| Variable | Where it is used |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_*` | Browser: sign-in only (public values) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google sign-in button |
| `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` | Server only (Admin SDK) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Server only (signing, verification, deletion) |
| `CLOUDINARY_UPLOAD_FOLDER`, `CLOUDINARY_SIGNATURE_ALGORITHM` | Optional (server only) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM_NAME` | Password-reset emails |
| `GEMINI_API_KEY`, `GEMINI_MODEL` | Help chatbot |

**Security note:** the old project's configuration file contains a Gmail app password and a Gemini
key in plain text, and they are in git history. Rotate both and only store the new values in
`.env.local` / Vercel.

## 4. Deploy to Vercel

1. Push the repository (when you are ready) and import it in Vercel.
2. **Root Directory:** `sandiq-next`. Framework preset: Next.js (build `next build`, Node 22+ / 24).
3. Add every variable from `.env.example` under *Settings → Environment Variables*
   (paste `FIREBASE_PRIVATE_KEY` with its `\n` sequences; do **not** set the emulator variables).
4. Deploy, then add the Vercel domain to Firebase *Authorized domains* and to the Google OAuth
   client's *Authorized JavaScript origins*.

## Notes

- Sessions use an httpOnly Firebase session cookie (`__session`, 14-day token, cleared when the
  browser session ends — like the original cookie).
- Old images under `/uploads/products/…` are served from `public/uploads`, so migrated listings keep
  working. They are never deleted by the app; moving them to Cloudinary is a separate, optional step
  that needs its own approval.
- Uploads that are signed but never submitted (e.g. the user closes the tab mid-upload) stay in
  Cloudinary under `sandiq/listings/`. Any asset there whose public ID is not in a product's or
  listing request's `imagePublicIds` can be removed safely.
- In development, if SMTP is not configured, reset codes are printed to the server console.
- `next dev` may print a framework "Encountered a script tag" console notice; it does not occur in app code and has no effect.
