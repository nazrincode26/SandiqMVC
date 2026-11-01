"use server";

import { createHash, randomInt } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { requireUser } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { addError, hasErrors, normalizePhone, requireEmail, str, type FieldErrors, type FormState } from "@/lib/validation";

const EMAIL_TAKEN = "Bu email artıq qeydiyyatdan keçib.";

async function emailInUse(email: string, exceptUid?: string) {
  try {
    const existing = await adminAuth().getUserByEmail(email);
    return existing.uid !== exceptUid;
  } catch {
    return false;
  }
}

export interface RegisterState extends FormState {
  customToken?: string;
}

/**
 * AccountController.Register. Creates the Firebase Auth user and profile on the
 * server, then hands back a custom token so the browser can finish signing in.
 */
export async function registerAction(_prev: RegisterState, form: FormData): Promise<RegisterState> {
  const values = {
    FullName: str(form, "FullName"),
    Email: str(form, "Email").trim(),
    Phone: str(form, "Phone"),
  };
  const password = str(form, "Password");
  const errors: FieldErrors = {};

  if (!values.FullName.trim()) addError(errors, "FullName", "Ad Soyad tələb olunur");
  requireEmail(errors, "Email", values.Email);
  const phone = normalizePhone(values.Phone, false);
  if (phone.error) addError(errors, "Phone", phone.error);
  if (!password) addError(errors, "Password", "Şifrə tələb olunur");
  else if (password.length < 6) addError(errors, "Password", "Şifrə ən azı 6 simvol olmalıdır");

  if (hasErrors(errors)) return { fields: errors, values };

  if (await emailInUse(values.Email)) return { summary: [EMAIL_TAKEN], values };

  let uid: string;
  try {
    const created = await adminAuth().createUser({ email: values.Email, password, displayName: values.FullName });
    uid = created.uid;
  } catch (error) {
    if ((error as { code?: string }).code === "auth/email-already-exists") return { summary: [EMAIL_TAKEN], values };
    throw error;
  }

  await adminDb().collection("users").doc(uid).set({
    fullName: values.FullName,
    email: values.Email,
    phone: phone.phone,
    isAdmin: false,
    googleId: null,
    createdAt: FieldValue.serverTimestamp(),
  });

  return { success: true, customToken: await adminAuth().createCustomToken(uid), values };
}

/** AccountController.CompleteProfile (POST) */
export async function completeProfileAction(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("/Account/CompleteProfile");
  const raw = str(form, "Phone");
  const phone = normalizePhone(raw, true);
  if (phone.error) return { fields: { Phone: [phone.error] }, values: { Phone: phone.phone ?? "" } };

  await adminDb().collection("users").doc(user.uid).update({ phone: phone.phone });
  redirect("/");
}

/** AccountController.Settings (POST) */
export async function settingsAction(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser("/Account/Settings");
  const values = {
    FullName: str(form, "FullName"),
    Email: str(form, "Email").trim(),
    Phone: str(form, "Phone"),
  };
  const errors: FieldErrors = {};
  const phone = normalizePhone(values.Phone, false);
  if (phone.error) addError(errors, "Phone", phone.error);
  if (!values.FullName.trim()) addError(errors, "FullName", "Ad Soyad tələb olunur");
  requireEmail(errors, "Email", values.Email);
  if (hasErrors(errors)) return { fields: errors, values };

  if (values.Email.toLowerCase() !== user.email.toLowerCase()) {
    if (await emailInUse(values.Email, user.uid)) return { summary: [EMAIL_TAKEN], values };
  }

  try {
    await adminAuth().updateUser(user.uid, { email: values.Email, displayName: values.FullName });
  } catch (error) {
    if ((error as { code?: string }).code === "auth/email-already-exists") return { summary: [EMAIL_TAKEN], values };
    throw error;
  }
  await adminDb().collection("users").doc(user.uid).update({
    fullName: values.FullName,
    email: values.Email,
    phone: phone.phone,
  });

  revalidatePath("/", "layout");
  return { success: true, values: { ...values, Phone: phone.phone ?? "" } };
}

const RESET_TTL_MS = 15 * 60 * 1000;
const RESET_MAX_ATTEMPTS = 5;
const hashCode = (uid: string, code: string) => createHash("sha256").update(`${uid}:${code}`).digest("hex");

/** AccountController.ForgotPassword — always reports success so emails can't be probed. */
export async function forgotPasswordAction(_prev: FormState, form: FormData): Promise<FormState> {
  const email = str(form, "Email").trim();
  const errors: FieldErrors = {};
  requireEmail(errors, "Email", email);
  if (hasErrors(errors)) return { fields: errors, values: { Email: email } };

  let uid: string | null = null;
  try {
    uid = (await adminAuth().getUserByEmail(email)).uid;
  } catch {
    uid = null;
  }

  if (uid) {
    const code = randomInt(100000, 1000000).toString();
    await adminDb()
      .collection("passwordResets")
      .doc(uid)
      .set({ codeHash: hashCode(uid, code), expiresAt: Timestamp.fromMillis(Date.now() + RESET_TTL_MS), attempts: 0 });
    await sendPasswordResetEmail(email, code);
  }

  return { success: true, values: { Email: email } };
}

/** AccountController.ResetPassword */
export async function resetPasswordAction(_prev: FormState, form: FormData): Promise<FormState> {
  const values = { Email: str(form, "Email").trim(), Code: str(form, "Code").trim() };
  const newPassword = str(form, "NewPassword");
  const errors: FieldErrors = {};
  requireEmail(errors, "Email", values.Email);
  if (!values.Code) addError(errors, "Code", "Kod tələb olunur");
  if (!newPassword) addError(errors, "NewPassword", "Yeni şifrə tələb olunur");
  else if (newPassword.length < 6) addError(errors, "NewPassword", "Şifrə ən azı 6 simvol olmalıdır");
  if (hasErrors(errors)) return { fields: errors, values };

  const invalid: FormState = { summary: ["Kod yanlışdır və ya vaxtı bitib."], values };

  let uid: string;
  try {
    uid = (await adminAuth().getUserByEmail(values.Email)).uid;
  } catch {
    return invalid;
  }

  const ref = adminDb().collection("passwordResets").doc(uid);
  const valid = await adminDb().runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return false;
    const expiresAt = (snap.get("expiresAt") as Timestamp).toMillis();
    const attempts = Number(snap.get("attempts") ?? 0);
    if (expiresAt < Date.now() || attempts >= RESET_MAX_ATTEMPTS) return false;
    if (snap.get("codeHash") !== hashCode(uid, values.Code)) {
      // Limit guesses: a 6-digit code could otherwise be brute-forced in 15 minutes.
      tx.update(ref, { attempts: attempts + 1 });
      return false;
    }
    tx.delete(ref);
    return true;
  });
  if (!valid) return invalid;

  await adminAuth().updateUser(uid, { password: newPassword });
  return { success: true, values };
}
