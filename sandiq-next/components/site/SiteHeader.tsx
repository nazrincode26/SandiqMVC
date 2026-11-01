"use client";

import { useEffect, useRef, useState } from "react";
import { setLang, useLang } from "@/lib/client/lang";
import HeaderBadge from "./HeaderBadge";
import SearchSuggestions from "./SearchSuggestions";

export interface MenuCategory {
  id: number;
  name: string;
  subcategories: { id: number; name: string }[];
}

interface Props {
  userName: string | null;
  categories: MenuCategory[];
}

/** Header from Views/Shared/_Layout.cshtml plus the behaviour of sandiq-ui.js. */
export default function SiteHeader({ userName, categories }: Props) {
  const { lang, t } = useLang();
  const [sideOpen, setSideOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [activeCat, setActiveCat] = useState(0);

  const megaRef = useRef<HTMLDivElement>(null);
  const catalogBtnRef = useRef<HTMLButtonElement>(null);
  const userBtnRef = useRef<HTMLButtonElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const langBtnRef = useRef<HTMLButtonElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      if (!megaRef.current?.contains(target) && !catalogBtnRef.current?.contains(target)) setMegaOpen(false);
      if (!userDropdownRef.current?.contains(target) && !userBtnRef.current?.contains(target)) setUserOpen(false);
      if (!langDropdownRef.current?.contains(target) && !langBtnRef.current?.contains(target)) setLangOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  return (
    <header>
      <div className="header__container">
        <button id="menuBtn" className="menu-btn" aria-label="Menyu" onClick={() => setSideOpen(true)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div className="lang-selector">
          <button id="langBtn" ref={langBtnRef} className="lang-btn" type="button" onClick={() => setLangOpen((v) => !v)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="2" y1="12" x2="22" y2="12"></line>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
            </svg>
            <span id="currentLangLabel">{lang.toUpperCase()}</span>
          </button>
          <div id="langDropdown" ref={langDropdownRef} className={`lang-dropdown${langOpen ? " open" : ""}`}>
            <button className="lang-option" type="button" onClick={() => setLang("az")}>Azərbaycan dili</button>
            <button className="lang-option" type="button" onClick={() => setLang("ru")}>Русский</button>
            <button className="lang-option" type="button" onClick={() => setLang("en")}>English</button>
          </div>
        </div>
        <a href="/" className="header__logo">
          <img src="/assets/images/logo.png" alt="Sandıq" />
        </a>

        <button id="catalogBtn" ref={catalogBtnRef} className="catalog-btn" type="button" onClick={() => setMegaOpen((v) => !v)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="3" y="3" width="7" height="7" rx="1"></rect>
            <rect x="14" y="3" width="7" height="7" rx="1"></rect>
            <rect x="3" y="14" width="7" height="7" rx="1"></rect>
            <rect x="14" y="14" width="7" height="7" rx="1"></rect>
          </svg>
          <span>{t("catalog")}</span>
        </button>

        <SearchSuggestions placeholder={t("search_placeholder")} />

        <nav className="header__nav">
          <div className="header__nav-icons">
            <a href="/Favorites" className="header__icon-link">
              ♥ <HeaderBadge kind="favorites" />
            </a>
            <a href="/Cart" className="header__icon-link">
              🛒 <HeaderBadge kind="cart" />
            </a>
          </div>
          <div className="header__nav-actions">
            {userName !== null ? (
              <div className="header__user-menu">
                <button id="userMenuBtn" ref={userBtnRef} className="header__user-btn" type="button" onClick={() => setUserOpen((v) => !v)}>
                  {userName}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                <div id="userDropdown" ref={userDropdownRef} className={`user-dropdown${userOpen ? " open" : ""}`}>
                  <a href="/listings/mylistings" className="user-dropdown__item">{t("my_listings")}</a>
                  <a href="/cart/myorders" className="user-dropdown__item">Sifarişlərim</a>
                  <a href="/account/settings" className="user-dropdown__item">{t("settings")}</a>
                  <div className="user-dropdown__divider"></div>
                  <a href="/account/logout" className="user-dropdown__item user-dropdown__item--danger">{t("logout")}</a>
                </div>
              </div>
            ) : (
              <>
                <a href="/account/login">{t("login")}</a>
                <a href="/account/register">{t("register")}</a>
              </>
            )}
            <a href="/listings/create" className="post-ad-btn post-ad-btn--filled">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              <span>{t("post_ad")}</span>
            </a>
          </div>
        </nav>
      </div>

      <div id="megaMenu" ref={megaRef} className={`mega-menu${megaOpen ? " open" : ""}`}>
        <div className="mega-menu__categories">
          {categories.map((c, i) => (
            <div
              key={c.id}
              className={`mega-menu__cat-item${i === activeCat ? " active" : ""}`}
              data-index={i}
              onMouseEnter={() => setActiveCat(i)}
            >
              <span>{c.name}</span>
              <span className="side-menu__arrow">›</span>
            </div>
          ))}
        </div>
        <div className="mega-menu__content">
          {categories.map((c, i) => (
            <div key={c.id} className="mega-menu__content-panel" data-index={i} style={i === activeCat ? undefined : { display: "none" }}>
              {c.subcategories.length > 0 ? (
                <>
                  <h3>{c.name}</h3>
                  <div className="mega-menu__subgrid">
                    {c.subcategories.map((sub) => (
                      <a key={sub.id} href={`/Category/Index/${sub.id}`}>{sub.name}</a>
                    ))}
                  </div>
                </>
              ) : (
                <p>{t("no_subcategories")}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div id="sideMenuOverlay" className={`side-menu-overlay${sideOpen ? " open" : ""}`} onClick={() => setSideOpen(false)}></div>
      <aside id="sideMenu" className={`side-menu${sideOpen ? " open" : ""}`}>
        <a href="/" className="side-menu__item">{t("home_page")}</a>

        <div className="side-menu__item side-menu__item--has-submenu">
          <span>{t("legal_info")}</span>
          <span className="side-menu__arrow">›</span>
          <div className="side-menu__submenu">
            <a href="/info/legal#user-agreement">{t("legal_agreement_title")}</a>
            <a href="/info/legal#privacy-policy">{t("legal_privacy_title")}</a>
            <a href="/info/legal#offer-agreement">{t("legal_offer_title")}</a>
            <a href="/info/legal#ad-posting-terms">{t("legal_adterms_title")}</a>
          </div>
        </div>

        <div className="side-menu__item side-menu__item--has-submenu">
          <span>{t("site_rules")}</span>
          <span className="side-menu__arrow">›</span>
          <div className="side-menu__submenu">
            <a href="/info/rules#safe-trade">{t("rules_safety_title")}</a>
            <a href="/info/rules#how-to-sell">{t("rules_howto_title")}</a>
            <a href="/info/rules#promotion-rules">{t("rules_promo_title")}</a>
          </div>
        </div>

        <a href="/info/about" className="side-menu__item">{t("about_us")}</a>
        <a href="/info/contact" className="side-menu__item">{t("contact")}</a>

        <div className="side-menu__divider"></div>

        <div className="side-menu__social">
          <a href="#" className="side-menu__social-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="2" width="20" height="20" rx="5"></rect>
              <circle cx="12" cy="12" r="4"></circle>
              <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"></circle>
            </svg>
            Instagram
          </a>
        </div>

        {userName === null && (
          <>
            <a href="/account/login" className="side-menu__item">{t("login")}</a>
            <a href="/account/register" className="side-menu__item">{t("register")}</a>
          </>
        )}
      </aside>
    </header>
  );
}
