import { getLang } from "./i18n-utils.js";

const form = document.getElementById("headerSearchForm");
const input = document.getElementById("headerSearchInput");
const box = document.getElementById("headerSearchSuggestions");

if (form && input && box) {
    let debounceTimer = null;
    let currentItems = [];
    let activeIndex = -1;

    function hideBox() {
        box.classList.add("hidden");
        box.innerHTML = "";
        currentItems = [];
        activeIndex = -1;
    }

    function renderBox(items) {
        currentItems = items;
        activeIndex = -1;

        if (!items.length) {
            hideBox();
            return;
        }

        box.innerHTML = items
            .map(
                (item, index) =>
                    `<a href="/Category/Index/${item.id}" class="header-search-suggestions__item" data-index="${index}">${item.name}</a>`
            )
            .join("");
        box.classList.remove("hidden");
    }

    async function fetchSuggestions(query) {
        try {
            const response = await fetch(
                `/Category/SearchSuggestions?q=${encodeURIComponent(query)}&lang=${getLang()}`
            );
            if (!response.ok) {
                hideBox();
                return;
            }
            const data = await response.json();
            renderBox(data);
        } catch {
            hideBox();
        }
    }

    input.addEventListener("input", () => {
        const query = input.value.trim();
        clearTimeout(debounceTimer);

        if (query.length < 2) {
            hideBox();
            return;
        }

        debounceTimer = setTimeout(() => fetchSuggestions(query), 250);
    });

    input.addEventListener("keydown", (e) => {
        if (box.classList.contains("hidden") || !currentItems.length) return;

        const links = Array.from(box.querySelectorAll(".header-search-suggestions__item"));

        if (e.key === "ArrowDown") {
            e.preventDefault();
            activeIndex = Math.min(activeIndex + 1, links.length - 1);
            links.forEach((el, i) => el.classList.toggle("active", i === activeIndex));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            activeIndex = Math.max(activeIndex - 1, 0);
            links.forEach((el, i) => el.classList.toggle("active", i === activeIndex));
        } else if (e.key === "Enter" && activeIndex >= 0) {
            e.preventDefault();
            window.location.href = links[activeIndex].href;
        } else if (e.key === "Escape") {
            hideBox();
        }
    });

    document.addEventListener("click", (e) => {
        if (!form.contains(e.target)) {
            hideBox();
        }
    });
}
