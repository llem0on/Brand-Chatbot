---
type: gotchas
created: 2026-07-02
sources: [conversation 2026-07-02]
tags: [git, railway, discount, filter-values, deployment, bug-fix]
---

# Gotchas & Bug Fixes — 2026-07-02

## 1. Nested `.git` di BACKEND/ dan FRONTEND/

**Masalah:** Ketika `be/` di-rename jadi `BACKEND/`, folder tersebut punya `.git` sendiri (bukan symlink ke outer repo). Ini karena Claude Code tooling (`.agents/`, `.claude/`) mungkin pernah trigger `git init` di dalam `be/`. Akibatnya:
- `git add BACKEND/` menambahkan sebagai gitlink (submodule pointer), bukan isi file
- Outer repo tidak bisa track konten BACKEND/

**Fix:** Hapus nested `.git` sebelum staging:
```bash
rm -rf BACKEND/.git FRONTEND/.git
git add BACKEND/ FRONTEND/
```

**How to detect:** `git add` memunculkan warning `adding embedded git repository: BACKEND`.

---

## 2. Filter-values 404 setelah push ke Development

**Masalah:** Route `GET /api/filter-values` ada di Backend-dev (di-push langsung ke sana) tapi tidak pernah ada di monorepo Development branch. Ketika Railway pindah ke Development + `/BACKEND`, route hilang.

**File yang perlu ada di BACKEND/ untuk filter-values:**
- `handler/admin_filter_values.go` — CRUD + `GetFilterValues` (public)
- `models/filter_value.go` — struct `FilterValue{ID, Type, Value string}`
- `database/seed_filter_values.go` — seed 40 nilai awal
- `groq/client.go` — fungsi `TranslateFilterValue(english, filterType)` (append, jangan replace)
- `database/db.go` — tambah `&models.FilterValue{}` ke AutoMigrate + panggil `SeedFilterValues()`
- `main.go` — tambah route `GET /api/filter-values` dan admin CRUD routes

**Root cause:** Workflow lama push langsung ke Backend-dev tanpa sync ke Development.

---

## 3. Product `discount_pct` tidak tersimpan

**Masalah:** Admin panel punya input field untuk discount, tapi `models/product.go` tidak punya field `DiscountPct`. Nilai yang dikirim frontend diabaikan GORM.

**Fix:** Tambah ke `BACKEND/models/product.go`:
```go
DiscountPct int `gorm:"default:0" json:"discount_pct"`
```

GORM auto-migrate akan buat kolom `discount_pct` saat server restart. Handler `UpdateProduct` pakai `ShouldBindJSON(&product)` + `Save` jadi langsung bekerja tanpa perubahan handler.

---

## 4. DiscountSidebar tidak muncul meski component ada

**Masalah:** `FRONTEND/app/koleksi/DiscountSidebar.tsx` line 36:
```tsx
if (items.length === 0) return null;
```
Sidebar invisible kalau tidak ada produk dengan `discount_pct > 0`.

**Fix:** Set diskon di admin panel → Products → edit produk → isi Discount %.

---

## 5. Push workflow baru: satu branch untuk semua

**Keputusan:** Mulai 2026-07-02, semua push ke `Development` branch saja. Backend-dev dan Frontend-dev tidak lagi dipakai.

Railway sudah dikonfigurasi:
- Backend: branch `Development`, root `/BACKEND`
- Frontend: branch `Development`, root `/FRONTEND`

**Aturan tambahan:** Selalu minta konfirmasi user sebelum push. Jangan push otomatis.

Lihat [[git-push-workflow]] untuk detail.
