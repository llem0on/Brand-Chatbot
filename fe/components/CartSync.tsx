"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { getCart, clearCart, addToCart, type LocalCartItem } from "@/lib/cart";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

type BackendItem = {
  product_variant_id: number;
  product_id: number;
  quantity: number;
  product?: { name: string; price: number; image_url: string; code: string };
  product_variant?: { size: string; color: string; stock: number };
};

async function fetchBackendCart(email: string): Promise<BackendItem[]> {
  try {
    const res = await fetch(`${API}/api/cart?session_id=${encodeURIComponent(email)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.items) ? data.items : [];
  } catch {
    return [];
  }
}

async function pushCartToBackend(email: string, items: LocalCartItem[]) {
  try {
    await fetch(`${API}/api/cart/bulk-sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        items: items.map((i) => ({ product_variant_id: i.variantId, quantity: i.quantity })),
      }),
    });
  } catch {}
}

// Merge backend items into local: items already in local are kept as-is (local wins on qty).
// Backend-only items get added to localStorage.
function mergeBackendIntoLocal(backendItems: BackendItem[]) {
  const localIds = new Set(getCart().map((i) => i.variantId));
  for (const b of backendItems) {
    if (!localIds.has(b.product_variant_id)) {
      addToCart({
        variantId: b.product_variant_id,
        productId: b.product_id,
        quantity: b.quantity,
        name: b.product?.name ?? "",
        code: b.product?.code ?? "",
        price: b.product?.price ?? 0,
        imageUrl: b.product?.image_url ?? "",
        size: b.product_variant?.size ?? "",
        color: b.product_variant?.color ?? "",
        stock: b.product_variant?.stock ?? 0,
      });
    }
  }
}

// Called on login (or first-render while already logged in).
// Merges local cart into backend, then restores merged cart to local.
async function onLogin(email: string) {
  const backendItems = await fetchBackendCart(email);
  mergeBackendIntoLocal(backendItems);          // backend-only items → local
  await pushCartToBackend(email, getCart());    // merged cart → backend
}

// Called on logout: save current session cart to backend, then clear local.
async function onLogout(email: string) {
  await pushCartToBackend(email, getCart());
  clearCart();
}

export default function CartSync() {
  const { data: session } = useSession();
  const prevEmail = useRef<string | null | undefined>(undefined); // undefined = not yet mounted

  useEffect(() => {
    const email = (session?.user?.email as string) ?? null;
    const prev = prevEmail.current;
    prevEmail.current = email;

    if (prev === undefined) {
      // First render after page load.
      // If already logged in (e.g. session survived a page reload or OAuth redirect):
      // treat as a login event so any local cart from the logged-out state gets pushed.
      if (email) onLogin(email);
      return;
    }

    if (!prev && email) {
      // Session just became active (in-page login, e.g. SignIn component in future).
      onLogin(email);
    } else if (prev && !email) {
      // Session just ended — save session cart to backend, clear local.
      onLogout(prev);
    }
  }, [session?.user?.email]);

  return null;
}
