import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { categoriesForClient, getCategoryTree } from "@/lib/data/categories";
import { getTitleKeywords } from "@/lib/data/keywords";
import { t } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import ListingForm from "../ListingForm";

export const metadata: Metadata = { title: "Elan yerləşdir" };

/** ListingsController.Create (GET) — anonymous visitors see a login prompt. */
export default async function CreateListingPage() {
  const [lang, user] = await Promise.all([getLang(), getCurrentUser()]);

  if (!user) {
    return (
      <div className="post-ad-gate">
        <h2>{t(lang, "login_required_title")}</h2>
        <p>{t(lang, "login_required_text")}</p>
        <div className="post-ad-gate__actions">
          <a href="/account/login" className="post-ad-btn">{t(lang, "login_button_gate")}</a>
          <a href="/account/register" className="post-ad-btn post-ad-btn--filled">{t(lang, "register_link")}</a>
        </div>
      </div>
    );
  }

  const [tree, keywords] = await Promise.all([getCategoryTree(), getTitleKeywords()]);
  return <ListingForm mode="create" categories={categoriesForClient(tree)} titleKeywords={keywords} />;
}
