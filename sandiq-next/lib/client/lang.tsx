"use client";

import { createContext, useContext, useEffect } from "react";
import { t as translate, LANG_COOKIE, type Lang } from "../i18n";

const LangContext = createContext<Lang>("az");

export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  // The original site kept the language only in localStorage. Copy an older choice
  // into the cookie the server reads, reloading once to render in that language.
  useEffect(() => {
    try {
      const stored = localStorage.getItem("lang");
      if ((stored === "az" || stored === "ru" || stored === "en") && stored !== lang && !document.cookie.includes(`${LANG_COOKIE}=`)) {
        document.cookie = `${LANG_COOKIE}=${stored}; path=/; max-age=31536000; samesite=lax`;
        window.location.reload();
      }
    } catch {}
  }, [lang]);
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export function useLang() {
  const lang = useContext(LangContext);
  return { lang, t: (key: string) => translate(lang, key) };
}

/** i18n-utils.js setLang: remember the choice and reload the page. */
export function setLang(lang: Lang) {
  try {
    localStorage.setItem("lang", lang);
  } catch {}
  document.cookie = `${LANG_COOKIE}=${lang}; path=/; max-age=31536000; samesite=lax`;
  window.location.reload();
}
