"use client";

import { useActionState, useState } from "react";
import { useLang } from "@/lib/client/lang";
import { allMessages, isEmail, type FormState } from "@/lib/validation";
import { FieldError, ValidationSummary } from "@/components/site/FormBits";
import { forgotPasswordAction } from "../actions";

/** Views/Account/ForgotPassword.cshtml */
export default function ForgotPasswordForm() {
  const { t } = useLang();
  const [state, formAction, pending] = useActionState(forgotPasswordAction, {} as FormState);
  const [clientError, setClientError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    const email = String(new FormData(e.currentTarget).get("Email") ?? "").trim();
    const error = !email ? "E-poçt tələb olunur" : !isEmail(email) ? "Düzgün e-poçt daxil edin" : null;
    setClientError(error);
    if (error) e.preventDefault();
  }

  const fieldErrors = clientError ? [clientError] : state.fields?.Email;

  return (
    <main className="auth-page">
      <h2>{t("forgot_title")}</h2>
      <p>{t("forgot_subtitle")}</p>

      {state.success ? (
        <p style={{ color: "green" }}>{t("forgot_success")}</p>
      ) : (
        <form action={formAction} noValidate onSubmit={onSubmit}>
          <ValidationSummary messages={clientError ? [clientError] : allMessages(state)} />
          <input type="email" id="Email" name="Email" placeholder={t("email_placeholder")} defaultValue={state.values?.Email} />
          <FieldError messages={fieldErrors} />
          <button type="submit" disabled={pending}>{t("send_code_button")}</button>
        </form>
      )}
      <p>
        <span>{t("got_code")}</span> <a href="/account/resetpassword">{t("reset_link")}</a>
      </p>
    </main>
  );
}
