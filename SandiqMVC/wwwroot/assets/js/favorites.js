const FAVORITES_KEY = "favorites";

function getFavorites() {
    const favorites = localStorage.getItem(FAVORITES_KEY);
    return favorites ? JSON.parse(favorites) : [];
}

function saveFavorites(items) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(items));
}

function addToFavorites(product) {
    const items = getFavorites();
    const exists = items.some((item) => item.productId === product.id);

    if (!exists) {
        items.push({
            productId: product.id,
            title: product.title,
            price: product.price,
            image: product.image,
        });
        saveFavorites(items);
    }

    return items;
}

function removeFromFavorites(productId) {
    const items = getFavorites().filter((item) => item.productId !== productId);
    saveFavorites(items);
    return items;
}

function isFavorite(productId) {
    return getFavorites().some((item) => item.productId === productId);
}

function toggleFavorite(product) {
    return isFavorite(product.id)
        ? removeFromFavorites(product.id)
        : addToFavorites(product);
}