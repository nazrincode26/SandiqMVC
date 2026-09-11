import { az } from "./i18n/az.js";
import { ru } from "./i18n/ru.js";
import { en } from "./i18n/en.js";

const translations = { az, ru, en };

export function getLang() {
  return localStorage.getItem("lang") || "az";
}

export function setLang(lang) {
  localStorage.setItem("lang", lang);
  window.location.reload();
}

export function t(key) {
  const lang = getLang();
  return translations[lang]?.[key] ?? translations.az[key] ?? key;
}

export function applyTranslations(root = document) {
  root.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
  });
  applyCategoryNames(root);
}

export function applyCategoryNames(root = document) {
  const lang = getLang();
  root.querySelectorAll("[data-name-az]").forEach((el) => {
    const value = el.getAttribute(`data-name-${lang}`) || el.getAttribute("data-name-az");
    if (value) el.textContent = value;
  });
}

export function getCategoryName(category) {
  const lang = getLang();
  if (lang === "ru" && category.nameRu) return category.nameRu;
  if (lang === "en" && category.nameEn) return category.nameEn;
  return category.name;
}

export function sortProductGrids(root = document) {
  const lang = getLang();
  const collator = new Intl.Collator(lang, { sensitivity: "base" });
  root.querySelectorAll('.product-grid[data-sort-mode="alpha"]').forEach((grid) => {
    const cards = Array.from(grid.children).filter((el) => el.classList.contains("product-card"));
    cards.sort((a, b) => collator.compare(a.dataset.title || "", b.dataset.title || ""));
    cards.forEach((card) => grid.appendChild(card));
  });
}