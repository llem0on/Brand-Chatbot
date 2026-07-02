---
name: biteship-integration
description: Integrasi Biteship untuk ongkir dinamis, create shipment otomatis saat payment approved, dan webhook tracking status
type: architecture
created: 2026-07-02
updated: 2026-07-02
sources:
  - be/biteship/client.go
  - be/handler/shipping.go
  - be/handler/biteship_webhook.go
  - be/handler/payment.go
  - be/models/order.go
  - be/models/purchase_settings.go
  - fe/app/keranjang/CheckoutModal.tsx
tags: [biteship, shipping, webhook, checkout, logistics]
---

# Biteship Integration

## Overview

Biteship adalah 3rd-party logistics aggregator (JNE, SiCepat, J&T, Anteraja, dll) yang diintegrasikan via REST API + webhook.

### Mode Aktif
Biteship aktif jika **dua syarat** terpenuhi:
1. `BITESHIP_API_KEY` di-set di env backend
2. `origin_postal_code` diisi di admin settings

Cek di `GET /api/settings/public` → field `biteship_enabled: bool`

## Env Variables

Set di `be/.env` dan di Railway Variables:
```
BITESHIP_API_KEY=your_api_key_here          # dari Biteship dashboard → API Key
BITESHIP_WEBHOOK_SECRET=your_secret_here    # bebas — harus sama persis dengan isian di Biteship dashboard
```

`BITESHIP_WEBHOOK_HEADER` opsional — default `X-Webhook-Secret` jika tidak di-set. Alamat asal dikonfigurasi via admin settings (bukan env).

## Webhook Setup di Biteship Dashboard

URL webhook (production): `https://carin.up.railway.app/webhook/biteship`

Event yang di-subscribe: `order.status`, `order.waybill_id`, `order.price`

Headers (wajib diisi untuk keamanan):
- **Headers Signature Key**: `X-Webhook-Secret`
- **Headers Signature Secret**: nilai yang sama dengan `BITESHIP_WEBHOOK_SECRET` di env

**Penting**: Webhook hanya bisa ditest di URL publik — localhost tidak bisa diakses Biteship. Pakai ngrok untuk testing lokal (`ngrok http 8080` → dapat URL sementara).

## Admin Configuration (`/admin/settings`)

Field baru di **PurchaseSettings** (auto-migrated saat startup):
| Field | Default | Keterangan |
|---|---|---|
| `origin_postal_code` | "" | Kode pos gudang/toko — WAJIB diisi untuk aktifkan Biteship |
| `origin_address` | "" | Alamat lengkap pengirim |
| `origin_contact_name` | "" | Nama kontak pengirim |
| `origin_contact_phone` | "" | HP kontak pengirim |
| `default_item_weight_gram` | 300 | Berat default per item (semua produk diasumsikan sama) |
| `biteship_couriers` | "jne,sicepat,j&t,anteraja" | Kurir yang ditampilkan di rate API |

## Checkout Flow (Frontend)

Ketika `biteship_enabled = true`, CheckoutModal menambahkan 2 phase baru:

```
loading → phone? → address → courier → form → submitting → success/error
```

- **address** — user isi alamat lengkap + kode pos 5 digit
- **courier** — fetch `POST /api/shipping/rates`, tampilkan daftar kurir + harga + ETA
- User pilih kurir → masuk ke **form** (payment + proof upload)

Saat submit checkout, body mengirim:
```json
{
  "address": "...",
  "postal_code": "12345",
  "courier_code": "jne",
  "courier_service": "REG",
  "courier_name": "JNE Reguler",
  "shipping_cost": 15000,
  ...
}
```

## API Endpoints Baru

### `POST /api/shipping/rates`
Public endpoint. Proxy ke Biteship rate API.
```json
Request: { "postal_code": "12345", "items": [{"variant_id": 1, "quantity": 2}] }
Response: { "pricing": [{
  "company_name": "JNE",
  "courier_name": "JNE Reguler",
  "courier_code": "jne",
  "courier_service_code": "REG",
  "price": 15000,
  "duration": "2-3 days"
}]}
```

### `POST /webhook/biteship`
Menerima status update dari Biteship. Production URL: `https://carin.up.railway.app/webhook/biteship`

Biteship status → Order status mapping:
- `delivered` → `selesai`
- `cancelled` / `rejected` → `dibatalkan`
- `confirmed`, `allocated`, `picking_up`, `picked`, `dropping_off` → `dikirim`

Field `shipping_status` di Order selalu diupdate dengan Biteship status mentah.

## Auto-Create Shipment (Payment Approval)

Saat admin `approve` payment (`POST /admin/orders/:id/verify-payment`):
1. Jika `order.courier_code != ""` → panggil `submitBiteshipOrder()`
2. Sukses → `biteship_order_id` + `waybill_id` tersimpan di Order, status → `dikirim`
3. Gagal → hanya log error, status tetap `sudah_bayar` (non-blocking)

## Order Model Fields Baru

```go
PostalCode      string  // kode pos customer
CourierCode     string  // "jne", "sicepat", dll
CourierService  string  // service code, e.g. "REG"
CourierName     string  // display name, e.g. "JNE Reguler"
BiteshipOrderID string  // dari response Biteship create order
WaybillID       string  // nomor resi (diisi via webhook atau create order)
ShippingStatus  string  // Biteship status mentah (picked_up, delivered, dll)
```

## File Map

| File | Peran |
|---|---|
| `be/biteship/client.go` | HTTP client — `GetRates()` + `CreateOrder()` |
| `be/handler/shipping.go` | `GET /api/shipping/rates` handler |
| `be/handler/biteship_webhook.go` | Webhook receiver |
| `be/handler/payment.go` | `submitBiteshipOrder()` helper, dipanggil saat approve |
| `be/models/order.go` | Tambahan 7 shipping fields |
| `be/models/purchase_settings.go` | Tambahan 6 Biteship config fields |
| `fe/app/keranjang/CheckoutModal.tsx` | Phase baru: address, courier |
| `fe/app/admin/settings/page.tsx` | UI config Biteship asal |

## Backward Compatibility

- Order lama (tanpa `courier_code`) tidak terpengaruh — `submitBiteshipOrder` no-op jika `CourierCode == ""`
- Jika `BITESHIP_API_KEY` tidak di-set, `biteship_enabled = false` → checkout flow lama (ongkir dari settings)
- `shipping_cost` di checkout request bersifat opsional (nil = pakai settings default)
