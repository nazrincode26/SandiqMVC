"use client";

import { useMemo, useSyncExternalStore } from "react";

// Ports of wwwroot/assets/js/cart.js, favorites.js, format-price.js and toast.js.
// Same localStorage keys and item shapes as the original site.

export interface StoreProduct {
  id: number;
  title: string;
  price: number;
  image: string | null;
}

export interface CartItem {
  productId: number;
  title: string;
  price: number;
  image: string | null;
  quantity: number;
}

export interface FavoriteItem {
  productId: number;
  title: string;
  price: number;
  image: string | null;
}

const CART_KEY = "cart";
const FAVORITES_KEY = "favorites";
export const STORE_EVENT = "sandiq:store-changed";

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, items: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch {
    // Storage unavailable (private mode); the original site failed the same way.
  }
  window.dispatchEvent(new Event(STORE_EVENT));
}

export const getCart = () => read<CartItem>(CART_KEY);

export function addToCart(product: StoreProduct, quantity = 1) {
  const items = getCart();
  const existing = items.find((item) => item.productId === product.id);
  if (existing) existing.quantity += quantity;
  else items.push({ productId: product.id, title: product.title, price: product.price, image: product.image, quantity });
  write(CART_KEY, items);
  return items;
}

export function updateQuantity(productId: number, quantity: number) {
  const items = getCart().map((item) => (item.productId === productId ? { ...item, quantity } : item));
  write(CART_KEY, items);
  return items;
}

export function removeFromCart(productId: number) {
  const items = getCart().filter((item) => item.productId !== productId);
  write(CART_KEY, items);
  return items;
}

export function clearCart() {
  try {
    localStorage.removeItem(CART_KEY);
  } catch {}
  window.dispatchEvent(new Event(STORE_EVENT));
}

export const getCartTotal = () => getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
export const getCartCount = () => getCart().reduce((sum, item) => sum + item.quantity, 0);

export const getFavorites = () => read<FavoriteItem>(FAVORITES_KEY);

export function addToFavorites(product: StoreProduct) {
  const items = getFavorites();
  if (!items.some((item) => item.productId === product.id)) {
    items.push({ productId: product.id, title: product.title, price: product.price, image: product.image });
    write(FAVORITES_KEY, items);
  }
  return items;
}

export function removeFromFavorites(productId: number) {
  const items = getFavorites().filter((item) => item.productId !== productId);
  write(FAVORITES_KEY, items);
  return items;
}

export const isFavorite = (productId: number) => getFavorites().some((item) => item.productId === productId);

export function toggleFavorite(product: StoreProduct) {
  return isFavorite(product.id) ? removeFromFavorites(product.id) : addToFavorites(product);
}

/** format-price.js */
export function formatPrice(price: number) {
  return `${price.toLocaleString("az-AZ")} ₼`;
}

function subscribe(callback: () => void) {
  window.addEventListener(STORE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(STORE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function rawSnapshot(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Live view of a stored list. Returns null during server render / before hydration. */
function useStored<T>(key: string): T[] | null {
  const raw = useSyncExternalStore(subscribe, () => rawSnapshot(key) ?? "[]", () => null);
  return useMemo(() => {
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T[];
    } catch {
      return [];
    }
  }, [raw]);
}

export const useCartItems = () => useStored<CartItem>(CART_KEY);
export const useFavoriteItems = () => useStored<FavoriteItem>(FAVORITES_KEY);

let toastContainer: HTMLDivElement | null = null;

/** toast.js */
export function showToast(message: string, type: "success" | "error" = "success") {
  if (!toastContainer || !document.body.contains(toastContainer)) {
    toastContainer = document.createElement("div");
    toastContainer.className = "toast-container";
    document.body.appendChild(toastContainer);
  }
  const el = document.createElement("div");
  el.className = `toast toast--${type}`;
  el.textContent = message;
  toastContainer.appendChild(el);
  requestAnimationFrame(() => el.classList.add("toast--visible"));
  setTimeout(() => {
    el.classList.remove("toast--visible");
    el.addEventListener("transitionend", () => el.remove(), { once: true });
  }, 2500);
}
