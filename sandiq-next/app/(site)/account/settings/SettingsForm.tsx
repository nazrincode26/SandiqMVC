"use client";

import { useActionState, useState } from "react";
import { useLang } from "@/lib/client/lang";
import { addError, allMessages, isEmail, type FieldErrors, type FormState } from "@/lib/validation";
import { FieldError, ValidationSummary } from "@/components/site/FormBits";
import PhoneInput from "@/components/site/PhoneInput";
import { settingsAction } from "../actions";

type Values = { FullName: string; Email: string; Phone: string };

/** Views/Account/Settings.cshtml */
export default function SettingsForm({ initial }: { initial: Values }) {
  const { t } = useLang();
  const [state, formAction, pending] = useActionState(settingsAction, { values: initial } as FormState);
  const [clientErrors, setClientErrors] = useState<FieldErrors | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = new FormData(e.currentTarget);
    const errors: FieldErrors = {};
    if (!String(form.get("FullName") ?? "").trim()) addError(errors, "FullName", "Ad Soyad tələb olunur");
    const email = String(form.get("Email") ?? "").trim();
    if (!email) addError(errors, "Email", "E-poçt tələb olunur");
    else if (!isEmail(email)) addError(errors, "Email", "Düzgün e-poçt daxil edin");
    if (Object.keys(errors).length) {
      e.preventDefault();
      setClientErrors(errors);
    } else setClientErrors(null);
  }

  const fields = clientErrors ?? state.fields ?? {};
  const messages = clientErrors ? Object.values(clientErrors).flat() : allMessages(state);
  const v = (state.values ?? initial) as Values;
  const formKey = JSON.stringify(v);

  return (
    <form action={formAction} noValidate onSubmit={onSubmit} className="settings-form" key={formKey}>
      <h2>{t("settings_title")}</h2>
      <p>{t("settings_subtitle")}</p>

      {messages.length > 0 && <ValidationSummary messages={messages} />}

      {state.success && !clientErrors && <p style={{ color: "green" }}>{t("settings_saved_success")}</p>}

      <label>
        <span>{t("name_label")}</span>
        <input type="text" id="FullName" name="FullName" defaultValue={v.FullName} />
        <FieldError messages={fields.FullName} />
      </label>

      <label>
        <span>{t("email_label")}</span>
        <input type="email" id="Email" name="Email" defaultValue={v.Email} />
        <FieldError messages={fields.Email} />
      </label>

      <label>
        <span>{t("phone_label")}</span>
        <PhoneInput defaultValue={v.Phone} />
        <FieldError messages={fields.Phone} />
      </label>

      <button type="submit" disabled={pending}>{t("save_button")}</button>
    </form>
  );
}
