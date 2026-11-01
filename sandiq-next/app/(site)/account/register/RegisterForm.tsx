"use client";

import { useActionState, useEffect, useState } from "react";
import { signInWithCustomToken } from "firebase/auth";
import { clientAuth } from "@/lib/firebase/client";
import { useLang } from "@/lib/client/lang";
import { establishSession } from "@/lib/client/session";
import { addError, allMessages, isEmail, type FieldErrors } from "@/lib/validation";
import { FieldError, ValidationSummary } from "@/components/site/FormBits";
import GoogleSignIn from "@/components/site/GoogleSignIn";
import PhoneInput from "@/components/site/PhoneInput";
import { registerAction, type RegisterState } from "../actions";

/** Views/Account/Register.cshtml */
export default function RegisterForm() {
  const { t } = useLang();
  const [state, formAction, pending] = useActionState(registerAction, {} as RegisterState);
  const [clientErrors, setClientErrors] = useState<FieldErrors | null>(null);
  const [failed, setFailed] = useState(false);

  // After the server creates the account, finish signing in (SignInUser) and go home.
  useEffect(() => {
    if (!state.customToken) return;
    (async () => {
      try {
        const credential = await signInWithCustomToken(clientAuth(), state.customToken!);
        const result = await establishSession(credential);
        if (!result.ok) throw new Error(result.message);
        window.location.href = "/";
      } catch {
        setFailed(true);
      }
    })();
  }, [state.customToken]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = new FormData(e.currentTarget);
    const errors: FieldErrors = {};
    if (!String(form.get("FullName") ?? "").trim()) addError(errors, "FullName", "Ad Soyad tələb olunur");
    const email = String(form.get("Email") ?? "").trim();
    if (!email) addError(errors, "Email", "E-poçt tələb olunur");
    else if (!isEmail(email)) addError(errors, "Email", "Düzgün e-poçt daxil edin");
    const password = String(form.get("Password") ?? "");
    if (!password) addError(errors, "Password", "Şifrə tələb olunur");
    else if (password.length < 6) addError(errors, "Password", "Şifrə ən azı 6 simvol olmalıdır");
    if (Object.keys(errors).length) {
      e.preventDefault();
      setClientErrors(errors);
    } else {
      setClientErrors(null);
    }
  }

  const fields = clientErrors ?? state.fields ?? {};
  const messages = clientErrors ? Object.values(clientErrors).flat() : allMessages(state);
  if (failed) messages.push("Xəta baş verdi, yenidən cəhd edin");
  const v = state.values ?? {};

  return (
    <main className="auth-page">
      <h2>{t("register_title")}</h2>
      <form action={formAction} noValidate onSubmit={onSubmit}>
        <ValidationSummary messages={messages} />
        <input type="text" id="FullName" name="FullName" placeholder={t("fullname_placeholder")} defaultValue={v.FullName} key={`fn-${v.FullName}`} />
        <FieldError messages={fields.FullName} />
        <input type="email" id="Email" name="Email" placeholder={t("email_placeholder")} defaultValue={v.Email} key={`em-${v.Email}`} />
        <FieldError messages={fields.Email} />
        <PhoneInput defaultValue={v.Phone} key={`ph-${v.Phone}`} />
        <FieldError messages={fields.Phone} />
        <input type="password" id="Password" name="Password" placeholder={t("password_placeholder")} />
        <FieldError messages={fields.Password} />
        <button type="submit" disabled={pending || Boolean(state.customToken && !failed)}>
          {t("register_button")}
        </button>
      </form>
      <div className="auth-divider">
        <span>{t("or_divider")}</span>
      </div>
      <GoogleSignIn useReturnUrl={false} errorLabel="Google ilə qeydiyyat uğursuz oldu:" />
      <p>
        <span>{t("have_account")}</span> <a href="/account/login">{t("login_link")}</a>
      </p>
    </main>
  );
}
