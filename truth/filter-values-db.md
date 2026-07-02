---
name: filter-values-db
description: FilterValue model — filter options (warna/gender/kategori/material/ukuran) disimpan di DB dengan 3 bahasa, admin bisa tambah, Groq auto-translate
type: project
created: 2026-07-01
updated: 2026-07-01
sources:
  - be/models/filter_value.go
  - be/handler/admin_filter_values.go
  - be/database/seed_filter_values.go
  - be/groq/client.go
  - fe/app/admin/filter-values/page.tsx
  - fe/app/koleksi/page.tsx
tags: [backend, frontend, filter, localization, groq, admin]
---

## Masalah yang dipecahkan

Filter values (Hitam, Pria, Cotton Combed, dll.) datang dari DB — tidak bisa dimasukkan ke locale.tsx sebagai hardcoded map karena admin bisa tambah nilai baru kapan saja. Solusi: tabel `filter_values` di DB dengan format 3 bahasa per baris.

---

## Model

```go
// be/models/filter_value.go
type FilterValue struct {
    ID    uint   `gorm:"primaryKey" json:"id"`
    Type  string `gorm:"type:varchar(50);not null;index" json:"type"`   // color|gender|category|material|size
    Value string `gorm:"type:varchar(300);not null" json:"value"`       // "English,Indonesian,Mandarin"
}
```

Format `value`: **comma-separated**, index fixed:
- Index 0 → English
- Index 1 → Indonesian (ini yang disimpan di produk, dipakai sebagai filter key)
- Index 2 → Mandarin

Contoh: `"Black,Hitam,黑色"`, `"Male,Pria,男款"`, `"T-Shirt,Kaos,T恤"`

---

## Admin workflow

1. Admin ke `/admin/filter-values`
2. Pilih tipe tab (Warna/Gender/Kategori/Material/Ukuran)
3. Klik Tambah → isi nilai dalam **English** saja
4. Klik Simpan → backend panggil `groq.TranslateFilterValue()` → generate ID+ZH
5. Tersimpan sebagai `"English,Indo,中文"`

---

## Groq translation function

```go
// be/groq/client.go
func TranslateFilterValue(english, filterType string) (id, zh string, err error)
```

Prompt ke LLM: terjemahkan filter value fashion dari English ke Indonesian + Mandarin. Return JSON `{"id":"...","zh":"..."}`. Pakai json_object response_format.

Rule penting di prompt: well-known international terms (Navy, Olive, Charcoal, Fleece, Denim, Polyester, Unisex, dll.) **tetap sama** di Indonesian.

---

## API Routes

```
// Public (no auth)
GET /api/filter-values              → all FilterValue[]

// Admin (Bearer ADMIN_TOKEN)
GET    /admin/filter-values         → list all, ?type=color untuk filter
POST   /admin/filter-values         → body: {type, value_en} → auto-translate → create
PUT    /admin/filter-values/:id     → body: {type, value_en} → re-translate → update
DELETE /admin/filter-values/:id     → delete
```

---

## Seed data

`be/database/seed_filter_values.go` seeds 40 values saat tabel kosong:
- 3 gender (Male/Pria/男款, Female/Wanita/女款, Unisex)
- 15 color (Black/Hitam/黑色, White/Putih/白色, dll. + Navy/Olive/Charcoal/dll. yang sama di ID)
- 4 category (T-Shirt/Kaos/T恤, Hoodie/卫衣, Jacket/Jaket/外套, Pants/Celana/裤子)
- 9 material (Cotton Combed/精梳棉, Fleece/抓绒, dll.)
- 10 size (XS, S, M, L, XL, XXL, 28, 30, 32, 34 — semua sama di 3 bahasa)

Idempotent: cek `COUNT > 0`, skip kalau sudah ada data.

---

## Frontend — FilterSidebar integration

`KoleksiPage` fetch dua endpoint parallel:

```ts
Promise.all([
  fetch(`${API}/api/products`).then(r => r.json()),
  fetch(`${API}/api/filter-values`).then(r => r.json()),
]).then(([products, fvs]) => {
  setProducts(products);
  setFilterValues(fvs);
});
```

`filterValues` di-pass ke `FilterSidebar` sebagai prop.

Helper di `koleksi/page.tsx`:

```ts
const FV_TYPE_FOR_FILTER: Record<string, string> = {
  genders: "gender", colors: "color", categories: "category",
  materials: "material", sizes: "size",
};

function fvLabel(filterValues: FilterValue[], filterKey: string, dbValue: string, locale: Locale): string {
  const type = FV_TYPE_FOR_FILTER[filterKey];
  const match = filterValues.find(fv =>
    fv.type === type && fv.value.split(",")[1]?.trim() === dbValue
  );
  if (!match) return dbValue; // graceful fallback ke raw value
  const parts = match.value.split(",");
  const idx = locale === "en" ? 0 : locale === "id" ? 1 : 2;
  return parts[idx]?.trim() ?? dbValue;
}
```

**Penting:** Filter key yang disimpan di state (`filters.colors = Set(["Hitam"])`) selalu raw DB value (Indonesian). Hanya *display label* yang berubah. Filtering logic tidak berubah.

---

## Hubungan dengan produk

Produk di DB menyimpan nilai dalam **Indonesian**: `colors = "Hitam,Putih,Navy"`, `gender = "Pria"`, dll.

Jadi saat match: cari filter_value di mana `value.split(",")[1] === dbValue`. Index 1 selalu Indonesian.

Kalau admin tambah produk dengan warna baru "Ungu", dia juga perlu tambah filter_value `"Purple,Ungu,紫色"` di halaman Filter Values supaya terjemahannya muncul. Kalau tidak ada, fallback ke "Ungu" di semua bahasa.

---

## Admin page

`fe/app/admin/filter-values/page.tsx`:
- Tab per tipe (Warna/Gender/Kategori/Material/Ukuran)
- Table: 3 kolom (English | Indonesia | 中文) + aksi
- Modal: hanya input type + value_en
- Loading state: "Generating translation..." selama request
- Sidebar entry: "Filter Values" antara Promosi dan Pesanan

---

## Type di frontend

```ts
// fe/lib/types.ts
export type FilterValue = {
  id: number;
  type: string;   // color | gender | category | material | size
  value: string;  // "English,Indonesian,Mandarin"
};
```
