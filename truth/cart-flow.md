---
name: cart-flow
description: Cart disimpan di localStorage (bukan DB) — utility lib/cart.ts, CartModal, halaman keranjang, badge Navbar, checkout via body
type: architecture
created: 2026-06-29
updated: 2026-06-29
sources:
  - frontend/lib/cart.ts
  - frontend/app/koleksi/CartModal.tsx
  - frontend/app/keranjang/page.tsx
  - frontend/components/Navbar.tsx
  - handler/cart.go
tags: [cart, localStorage, frontend, checkout]
---

# Cart Flow

## Storage: localStorage (bukan DB)

Cart **disimpan di browser** via `localStorage` key `wb_cart` — JSON array of `LocalCartItem`.  
DB tidak disentuh untuk operasi cart. DB hanya disentuh sekali saat **checkout**.

Utility: `frontend/lib/cart.ts`
- `addToCart(item)` — tambah atau increment qty kalau variantId sudah ada
- `updateCartQty(variantId, qty)` — update atau hapus kalau qty ≤ 0
- `removeFromCart(variantId)` — hapus satu item
- `clearCart()` — kosongkan semua
- `cartCount()` — total qty semua item
- `onCartChange(cb)` — subscribe event `wb-cart-updated` (auto-fire tiap perubahan)

## LocalCartItem Shape

```ts
type LocalCartItem = {
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
```

## Frontend Files

| File | Peran |
|---|---|
| `frontend/lib/cart.ts` | Utility localStorage — semua cart logic ada di sini |
| `frontend/app/koleksi/CartModal.tsx` | Modal BELI — tulis ke localStorage via `addToCart`, sync, no API call |
| `frontend/app/keranjang/page.tsx` | Halaman cart — baca `getCart()`, update/hapus langsung di localStorage |
| `frontend/components/Navbar.tsx` | Badge count di ikon keranjang, reactive via `onCartChange` |

## API Endpoints (main.go)

```
GET    /api/cart               — legacy, masih ada tapi tidak dipakai frontend
POST   /api/cart/items         — legacy, masih ada tapi tidak dipakai frontend
PUT    /api/cart/items/:id     — legacy
DELETE /api/cart/items/:id     — legacy
POST   /api/cart/checkout      — AKTIF — terima items dari body
```

## Checkout Flow

`POST /api/cart/checkout` body:
```json
{
  "name": "...",
  "phone": "...",
  "address": "...",
  "payment_method": "...",
  "items": [
    { "product_variant_id": 1, "quantity": 2 }
  ]
}
```
- Butuh login + email verified
- Backend resolve variant → validasi stock → create Order
- Frontend clear localStorage setelah sukses (`clearCart()`)
