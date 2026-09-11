function updateHeaderBadges() {
    const cartBadge = document.getElementById("cartBadge");
    const favBadge = document.getElementById("favBadge");
    if (cartBadge) cartBadge.textContent = getCartCount();
    if (favBadge) favBadge.textContent = getFavorites().length;
}

document.addEventListener("click", (e) => {
    const cartBtn = e.target.closest(".js-cart-btn");
    if (cartBtn) {
        const card = cartBtn.closest("[data-id]");
        addToCart({
            id: Number(card.dataset.id),
            title: card.dataset.title,
            price: Number(card.dataset.price),
            image: card.dataset.image || null,
        });
        updateHeaderBadges();
        showToast("Məhsul səbətə əlavə olundu");
        return;
    }

    const favBtn = e.target.closest(".js-favorite-btn");
    if (favBtn) {
        const card = favBtn.closest("[data-id]");
        toggleFavorite({
            id: Number(card.dataset.id),
            title: card.dataset.title,
            price: Number(card.dataset.price),
            image: card.dataset.image || null,
        });
        favBtn.classList.toggle("active");
        updateHeaderBadges();
    }
});

document.addEventListener("DOMContentLoaded", updateHeaderBadges);