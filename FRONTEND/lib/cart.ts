const CART_KEY = "wb_cart";
const CART_EVENT = "wb-cart-updated";

export type LocalCartItem = {
  variantId: number;
  productId: number;
  quantity: number;
  name: string;
  code: string;
  price: number;
  imageUrl: string;
  size: string;
  color: string;
  stock: number;
};

export function getCart(): LocalCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveCart(items: LocalCartItem[]): void {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(CART_EVENT));
}

export function addToCart(item: LocalCartItem): void {
  const cart = getCart();
  const existing = cart.find((i) => i.variantId === item.variantId);
  if (existing) {
    existing.quantity += item.quantity;
  } else {
    cart.push(item);
  }
  saveCart(cart);
}

export function updateCartQty(variantId: number, quantity: number): void {
  const cart = getCart();
  if (quantity <= 0) {
    saveCart(cart.filter((i) => i.variantId !== variantId));
    return;
  }
  const item = cart.find((i) => i.variantId === variantId);
  if (item) item.quantity = quantity;
  saveCart(cart);
}

export function removeFromCart(variantId: number): void {
  saveCart(getCart().filter((i) => i.variantId !== variantId));
}

export function clearCart(): void {
  localStorage.removeItem(CART_KEY);
  window.dispatchEvent(new Event(CART_EVENT));
}

export function cartCount(): number {
  return getCart().reduce((sum, i) => sum + i.quantity, 0);
}

export function onCartChange(cb: () => void): () => void {
  window.addEventListener(CART_EVENT, cb);
  return () => window.removeEventListener(CART_EVENT, cb);
}
