---
name: admin-panel
description: Admin dashboard architecture — pages, auth, API layer, ports
type: reference
created: 2026-06-29
sources:
  - frontend/app/admin/layout.tsx
  - frontend/app/admin/*/page.tsx
  - frontend/components/admin/AdminShell.tsx
  - frontend/lib/api.ts
  - main.go
tags: [admin, frontend, auth, api]
---

# Admin Panel

## Ports

| Service | Port | Command |
|---|---|---|
| Go backend | 8080 | `go run main.go` (dari repo root) |
| Next.js frontend | 3000 | `cd frontend && npm run dev` |

## Auth

Semua route `/admin/*` di Go backend dilindungi `handler.AuthMiddleware()` — header `Authorization: Bearer <ADMIN_TOKEN>`.

Frontend:
- `frontend/lib/api.ts` → `apiFetch()` otomatis inject token dari `localStorage["admin_token"]`
- Kalau 401, hapus token dan redirect ke `/admin/login`
- Login page: `frontend/app/admin/login/page.tsx`

Token diset dari env var `ADMIN_TOKEN` di `.env` (repo root).

## Pages (Next.js App Router)

| Route | File | Fungsi |
|---|---|---|
| `/admin` | `app/admin/page.tsx` | Dashboard / redirect |
| `/admin/login` | `app/admin/login/page.tsx` | Login form (input ADMIN_TOKEN) |
| `/admin/products` | `app/admin/products/page.tsx` | CRUD produk + varian |
| `/admin/products/[id]` | `app/admin/products/[id]/page.tsx` | Edit detail produk |
| `/admin/categories` | `app/admin/categories/page.tsx` | CRUD kategori |
| `/admin/faqs` | `app/admin/faqs/page.tsx` | CRUD FAQ |
| `/admin/orders` | `app/admin/orders/page.tsx` | Daftar order + update status |
| `/admin/customers` | `app/admin/customers/page.tsx` | Daftar customer |
| `/admin/promotions` | `app/admin/promotions/page.tsx` | CRUD promosi/event |
| `/admin/settings` | `app/admin/settings/page.tsx` | Checkout settings (ongkir, bank, QRIS, dll) |
| `/admin/chat` | `app/admin/chat/page.tsx` | Live chat escalated conversations |

## Layout

`frontend/app/admin/layout.tsx` — kalau path adalah `/admin/login`, render tanpa shell. Selain itu wrap semua dengan `<AdminShell>`.

`AdminShell` (`frontend/components/admin/AdminShell.tsx`) — sidebar + header wrapper.

## API Layer

`frontend/lib/api.ts` exports:
- `apiFetch<T>(path, options)` — semua request ke Go backend, auto-inject Bearer token
- `uploadAdminImage(file)` — POST multipart ke `/admin/upload-image` → Cloudinary
- `getAdminToken()` — baca dari localStorage
- `ADMIN_TOKEN_KEY = "admin_token"` — key localStorage

## UI Theme — Warm Palette

Admin panel pakai warm palette dari user:
| Hex | Penggunaan |
|---|---|
| `#4B1D24` | Sidebar bg, teks utama |
| `#7C2A35` | Primary accent, active nav, button bg |
| `#A56A6C` | Muted text, label, inactive nav |
| `#CBB4A7` | Borders, dividers |
| `#EFE4DC` | Page background |
| `#FDFAF7` | Cards, tables, modals |

Design pattern: **dark wine sidebar + cream content area** — keduanya dari palette yang sama, jadi cohesive.

### CSS Architecture
- `@theme` (tanpa `inline`) di `frontend/app/globals.css` — KRITIS! `@theme inline` bake nilai langsung ke utility class, blokir CSS var cascade. Tanpa `inline`, Tailwind emit `var()` reference sehingga `.admin-theme` override cascade ke semua child komponen.
- `.admin-theme` di `AdminShell.tsx` + login page — override CSS vars:
  ```css
  .admin-theme {
    --color-bg: #EFE4DC; --color-surface: #FDFAF7;
    --color-ink: #4B1D24; --color-border: #CBB4A7;
    --color-accent: #A56A6C; --color-accent-strong: #7C2A35;
  }
  ```
- `AdminSidebar.tsx` pakai **inline styles eksplisit** — sidebar butuh warna berbeda (dark end) dari content area (light end), tidak bisa pakai CSS var yang sama.
- Buttons: `.admin-theme .admin-btn { background: #7C2A35; color: #EFE4DC; }`
- Login page: split layout — left panel `#4B1D24` (dark), right panel `#EFE4DC` (cream)

### Files
- `frontend/app/globals.css` — `@theme` + `.admin-theme` CSS var overrides + button/input overrides
- `frontend/components/admin/AdminShell.tsx` — `admin-theme` class + explicit `background: #EFE4DC`
- `frontend/components/admin/AdminSidebar.tsx` — explicit inline palette styles
- `frontend/components/admin/Modal.tsx` — explicit inline palette styles
- `frontend/app/admin/login/page.tsx` — split dark/light layout

## Go Backend Admin Routes

Semua di group `/admin` dengan `AuthMiddleware`:
- FAQ: GET/POST/PUT/DELETE `/admin/faqs`
- Categories: GET/POST/PUT/DELETE `/admin/categories`
- Products: GET/POST/PUT/DELETE `/admin/products`, variants di `/admin/products/:id/variants` dan `/admin/variants/:variantId`
- Promotions: GET/POST/PUT/DELETE `/admin/promotions`
- Orders: GET `/admin/orders`, PUT `/admin/orders/:id/status`
- Customers: GET `/admin/customers`
- Settings: GET/PUT `/admin/settings`
- Chat: GET `/admin/conversations`, GET `/admin/conversations/:userId/messages`, POST `/admin/conversations/:userId/reply`, POST `/admin/conversations/:userId/resolve`
- Upload: POST `/admin/upload-image`
