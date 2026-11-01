"use client";

import { useActionState } from "react";
import { useLang } from "@/lib/client/lang";
import { allMessages, type FormState } from "@/lib/validation";
import { FieldError, ValidationSummary } from "@/components/site/FormBits";
import PhoneInput from "@/components/site/PhoneInput";
import { completeProfileAction } from "../actions";

/** Views/Account/CompleteProfile.cshtml */
export default function CompleteProfileForm() {
  const { t } = useLang();
  const [state, formAction, pending] = useActionState(completeProfileAction, {} as FormState);

  return (
    <main className="auth-page">
      <h2>{t("complete_profile_title")}</h2>
      <p>{t("complete_profile_subtitle")}</p>
      <form action={formAction} noValidate>
        <ValidationSummary messages={allMessages(state)} />
        <PhoneInput defaultValue={state.values?.Phone} key={state.values?.Phone ?? ""} />
        <FieldError messages={state.fields?.Phone} />
        <button type="submit" disabled={pending}>{t("continue_button")}</button>
      </form>
    </main>
  );
}
