"use client";

import { useLang } from "@/lib/client/lang";

/** Views/Shared/Error.cshtml */
export default function ErrorPage({ error }: { error: Error & { digest?: string } }) {
  const { t } = useLang();
  return (
    <div className="not-found">
      <title>Xəta baş verdi - Sandıq</title>
      <h1>⚠️</h1>
      <h2>{t("error_title")}</h2>
      <p>{t("error_text")}</p>
      {error.digest && (
        <p className="not-found__request-id">
          Request ID: <code>{error.digest}</code>
        </p>
      )}
      <a href="/" className="post-ad-btn post-ad-btn--filled">{t("go_home_button")}</a>
    </div>
  );
}
