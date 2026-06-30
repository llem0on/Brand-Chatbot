---
name: otp-phone-verification
description: OTP phone verification plan — on hold, waiting for secondary WhatsApp number
type: project
created: 2026-06-29
sources:
  - frontend/app/keranjang/CheckoutModal.tsx
  - handler/cart.go
tags: [otp, checkout, phone, whatsapp, on-hold]
---

# OTP Phone Verification

**Status: ON HOLD** — user belum beli nomor HP cadangan untuk kirim OTP.

## Konteks

Checkout flow sudah ada step wajib isi nomor HP (`phase === "phone"` di CheckoutModal). OTP adalah step lanjutan setelah nomor di-input — user harus konfirmasi nomornya valid sebelum lanjut ke ringkasan order.

## Arsitektur yang Sudah Siap (Frontend)

File: `frontend/app/keranjang/CheckoutModal.tsx`

```
Phase: "phone" → [OTP sub-step di sini] → "form" → "submitting" → "success"
```

Titik injeksi OTP ada di `handlePhoneContinue()` (sekitar baris 74):
```ts
function handlePhoneContinue() {
  if (!isValidPhone(phoneInput)) { ... return; }
  const trimmed = phoneInput.trim();
  // TODO OTP: kirim OTP ke trimmed, ganti setPhase("form") jadi setPhase("otp")
  localStorage.setItem(PHONE_KEY, trimmed);
  setPhone(trimmed);
  setErrorMsg("");
  setPhase("form"); // ← ganti jadi "otp" kalau OTP aktif
}
```

State yang perlu ditambah saat OTP diaktifkan:
- `useState<Phase>` — tambah `"otp"` ke union type
- `const [otpCode, setOtpCode] = useState("")`
- `const [otpSending, setOtpSending] = useState(false)`

## Backend yang Perlu Dibuat

### 1. `POST /auth/send-otp`
```go
// Body: { phone: "08xxxxxxxx" }
// Action: generate 6-digit OTP, simpan di Redis/DB dengan TTL 5 menit, kirim via WhatsApp
// Response: { ok: true }
```

### 2. `POST /auth/verify-otp`
```go
// Body: { phone: "08xxxxxxxx", code: "123456" }
// Action: cek OTP di DB, hapus setelah berhasil
// Response: { ok: true } atau 400 { error: "Kode salah atau kedaluwarsa" }
```

### Penyimpanan OTP
Opsi A: **In-memory map** di Go (simple, lost on restart) — cukup untuk MVP
Opsi B: **DB table** `otp_codes (phone, code, expires_at)` — lebih robust
Opsi C: **Redis** — ideal tapi butuh infra tambahan

### Pengiriman OTP
Via WhatsApp Cloud API (sudah terintegrasi di `whatsapp/` package):
- Kirim pesan teks ke nomor user: "Kode verifikasi kamu: 123456. Berlaku 5 menit."
- Butuh `PHONE_NUMBER_ID` dan `ACCESS_TOKEN` di `.env` (sudah ada untuk webhook)
- **Ini alasan user perlu nomor HP cadangan** — nomor WhatsApp Business yang dipakai untuk kirim OTP harus berbeda dari nomor pribadi

## UI yang Perlu Ditambah

Tambah phase baru `"otp"` di antara `"phone"` dan `"form"`:

```tsx
{phase === "otp" && (
  <div className="px-6 py-10 flex flex-col gap-6">
    <div>Kode dikirim ke {phoneInput}</div>
    <input value={otpCode} onChange={...} placeholder="6 digit kode" maxLength={6} />
    {errorMsg && <div style={{ color: "red" }}>{errorMsg}</div>}
    <button onClick={handleVerifyOtp}>Verifikasi</button>
    <button onClick={() => setPhase("phone")}>Ganti nomor</button>
  </div>
)}
```

## Yang Sudah Jalan Tanpa OTP

- Step phone sudah muncul pertama kali kalau belum ada nomor tersimpan
- Nomor disimpan ke `localStorage["wb_last_phone"]`
- Validasi format sudah ada: `/^(\+62|62|0)[0-9]{8,13}$/`
- Checkout kirim nomor real ke backend (bukan dummy lagi)
- Tombol "Ubah" di ringkasan untuk ganti nomor

## Checklist Aktivasi OTP

- [ ] Beli nomor HP / WhatsApp Business cadangan
- [ ] Daftarkan nomor ke WhatsApp Cloud API
- [ ] Buat tabel/storage OTP di backend
- [ ] Implement `POST /auth/send-otp` dan `POST /auth/verify-otp`
- [ ] Ubah `handlePhoneContinue` → trigger send OTP, ganti `setPhase("form")` jadi `setPhase("otp")`
- [ ] Tambah UI phase `"otp"` di CheckoutModal
- [ ] Tambah `"otp"` ke type `Phase` union
