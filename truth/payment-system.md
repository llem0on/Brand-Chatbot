---
name: payment-system
description: Payment proof upload system — checkout flow, admin verify, model fields, endpoints
type: project
created: 2026-06-29
sources:
  - models/order.go
  - handler/payment.go
  - handler/admin_purchase.go
  - main.go
  - frontend/app/keranjang/CheckoutModal.tsx
  - frontend/app/pesanan/page.tsx
  - frontend/app/admin/orders/page.tsx
  - cloudinary/client.go
tags: [payment, checkout, upload, admin, cloudinary]
---

# Payment System

## Status
Live. Akan dimodifikasi lagi ke depannya.

## Flow Lengkap

### User Side (Storefront)

**CheckoutModal** (`fe/app/keranjang/CheckoutModal.tsx`):

Phase flow tergantung `biteship_enabled` dari `GET /api/settings/public`:

```
# Biteship aktif:
loading → phone? → address → courier → form → submitting → success/error

# Biteship tidak aktif (legacy):
loading → phone? → form → submitting → success/error
```

`loading` phase muncul sebentar saat settings di-fetch — ini pola untuk handle conditional flow yang ditentukan server. Setelah settings loaded, `setPhase()` dipanggil ke phase yang tepat.

Di phase "form":
1. **Ringkasan order** (items, ongkir dinamis jika kurir dipilih, total)
2. **Chip nomor HP** (bisa diubah → balik ke "phone")
3. **Chip alamat + kurir** (jika Biteship aktif — bisa diubah)
4. **Pilihan metode pembayaran** — Transfer Bank atau QRIS
5. **Instruksi pembayaran** inline (bank details sekarang dikirim dari backend via `GET /api/settings/public`)
6. **Upload bukti pembayaran** — wajib
7. Submit button: **"Pesan & Kirim Bukti · Rpxxx"**

**Pada submit** — dua API call sequential:
```ts
// 1. buat order
POST /api/cart/checkout
body: {
  name, phone,
  address: "<alamat asli atau '-'>",
  postal_code,         // ada jika Biteship aktif
  courier_code,        // ada jika Biteship aktif
  courier_service,     // ada jika Biteship aktif
  courier_name,        // ada jika Biteship aktif
  shipping_cost,       // dari kurir yang dipilih (atau undefined → pakai settings)
  payment_method, email, items[]
}
→ response: { order_number, total_amount, shipping_cost }

// 2. upload bukti ke order yang baru dibuat
POST /api/orders/:orderNumber/payment-proof
body: FormData { proof: File }
→ response: { url: string }
```

**Success screen**: "Bukti dikirim — menunggu verifikasi admin"

**Halaman Pesanan** (`frontend/app/pesanan/page.tsx`):
- Order `menunggu_pembayaran` + `payment_proof_url` set → badge kuning "Menunggu verifikasi admin" + link lihat bukti
- Order `menunggu_pembayaran` + `rejection_reason` set → kotak merah dengan alasan penolakan
- Order `menunggu_pembayaran` tanpa proof → badge "Menunggu pembayaran"
- Upload bukti **sudah tidak ada di halaman ini** — hanya di CheckoutModal

### Admin Side

**Admin Orders Page** (`frontend/app/admin/orders/page.tsx`):
- Tab **"Perlu Verifikasi"** (default) — filter `status=menunggu_pembayaran` AND `payment_proof_url != ""`
- Tab **"Semua Pesanan"**
- Per order dengan bukti: tombol **ACC** + **Tolak**
- Tolak → modal `RejectModal` → input alasan → kirim
- Detail row: preview gambar bukti inline

**Admin Verify Endpoint**:
```
POST /admin/orders/:id/verify-payment
body: { action: "approve" | "reject", reason?: string }

approve → status = "sudah_bayar", rejection_reason = ""
reject  → payment_proof_url = "", rejection_reason = reason, status = "menunggu_pembayaran"
```

## Backend Endpoints

| Method | Path | Auth | Fungsi |
|---|---|---|---|
| `POST` | `/api/orders/:orderNumber/payment-proof` | public | Upload bukti bayar via Cloudinary |
| `POST` | `/admin/orders/:id/verify-payment` | ADMIN_TOKEN | Approve atau reject bukti |

Handler: `handler/payment.go`

### Upload Proof Logic (`UploadPaymentProof`)
- Cari order by `order_number`
- Guard: hanya bisa upload kalau `status == "menunggu_pembayaran"`
- Upload ke Cloudinary folder `"payment_proofs"`
- Update `orders.payment_proof_url`, clear `rejection_reason`

### Verify Payment Logic (`VerifyPayment`)
- Guard: order harus punya `payment_proof_url` (sudah ada bukti)
- `approve`: set `status = "sudah_bayar"`, clear `rejection_reason` — lalu jika `order.courier_code != ""`, otomatis create Biteship shipment (lihat [[biteship-integration]]). Jika Biteship sukses, status langsung → `"dikirim"`
- `reject`: clear `payment_proof_url`, set `rejection_reason`, status tetap `"menunggu_pembayaran"` (user bisa submit ulang)

## Data Model

`models/order.go` — field tambahan dari feature ini:
```go
PaymentProofURL  string `gorm:"type:text" json:"payment_proof_url"`
RejectionReason  string `gorm:"type:text" json:"rejection_reason"`
```

Auto-migrated saat server start.

## Settings yang Dipakai

Dari `GET /api/settings/public` → `models.PurchaseSettings`:
```go
EnableBankTransfer   bool
BankName             string
BankAccountNumber    string
BankAccountHolder    string
EnableQRIS           bool
QRISImageURL         string
ShippingCost         int    // dipakai jika Biteship tidak aktif
BiteshipEnabled      bool   // computed: BITESHIP_API_KEY set + origin_postal_code diisi
```

**Bug yang sudah diperbaiki (2026-07-02)**: sebelumnya `GetPublicCheckoutSettings` hanya return `shipping_cost`, `enable_bank_transfer`, `enable_qris` — bank details tidak dikirim sehingga instruksi transfer tidak muncul di modal. Sekarang semua field termasuk bank details dan `biteship_enabled` di-return.

Frontend type: `PublicSettings` di `fe/app/keranjang/CheckoutModal.tsx`

## Cloudinary

Proof diupload ke folder `"payment_proofs"` via `cloudinary.UploadImage()`.
Butuh `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` di `.env`.

## Status Flow Order

```
menunggu_pembayaran (no proof)
  → user checkout + upload → menunggu_pembayaran + payment_proof_url set
  → admin approve (no Biteship) → sudah_bayar
  → admin approve (+ Biteship)  → dikirim  (biteship_order_id + waybill_id set)
  → admin reject → menunggu_pembayaran + rejection_reason set + proof cleared
  → Biteship webhook "delivered" → selesai
  → Biteship webhook "cancelled" → dibatalkan
```

## Hal yang Mungkin Dimodifikasi

- Re-upload setelah reject (sekarang tidak bisa — butuh alur baru)
- Notifikasi ke user saat ACC/reject (WhatsApp message)
- Deadline pembayaran auto-cancel (`payment_deadline_hours` sudah ada di settings, belum diimplementasi)
- Status tambahan `menunggu_verifikasi` jika ingin bedain dari `menunggu_pembayaran` tanpa proof
