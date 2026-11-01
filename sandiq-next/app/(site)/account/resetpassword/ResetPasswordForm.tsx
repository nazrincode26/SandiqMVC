"use client";

import { useActionState, useState } from "react";
import { useLang } from "@/lib/client/lang";
import { addError, allMessages, isEmail, type FieldErrors, type FormState } from "@/lib/validation";
import { FieldError, ValidationSummary } from "@/components/site/FormBits";
import { resetPasswordAction } from "../actions";

/** Views/Account/ResetPassword.cshtml */
export default function ResetPasswordForm() {
  const { t } = useLang();
  const [state, formAction, pending] = useActionState(resetPasswordAction, {} as FormState);
  const [clientErrors, setClientErrors] = useState<FieldErrors | null>(null);
  const [code, setCode] = useState("");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = new FormData(e.currentTarget);
    const errors: FieldErrors = {};
    const email = String(form.get("Email") ?? "").trim();
    if (!email) addError(errors, "Email", "E-poçt tələb olunur");
    else if (!isEmail(email)) addError(errors, "Email", "Düzgün e-poçt daxil edin");
    if (!String(form.get("Code") ?? "").trim()) addError(errors, "Code", "Kod tələb olunur");
    const pwd = String(form.get("NewPassword") ?? "");
    if (!pwd) addError(errors, "NewPassword", "Yeni şifrə tələb olunur");
    else if (pwd.length < 6) addError(errors, "NewPassword", "Şifrə ən azı 6 simvol olmalıdır");
    if (Object.keys(errors).length) {
      e.preventDefault();
      setClientErrors(errors);
    } else setClientErrors(null);
  }

  const fields = clientErrors ?? state.fields ?? {};
  const messages = clientErrors ? Object.values(clientErrors).flat() : allMessages(state);

  return (
    <main className="auth-page">
      <h2>{t("reset_title")}</h2>

      {state.success ? (
        <>
          <p style={{ color: "green" }}>{t("reset_success")}</p>
          <p>
            <a href="/account/login">{t("login_link")}</a>
          </p>
        </>
      ) : (
        <form action={formAction} noValidate onSubmit={onSubmit}>
          <ValidationSummary messages={messages} />
          <input type="email" id="Email" name="Email" placeholder={t("email_placeholder")} defaultValue={state.values?.Email} />
          <FieldError messages={fields.Email} />
          <input
            type="text"
            id="Code"
            name="Code"
            inputMode="numeric"
            maxLength={6}
            placeholder={t("code_placeholder")}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
          />
          <FieldError messages={fields.Code} />
          <input type="password" id="NewPassword" name="NewPassword" placeholder={t("new_password_placeholder")} />
          <FieldError messages={fields.NewPassword} />
          <button type="submit" disabled={pending}>{t("reset_button")}</button>
        </form>
      )}
    </main>
  );
}
