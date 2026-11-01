import { t } from "@/lib/i18n";
import { getLang } from "@/lib/lang";

/** Views/Home/NotFound.cshtml (shown for every 404, as UseStatusCodePagesWithReExecute did). */
export default async function NotFound() {
  const lang = await getLang();
  return (
    <div className="not-found">
      <title>Səhifə tapılmadı - Sandıq</title>
      <h1>404</h1>
      <h2>{t(lang, "not_found_title")}</h2>
      <p>{t(lang, "not_found_text")}</p>
      <a href="/" className="post-ad-btn post-ad-btn--filled">{t(lang, "go_home_button")}</a>
    </div>
  );
}
