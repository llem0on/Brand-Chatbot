# Brand-Chatbot

Chatbot AI untuk toko/brand baju — WhatsApp + web chat widget, dengan FAQ, katalog produk,
purchase flow, eskalasi ke admin manusia, dan dashboard admin. Backend Go + Gin + GORM,
LLM lewat Groq API (Llama 3.3 70B).

## Setup

1. Siapkan MySQL/MariaDB lokal (default di `.env`: `127.0.0.1:3307`)
2. Isi `.env`:
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
   - `GROQ_API_KEY`, `GROQ_MODEL` (dari [console.groq.com](https://console.groq.com))
   - `ADMIN_TOKEN` — token login dashboard admin
   - `BRAND_NAME`, `BRAND_TAGLINE` — identitas brand
   - `PHONE_NUMBER_ID`, `ACCESS_TOKEN`, `VERIFY_TOKEN` — kalau mau pakai channel WhatsApp (Meta Cloud API)
3. Install deps: `go mod tidy`
4. Jalankan server: `go run main.go`
   - Database, tabel, dan data seed (FAQ/produk/promo/settings) otomatis dibuat saat pertama jalan
5. Buka `http://localhost:8080` untuk web chat, `http://localhost:8080/admin-ui` untuk dashboard admin
6. (Opsional, untuk WhatsApp) Expose via ngrok dan daftarkan webhook URL di Meta Dashboard

## Struktur

```
wa-ai-bot/
├── main.go                  # routing
├── handler/                 # webhook, chat, admin endpoints, purchase flow state machine
├── service/                 # business logic (FAQ, produk, order, customer, settings, dst.)
├── models/                  # GORM models
├── database/                # koneksi DB, migrasi, seed data
├── groq/                    # klien LLM (Groq API)
├── whatsapp/                # klien WhatsApp Cloud API
└── web/                     # widget chat (web/) + dashboard admin (web/admin/)
```

## Fitur utama

- **FAQ & katalog produk** — dikelola lewat dashboard admin, otomatis jadi konteks jawaban bot
- **Purchase flow** — slot-filling pemesanan produk lewat chat (LLM-driven), stok per varian ukuran/warna, settings pembayaran (bank/QRIS/ongkir) bisa diatur di dashboard
- **Eskalasi ke admin** — bot bisa serahkan percakapan ke manusia lengkap dengan ringkasan masalah, admin balas langsung dari dashboard
- **Dashboard admin** — kelola FAQ, Products, Categories, Promotions, Orders, Customers, Settings, dan Chat (eskalasi)
