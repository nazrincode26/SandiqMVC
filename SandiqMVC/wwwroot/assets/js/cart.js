const CART_KEY = "cart";

function getCart() {
    const cart = localStorage.getItem(CART_KEY);
    return cart ? JSON.parse(cart) : [];
}

function saveCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
}

function addToCart(product, quantity = 1) {
    const items = getCart();
    const existing = items.find((item) => item.productId === product.id);

    if (existing) {
        existing.quantity += quantity;
    } else {
        items.push({
            productId: product.id,
            title: product.title,
            price: product.price,
            image: product.image,
            quantity,
        });
    }

    saveCart(items);
    return items;
}

function updateQuantity(productId, quantity) {
    const items = getCart().map((item) =>
        item.productId === productId ? { ...item, quantity } : item
    );
    saveCart(items);
    return items;
}

function removeFromCart(productId) {
    const items = getCart().filter((item) => item.productId !== productId);
    saveCart(items);
    return items;
}

function getCartTotal() {
    return getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function getCartCount() {
    return getCart().reduce((sum, item) => sum + item.quantity, 0);
}