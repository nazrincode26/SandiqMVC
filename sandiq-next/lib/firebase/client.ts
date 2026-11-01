"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, inMemoryPersistence, initializeAuth, type Auth } from "firebase/auth";

// The browser only uses Firebase to obtain an ID token at sign-in (listing
// images go to Cloudinary). Sign-in state lives in an httpOnly session cookie,
// so client auth is kept in memory and never persisted.
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";

let authInstance: Auth | undefined;

function app() {
  return getApps().length ? getApp() : initializeApp(config);
}

export function clientAuth(): Auth {
  if (authInstance) return authInstance;
  try {
    authInstance = initializeAuth(app(), { persistence: inMemoryPersistence });
  } catch {
    authInstance = getAuth(app());
  }
  if (useEmulators) {
    connectAuthEmulator(authInstance, "http://127.0.0.1:9099", { disableWarnings: true });
  }
  return authInstance;
}
