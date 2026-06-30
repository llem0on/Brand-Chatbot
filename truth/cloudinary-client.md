---
name: cloudinary-client
description: UploadImage wrapper — signed server-side upload ke Cloudinary, returns HTTPS URL
type: concept
created: 2026-06-29
sources:
  - cloudinary/client.go
tags: [cloudinary, image-upload, storage, signature]
---

# Cloudinary Client

Thin wrapper untuk upload gambar ke Cloudinary via signed server-side request. Satu public function: `UploadImage`.

## `UploadImage(file io.Reader, filename string, folder string) (string, error)`

Mengupload file ke Cloudinary dan mengembalikan HTTPS URL publik gambar tersebut.

**Parameter:**
- `file` — io.Reader dari file yang akan diupload
- `filename` — nama file (dipakai sebagai form field, bukan public_id)
- `folder` — folder di Cloudinary, misal `"products"` atau `"qris"`

**Return:** `secure_url` dari Cloudinary response.

## Signing Flow

Cloudinary API butuh signature untuk server-side upload (bukan unsigned/preset):

```
timestamp = unix timestamp sekarang
params    = "folder=<folder>&timestamp=<timestamp>"  ← harus sorted alphabetically
signature = SHA1(params + CLOUDINARY_API_SECRET)
```

Penting: parameter di-concat **sorted alphabetically by key** sebelum di-hash. Urutan salah → upload ditolak Cloudinary. Lihat `cloudinary/client.go:37`.

## Environment Variables

| Variable | Keterangan |
|----------|------------|
| `CLOUDINARY_CLOUD_NAME` | Cloud name dari dashboard Cloudinary |
| `CLOUDINARY_API_KEY` | API key |
| `CLOUDINARY_API_SECRET` | API secret — dipakai untuk signing, tidak dikirim ke Cloudinary |

Kalau salah satu kosong, `UploadImage` langsung return error tanpa attempt upload.

## Upload Endpoint

```
POST https://api.cloudinary.com/v1_1/<cloud_name>/image/upload
Content-Type: multipart/form-data
Fields: file, api_key, timestamp, folder, signature
```

## Dipakai Di Mana

- `handler/admin_upload.go` — admin upload foto produk atau QRIS image via `/admin/upload`
- Result URL disimpan ke `Product.ImageURL` atau `PurchaseSettings.QRISImageURL`
