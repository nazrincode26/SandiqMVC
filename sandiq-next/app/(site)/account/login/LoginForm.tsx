"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { clientAuth } from "@/lib/firebase/client";
import { useLang } from "@/lib/client/lang";
import { establishSession, getReturnUrlParam, localReturnUrl } from "@/lib/client/session";
import { addError, isEmail, type FieldErrors } from "@/lib/validation";
import { FieldError, ValidationSummary } from "@/components/site/FormBits";
import GoogleSignIn from "@/components/site/GoogleSignIn";

/** Views/Account/Login.cshtml + AccountController.Login (POST). */
export default function LoginForm() {
  const { t } = useLang();
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
    try {
      const credential = await signInWithEmailAndPassword(clientAuth(), email, password);
      const result = await establishSession(credential);
      if (!result.ok) throw new Error(result.message);
      window.location.href = localReturnUrl(getReturnUrlParam()) ?? "/";
    } catch {
      setSummary(["Email və ya şifrə yanlışdır."]);
      setBusy(false);
    }
  }

  const allErrors = [...Object.values(fields).flat(), ...summary];

  return (
    <main className="auth-page">
      <h2>{t("login_title")}</h2>
      <form method="post" noValidate onSubmit={onSubmit}>
        <ValidationSummary messages={allErrors} />
        <input type="email" id="Email" name="Email" placeholder={t("email_placeholder")} />
        <FieldError messages={fields.Email} />
        <input type="password" id="Password" name="Password" placeholder={t("password_placeholder")} />
        <FieldError messages={fields.Password} />
        <button type="submit" disabled={busy}>{t("login_button")}</button>
      </form>
      <div className="auth-divider">
        <span>{t("or_divider")}</span>
      </div>
      <GoogleSignIn useReturnUrl errorLabel="Google ilə giriş uğursuz oldu:" />
      <p>
        <a href="/account/forgotpassword">{t("forgot_password_link")}</a>
      </p>
      <p>
        <span>{t("no_account")}</span> <a href="/account/register">{t("register_link")}</a>
      </p>
    </main>
  );
}
