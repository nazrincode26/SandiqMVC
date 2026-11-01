// Shared Firebase Admin setup for the command-line scripts.
// Reads the same environment variables as the app (.env.local is loaded by the npm scripts).
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
const emulated = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

if (!emulated && !(clientEmail && privateKey)) {
  console.error("Missing FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY (or set FIRESTORE_EMULATOR_HOST for the emulator).");
  process.exit(1);
}

const app = clientEmail && privateKey
  ? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId })
  : initializeApp({ projectId });

export const db = getFirestore(app);
export const auth = getAuth(app);
export const target = emulated ? `emulator (${projectId})` : `project ${projectId}`;

export const args = process.argv.slice(2);
export const hasFlag = (name: string) => args.includes(name);
export function option(name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

/** Commits writes in chunks below Firestore's 500-operation batch limit. */
export async function commitInChunks(ops: ((batch: FirebaseFirestore.WriteBatch) => void)[], size = 400) {
  for (let i = 0; i < ops.length; i += size) {
    const batch = db.batch();
    ops.slice(i, i + size).forEach((op) => op(batch));
    await batch.commit();
  }
}
