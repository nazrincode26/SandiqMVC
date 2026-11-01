import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Firebase Admin is initialised lazily so `next build` works without secrets.
let app: App | undefined;

function usingEmulators() {
  return Boolean(process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST);
}

function getAdminApp(): App {
  if (app) return app;
  const existing = getApps();
  if (existing.length) {
    app = existing[0];
    return app;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (clientEmail && privateKey) {
    app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId });
  } else if (usingEmulators()) {
    app = initializeApp({ projectId });
  } else {
    throw new Error(
      "Firebase Admin credentials are missing. Set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY (see .env.example)."
    );
  }
  return app;
}

export const adminAuth = () => getAuth(getAdminApp());

// Pages and route handlers can load this module separately while sharing one
// Firebase app, so the configured Firestore instance is kept on globalThis.
const globalForDb = globalThis as unknown as { __sandiqDb?: FirebaseFirestore.Firestore };

export function adminDb() {
  if (!globalForDb.__sandiqDb) {
    const db = getFirestore(getAdminApp());
    try {
      db.settings({ ignoreUndefinedProperties: true });
    } catch {
      // Already configured by an earlier copy of this module (e.g. after a dev hot reload).
    }
    globalForDb.__sandiqDb = db;
  }
  return globalForDb.__sandiqDb;
}
