import type { Metadata } from "next";
import { t } from "@/lib/i18n";
import { getLang } from "@/lib/lang";

export const metadata: Metadata = { title: "Hüquqi məlumat" };

export default async function LegalPage() {
  const lang = await getLang();
  const sections = [
    ["user-agreement", "legal_agreement_title", "legal_agreement_text"],
    ["privacy-policy", "legal_privacy_title", "legal_privacy_text"],
    ["offer-agreement", "legal_offer_title", "legal_offer_text"],
    ["ad-posting-terms", "legal_adterms_title", "legal_adterms_text"],
  ];
  return (
    <div className="static-page">
      <h2>{t(lang, "legal_page_title")}</h2>
      {sections.map(([id, title, text]) => (
        <div key={id} className="static-page__section" id={id}>
          <h3>{t(lang, title)}</h3>
          <p>{t(lang, text)}</p>
        </div>
      ))}
    </div>
  );
}
