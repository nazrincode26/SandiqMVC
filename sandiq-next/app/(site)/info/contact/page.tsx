import type { Metadata } from "next";
import { t } from "@/lib/i18n";
import { getLang } from "@/lib/lang";

export const metadata: Metadata = { title: "Əlaqə" };

export default async function ContactPage() {
  const lang = await getLang();
  return (
    <div className="static-page">
      <h2>{t(lang, "contact_page_title")}</h2>
      <p>{t(lang, "contact_intro")}</p>

      <div className="contact-info">
        <div className="contact-info__item">
          <span>{t(lang, "contact_email_label")}</span>:{" "}
          <a href="mailto:elaqe@sandiq.az">elaqe@sandiq.az</a>
        </div>
        <div className="contact-info__item">
          <span>{t(lang, "contact_instagram_label")}</span>:{" "}
          <a href="#" target="_blank" rel="noopener">@sandiq</a>
        </div>
      </div>
    </div>
  );
}
