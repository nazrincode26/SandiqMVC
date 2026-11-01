import { az } from "./az";
import { en } from "./en";
import { ru } from "./ru";

export type Lang = "az" | "ru" | "en";

const translations: Record<Lang, Record<string, string>> = { az, ru, en };

export const LANG_COOKIE = "lang";

export function normalizeLang(value: string | null | undefined): Lang {
  return value === "ru" || value === "en" ? value : "az";
}

/** Same lookup order as the original i18n-utils.js `t()`. */
export function t(lang: Lang, key: string): string {
  return translations[lang]?.[key] ?? translations.az[key] ?? key;
}

export interface Named {
  name: string;
  nameRu?: string | null;
  nameEn?: string | null;
}

/**
 * Mirrors the original data-name-{lang} attributes: data-name-ru = NameRu ?? Name,
 * and an empty value falls back to the AZ name.
 */
export function localName(lang: Lang, item: Named): string {
  if (lang === "ru") return (item.nameRu ?? item.name) || item.name;
  if (lang === "en") return (item.nameEn ?? item.name) || item.name;
  return item.name;
}
