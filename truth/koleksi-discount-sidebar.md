---
name: koleksi-discount-sidebar
description: Arsitektur, logic, dan theme DiscountSidebar di halaman /koleksi — auto-scroll, hover pause, discount dari DB (field discount_pct), layout CSS
type: project
created: 2026-07-01
updated: 2026-07-01
sources:
  - fe/app/koleksi/DiscountSidebar.tsx
  - fe/app/koleksi/page.tsx
  - fe/app/globals.css
  - be/models/product.go
tags: [frontend, koleksi, discount, animation, css]
---

## Letak & Layout

`DiscountSidebar` adalah panel kanan di halaman `/koleksi`, ada di dalam `<main>` yang flex-row:

```
<main flexDirection="row">
  <div flex-1>          ← filter sidebar + product grid
  <DiscountSidebar />   ← 300px, flexShrink: 0
</main>
```

Width: **300px**, border: top/left/bottom `0.5px solid var(--color-border)`.  
Background: `color-mix(in srgb, var(--color-surface) 55%, transparent)` + `backdropFilter: blur(12px)` — translucent frosted glass effect.

---

## Auto-scroll Logic

Produk list **tidak pakai `overflow-y: auto`** — melainkan CSS keyframe animation `tickV`:

```css
@keyframes tickV {
  from { transform: translateY(0); }
  to   { transform: translateY(-50%); }
}
```

Isi list **diduplikat** (`loopItems = [...items, ...items]`) supaya loop seamless — ketika konten scroll -50% (satu set items habis), animasi restart dari 0 dan kelihatan sama.

**Pause on hover** via React state:
```tsx
const [paused, setPaused] = useState(false);
// container onMouseEnter → setPaused(true), onMouseLeave → setPaused(false)
// inner div: animationPlayState: paused ? "paused" : "running"
```

Durasi: `44s linear infinite`.

---

## Discount Logic (dari DB)

`discount_pct` adalah field nyata di model `Product` (`be/models/product.go`):

```go
DiscountPct int `gorm:"default:0" json:"discount_pct"`
```

Di frontend (`fe/lib/types.ts`): `discount_pct?: number`

**DiscountSidebar** hanya menampilkan produk yang `discount_pct > 0`:

```ts
const items = products.filter((p) => (p.discount_pct ?? 0) > 0);
if (items.length === 0) return null; // sidebar menyembunyikan diri kalau tidak ada diskon
```

Perhitungan harga:
```ts
const pct = p.discount_pct!;
const salePrice = Math.round(p.price * (1 - pct / 100));
```

**Admin** bisa edit `discount_pct` per produk di halaman `/admin/products` (form field "Diskon %", min 0 max 99). Badge `-XX%` merah muncul di tabel kalau > 0.

**Seed**: `be/database/seed_filter_values.go` menyeed diskon untuk 12 produk tertentu by code (e.g. `"KS-001": 20`, `"HD-001": 30`). Idempotent: hanya update kalau `discount_pct = 0`.

---

## Card Layout per Item

Grid: `gridTemplateColumns: "82px 1fr"` + `position: relative` untuk ghost %.

```
[foto 82×112] [info: kategori, nama, harga final, harga coret]
              [ghost % — position:absolute, right:5, top:50%]
```

- **Foto**: `82×112px`, background `#ECE5DC` (always light cream), border `var(--color-border)`
- **Nama**: Fraunces 15px, truncate ellipsis
- **Harga final**: 20px bold, warna `accent`
- **Harga coret**: 10px, `var(--color-muted)`, `textDecoration: line-through`, align left
- **Ghost %**: `position: absolute; right: 5px`, `writingMode: vertical-rl`, Fraunces 42px, `color: transparent`, `WebkitTextStroke: 1px accent`, `letterSpacing: 0.04em`

---

## Hover Effects (CSS di globals.css)

```css
@keyframes pl { /* pulsing dot */ }
.sale-pulse::after { /* animated ring around dot */ }
.sale-item::before { /* left accent bar 2px, scaleY on hover */ }
.sale-item:hover { background: color-mix(in srgb, var(--color-ink) 5%, transparent); }
.sale-ghost { opacity: .28; transition: opacity .3s; }
.sale-item:hover .sale-ghost { opacity: .65; }
.sale-thumb img { transition: transform .6s; }
.sale-item:hover .sale-thumb img { transform: scale(1.08); }
```

Semua class ini di `globals.css` **di luar `@layer`** supaya tidak tertimpa Tailwind.

---

## Theme

Accent color via `useTheme()`:
- Light: `#321318`
- Dark: `#D9B88A`

Foto thumbnail selalu pakai `background: #ECE5DC` (warm cream) — tidak ikut theme — karena foto produk punya background terang.

---

## Gotcha: CSS Animation di Komponen

`animation` dan `animationPlayState` harus pakai **inline style** langsung di elemen React, bukan CSS class, karena:
- CSS class di `<style>` tag dalam komponen tidak reliable di Next.js App Router
- CSS class di `@layer utilities` kadang tidak override browser default

Keyframe `tickV` dan `tickRight` didefinisikan di `globals.css` (luar layer), dan direferensikan via inline style string `"tickV 44s linear infinite"`.

---

## File Terkait

- `fe/app/koleksi/DiscountSidebar.tsx` — komponen utama
- `fe/app/koleksi/page.tsx` — pass `products={products}` ke sidebar, layout main flex-row
- `fe/app/globals.css` — keyframes `tickV`, `tickRight`, `pl`; classes `.sale-*`
- `[[koleksi-page-layout]]` — halaman koleksi keseluruhan (filter + grid + sidebar)
