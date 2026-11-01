import "@/styles/site/bootstrap.min.css";
import "@/styles/site/style.css";
import "@/styles/site/header.css";
import "@/styles/site/product-card.css";
import "@/styles/site/chatbot.css";
import "@/styles/site/reviews.css";

import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { getCategoryTree } from "@/lib/data/categories";
import { localName, t } from "@/lib/i18n";
import { getLang } from "@/lib/lang";
import { LangProvider } from "@/lib/client/lang";
import SiteHeader from "@/components/site/SiteHeader";
import Chatbot from "@/components/site/Chatbot";

export const metadata: Metadata = {
  title: { template: "%s - Sandıq", default: "Sandıq" },
};

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [lang, user, tree] = await Promise.all([getLang(), getCurrentUser(), getCategoryTree()]);
  const menu = tree.map((c) => ({
    id: c.id,
    name: localName(lang, c),
    subcategories: c.subcategories.map((s) => ({ id: s.id, name: localName(lang, s) })),
  }));

  return (
    <LangProvider lang={lang}>
      <SiteHeader userName={user ? user.fullName : null} categories={menu} />

      <main>{children}</main>

      <footer>
        <div className="footer__container">
          <div className="footer__brand">
            <img src="/assets/images/logo.png" alt="Sandıq" />
            <div>
              <h3>Sandıq</h3>
              <p>{t(lang, "footer_tagline")}</p>
            </div>
          </div>

          <div className="footer__links">
            <h4>{t(lang, "footer_quick_links")}</h4>
            <a href="/">{t(lang, "home_page")}</a>
            <a href="/info/about">{t(lang, "about_us")}</a>
            <a href="/info/rules">{t(lang, "site_rules")}</a>
            <a href="/info/contact">{t(lang, "contact")}</a>
          </div>

          <div className="footer__social">
            <h4>{t(lang, "footer_social")}</h4>
            <a href="#" className="footer__social-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="20" rx="5"></rect>
                <circle cx="12" cy="12" r="4"></circle>
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"></circle>
              </svg>
              Instagram
            </a>
          </div>
        </div>

        <div className="footer__bottom">
          <p>
            &copy; {new Date().getFullYear()} Sandıq. <span>{t(lang, "footer_copyright")}</span>
          </p>
        </div>
      </footer>

      <Chatbot />
    </LangProvider>
  );
}
