document.addEventListener("DOMContentLoaded", () => {
    const menuBtn = document.getElementById("menuBtn");
    const sideMenu = document.getElementById("sideMenu");
    const overlay = document.getElementById("sideMenuOverlay");

    if (menuBtn && sideMenu && overlay) {
        menuBtn.addEventListener("click", () => {
            sideMenu.classList.add("open");
            overlay.classList.add("open");
        });

        overlay.addEventListener("click", () => {
            sideMenu.classList.remove("open");
            overlay.classList.remove("open");
        });
    }

    const catalogBtn = document.getElementById("catalogBtn");
    const megaMenu = document.getElementById("megaMenu");

    if (catalogBtn && megaMenu) {
        catalogBtn.addEventListener("click", () => {
            megaMenu.classList.toggle("open");
        });

        document.addEventListener("click", (e) => {
            if (!megaMenu.contains(e.target) && !catalogBtn.contains(e.target)) {
                megaMenu.classList.remove("open");
            }
        });
    }

    const userMenuBtn = document.getElementById("userMenuBtn");
    const userDropdown = document.getElementById("userDropdown");

    if (userMenuBtn && userDropdown) {
        userMenuBtn.addEventListener("click", () => {
            userDropdown.classList.toggle("open");
        });

        document.addEventListener("click", (e) => {
            if (!userDropdown.contains(e.target) && !userMenuBtn.contains(e.target)) {
                userDropdown.classList.remove("open");
            }
        });
    }

    const langBtn = document.getElementById("langBtn");
    const langDropdown = document.getElementById("langDropdown");

    if (langBtn && langDropdown) {
        langBtn.addEventListener("click", () => {
            langDropdown.classList.toggle("open");
        });

        document.addEventListener("click", (e) => {
            if (!langDropdown.contains(e.target) && !langBtn.contains(e.target)) {
                langDropdown.classList.remove("open");
            }
        });

        document.querySelectorAll(".mega-menu__cat-item").forEach((item) => {
            item.addEventListener("mouseenter", () => {
                const index = item.dataset.index;
                document.querySelectorAll(".mega-menu__cat-item").forEach((el) => el.classList.remove("active"));
                item.classList.add("active");
                document.querySelectorAll(".mega-menu__content-panel").forEach((panel) => {
                    panel.style.display = panel.dataset.index === index ? "block" : "none";
                });
            });
        });
    }
});