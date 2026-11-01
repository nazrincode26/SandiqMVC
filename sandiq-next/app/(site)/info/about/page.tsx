import type { Metadata } from "next";
import { t } from "@/lib/i18n";
import { getLang } from "@/lib/lang";

export const metadata: Metadata = { title: "Bizim haqqımızda" };

export default async function AboutPage() {
  const lang = await getLang();
  return (
    <div className="static-page">
      <h2>{t(lang, "about_page_title")}</h2>
      <p>{t(lang, "about_text_1")}</p>
      <p>{t(lang, "about_text_2")}</p>
    </div>
  );
}
