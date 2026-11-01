"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { clientAuth } from "@/lib/firebase/client";
import { establishSession } from "@/lib/client/session";
import { addError, isEmail, type FieldErrors } from "@/lib/validation";
import { FieldError, ValidationSummary } from "@/components/site/FormBits";

/** Admin AccountController.Login (POST) — only accounts with the admin flag get a session. */
export default function AdminLoginForm({ returnUrl }: { returnUrl: string | null }) {
  const [fields, setFields] = useState<FieldErrors>({});
  const [summary, setSummary] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("Email") ?? "").trim();
    const password = String(form.get("Password") ?? "");
    const errors: FieldErrors = {};
    if (!email) addError(errors, "Email", "E-poçt tələb olunur");
    else if (!isEmail(email)) addError(errors, "Email", "Düzgün e-poçt daxil edin");
    if (!password) addError(errors, "Password", "Şifrə tələb olunur");
    setFields(errors);
    setSummary([]);
    if (Object.keys(errors).length) return;

    setBusy(true);
    let credential;
    try {
      credential = await signInWithEmailAndPassword(clientAuth(), email, password);
    } catch {
      setSummary(["Email və ya şifrə yanlışdır."]);
      setBusy(false);
      return;
    }
    const result = await establishSession(credential, "admin").catch(() => ({ ok: false, status: 0, message: undefined }));
    if (!result.ok) {
      setSummary([result.status === 403 && result.message ? result.message : "Email və ya şifrə yanlışdır."]);
      setBusy(false);
      return;
    }
    window.location.href = returnUrl ?? "/admin";
  }

  return (
    <>
      <ValidationSummary messages={[...Object.values(fields).flat(), ...summary]} />
      <form method="post" noValidate onSubmit={onSubmit}>
        <input type="email" id="Email" name="Email" placeholder="E-poçt" />
        <FieldError messages={fields.Email} className="" />
        <input type="password" id="Password" name="Password" placeholder="Şifrə" />
        <FieldError messages={fields.Password} className="" />
        <button type="submit" disabled={busy}>
          Daxil ol
        </button>
      </form>
    </>
  );
}
