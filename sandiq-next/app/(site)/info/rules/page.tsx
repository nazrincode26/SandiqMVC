import type { Metadata } from "next";
import { t } from "@/lib/i18n";
import { getLang } from "@/lib/lang";

export const metadata: Metadata = { title: "Sandıq qaydaları" };

export default async function RulesPage() {
  const lang = await getLang();
  const sections = [
    ["safe-trade", "rules_safety_title", "rules_safety_text"],
    ["how-to-sell", "rules_howto_title", "rules_howto_text"],
    ["promotion-rules", "rules_promo_title", "rules_promo_text"],
  ];
  return (
    <div className="static-page">
      <h2>{t(lang, "rules_page_title")}</h2>
      {sections.map(([id, title, text]) => (
        <div key={id} className="static-page__section" id={id}>
          <h3>{t(lang, title)}</h3>
          <p>{t(lang, text)}</p>
        </div>
      ))}
    </div>
  );
}
