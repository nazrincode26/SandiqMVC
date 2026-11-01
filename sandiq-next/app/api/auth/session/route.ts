import { NextResponse, type NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { profileFromDoc, SESSION_COOKIE, SESSION_MAX_AGE_MS } from "@/lib/auth";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

/**
 * Exchanges a fresh Firebase ID token (from email/password or Google sign-in in
 * the browser) for an httpOnly session cookie. Mirrors SignInUser/GoogleLogin.
 */
export async function POST(request: NextRequest) {
  let body: { idToken?: unknown; mode?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Bad request" }, { status: 400 });
  }
  if (typeof body.idToken !== "string" || !body.idToken) {
    return NextResponse.json({ message: "Bad request" }, { status: 400 });
  }

  let decoded;
  try {
    decoded = await adminAuth().verifyIdToken(body.idToken);
  } catch {
    return NextResponse.json({ message: "Bad request" }, { status: 400 });
  }
  // Only accept tokens minted in the last 5 minutes (a real, recent sign-in).
  if (Date.now() / 1000 - decoded.auth_time > 5 * 60) {
    return NextResponse.json({ message: "Recent sign-in required" }, { status: 401 });
  }

  const ref = adminDb().collection("users").doc(decoded.uid);
  const isGoogle = decoded.firebase?.sign_in_provider === "google.com";
  const googleId = isGoogle ? (decoded.firebase.identities?.["google.com"]?.[0] as string | undefined) ?? null : null;

  // AccountController.GoogleLogin: create the profile on first Google sign-in,
  // or remember the Google id on an existing account.
  const profile = await adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      const data = {
        fullName: decoded.name || decoded.email || "",
        email: decoded.email ?? "",
        phone: null,
        isAdmin: false,
        googleId,
        createdAt: FieldValue.serverTimestamp(),
      };
      tx.create(ref, data);
      return profileFromDoc(decoded.uid, data)!;
    }
    if (googleId && !snap.get("googleId")) tx.update(ref, { googleId });
    return profileFromDoc(decoded.uid, snap.data())!;
  });

  if (body.mode === "admin" && !profile.isAdmin) {
    return NextResponse.json({ message: "Bu hesabın admin panelinə giriş icazəsi yoxdur." }, { status: 403 });
  }

  const sessionCookie = await adminAuth().createSessionCookie(body.idToken, { expiresIn: SESSION_MAX_AGE_MS });
  const response = NextResponse.json({ needsPhone: !profile.phone?.trim() });
  // No max-age: like the original auth cookie, it ends with the browser session.
  response.cookies.set(SESSION_COOKIE, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
  return response;
}
