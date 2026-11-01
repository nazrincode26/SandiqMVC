"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/client/lang";

interface Suggestion {
  id: number;
  name: string;
}

/** Header search form with the behaviour of search-suggestions.js. */
export default function SearchSuggestions({ placeholder }: { placeholder: string }) {
  const { lang } = useLang();
  const formRef = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  const hide = () => {
    setItems([]);
    setActiveIndex(-1);
  };

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!formRef.current?.contains(e.target as Node)) hide();
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  async function fetchSuggestions(query: string) {
    try {
      const res = await fetch(`/Category/SearchSuggestions?q=${encodeURIComponent(query)}&lang=${lang}`);
      if (!res.ok) return hide();
      const data = (await res.json()) as Suggestion[];
      setItems(data);
      setActiveIndex(-1);
    } catch {
      hide();
    }
  }

  function onInput(e: React.ChangeEvent<HTMLInputElement>) {
    const query = e.target.value.trim();
    if (timer.current) clearTimeout(timer.current);
    if (query.length < 2) return hide();
    timer.current = setTimeout(() => fetchSuggestions(query), 250);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!items.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      window.location.href = `/Category/Index/${items[activeIndex].id}`;
    } else if (e.key === "Escape") {
      hide();
    }
  }

  return (
    <form id="headerSearchForm" ref={formRef} className="header__search" action="/category/search" method="get" autoComplete="off">
      <input type="text" id="headerSearchInput" name="q" placeholder={placeholder} autoComplete="off" onChange={onInput} onKeyDown={onKeyDown} />
      <button type="submit" aria-label="Axtar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </button>
      <div id="headerSearchSuggestions" className={`header-search-suggestions${items.length ? "" : " hidden"}`}>
        {items.map((item, index) => (
          <a
            key={item.id}
            href={`/Category/Index/${item.id}`}
            className={`header-search-suggestions__item${index === activeIndex ? " active" : ""}`}
            data-index={index}
          >
            {item.name}
          </a>
        ))}
      </div>
    </form>
  );
}
