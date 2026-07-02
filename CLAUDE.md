# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Knowledge Base

Baca file yang relevan dari `truth/` **secara proaktif** sebelum mengerjakan task yang menyentuh topik tersebut — jangan tunggu user arahkan manual.

<!-- TRUTH_INDEX_START -->
| File | Baca kalau... |
|---|---|
| `truth/payment-system.md` | menyentuh payment proof, upload bukti, admin verify, CheckoutModal payment section |
| `truth/otp-phone-verification.md` | menyentuh OTP, verifikasi HP, checkout phone step |
| `truth/admin-panel.md` | menyentuh admin dashboard, auth ADMIN_TOKEN, apiFetch, routes admin |
| `truth/local-dev-setup.md` | user minta run server, ada error MySQL/port/NextAuth, setup environment, path BACKEND/ dan FRONTEND/ |
| `truth/railway-deployment.md` | deploy ke Railway, env vars DB_*, port config, ADMIN_ORIGIN, NEXTAUTH_URL, root directory Railway |
| `truth/react-nextjs-gotchas.md` | infinite loop di admin panel, useEffect deps, SessionProvider polling, .next cache |
| `truth/cloudinary-client.md` | menyentuh upload gambar atau Cloudinary |
| `truth/conversation-state-machine.md` | menyentuh flow chat, escalation, dispatch webhook |
| `truth/order-flow-state-machine.md` | menyentuh order flow, slot-filling, OrderStep, mergeExtraction |
| `truth/cart-flow.md` | menyentuh cart, keranjang, localStorage, CartModal, checkout flow |
| `truth/git-push-workflow.md` | user minta push, deploy, atau tanya cara push ke branch Development |
| `truth/localization-system.md` | menyentuh bahasa/locale, terjemahan UI, LocaleProvider, switch bahasa, 3-position pill |
| `truth/filter-values-db.md` | menyentuh filter koleksi (warna/gender/kategori/material/ukuran), FilterValue model, Groq translate |
| `truth/koleksi-discount-sidebar.md` | menyentuh DiscountSidebar, discount_pct, animasi scroll, CSS .sale-* |
| `truth/biteship-integration.md` | menyentuh ongkir, kurir, shipment, Biteship API, webhook pengiriman |
| `truth/session-gotchas-2026-07-02.md` | nested .git bug, filter-values 404, discount_pct tidak tersimpan, push workflow change |
<!-- TRUTH_INDEX_END -->

## Architecture Overview

This is a two-process project:

**Backend** — Go (Gin + GORM) in `be/`. Handles all business logic, the WhatsApp webhook, the web chat API, and the admin REST API. Runs on port 8080 by default.

**Frontend** — Next.js 16 / React 19 / Tailwind 4 in `fe/`. Admin dashboard SPA. Runs on port 3000 in dev. Communicates with the backend via `NEXT_PUBLIC_API_BASE_URL` (defaults to `http://localhost:8080`).

The old plain-HTML frontend lives in `web/_archive/` — it is dead code; do not touch it.

## Development Commands

### Backend (`cd be` first)
```bash
go mod tidy          # install/sync deps
go run main.go       # start server (auto-migrates DB and seeds on first run)
go build ./...       # compile check (no test suite exists yet)
```

### Frontend (`cd fe` first)
```bash
npm install
npm run dev          # dev server on :3000
npm run build        # production build
npm run lint         # ESLint
```

## Environment Variables (`.env` in `be/`)

| Variable | Purpose |
|---|---|
| `DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME` | MySQL/MariaDB (default port 3307) |
| `GROQ_API_KEY / GROQ_MODEL` | LLM — Groq API (Llama 3.3 70B) |
| `ADMIN_TOKEN` | Bearer token for all `/admin/*` routes |
| `BRAND_NAME / BRAND_TAGLINE` | Injected into the LLM system prompt |
| `PHONE_NUMBER_ID / ACCESS_TOKEN / VERIFY_TOKEN` | WhatsApp Cloud API (optional) |
| `CLOUDINARY_*` | Image uploads via Cloudinary |

Frontend uses `fe/.env.local` with `NEXT_PUBLIC_API_BASE_URL`.

## Backend Code Structure (`be/`)

**`main.go`** — route registration only; no business logic.

**`handler/`** — Gin handlers, one file per domain area.
- `webhook.go` — core message dispatch: `processTextMessage` is the entry point for all incoming chat (web + WhatsApp). Orchestrates flow detection → LLM → save.
- `order_flow.go` — entire purchase state machine (slot-filling via LLM). `handleOrderingFlow` drives the draft forward; `mergeExtraction` resolves LLM output against the real DB catalog.
- `auth.go` — storefront user accounts (register / login / email verify / session cookie).
- `cart.go` — anonymous + account-scoped cart.
- `admin_*.go` — CRUD for FAQ, products, categories, promotions, orders, and escalated chat.
- `cors.go` — CORS middleware.

**`service/`** — Business logic; all direct DB access goes through here (except in handlers that bypass for brevity). Services are thin structs with a `New*Service()` constructor.

**`models/`** — GORM model structs. `conversation_state.go` holds the flow/step constants. `order_draft.go` is the transient JSON blob stored in `ConversationState.Context` during ordering.

**`groq/client.go`** — All LLM calls. Three public functions:
- `Ask` — general FAQ/product conversation.
- `Summarize` — brief for the human admin when a chat is escalated.
- `ExtractOrderUpdate` — slot-filling JSON extraction during the ordering flow.

**`database/db.go`** — `Init()` runs auto-migrate + seeds on every startup (seeds are idempotent). MySQL database is auto-created if it doesn't exist.

**`whatsapp/` / `cloudinary/` / `email/`** — thin API client wrappers.

## Conversation State Machine

A `ConversationState` row (keyed by `user_id`) tracks where a conversation is:

- `FlowNew` → `FlowChat` on first message (sends welcome).
- `FlowChat` → `FlowOrdering` when `DetectPurchaseIntent` matches keywords (`beli`, `order`, `checkout`, `pesan barang/produk`).
- `FlowOrdering` steps: `pilih_produk` → `pilih_varian` → `data_pembeli` → `pilih_bayar` → `konfirmasi`. The draft is JSON-serialized in `ConversationState.Context`.
- `IsEscalated = true` silences the bot; human admin replies via `/admin/conversations/:userId/reply`.

## Admin API Authentication

All `/admin/*` routes require `Authorization: Bearer <ADMIN_TOKEN>`. The frontend stores this in `localStorage` under key `admin_token` (`fe/lib/api.ts`) and redirects to `/admin/login` on 401.

## Frontend Structure (`fe/`)

`fe/app/` uses the Next.js App Router. All admin pages are under `fe/app/admin/`. Shared UI primitives are in `fe/components/admin/` (`AdminShell`, `AdminSidebar`, `DataTable`, `Modal`). API calls go through `fe/lib/api.ts` (`apiFetch`).

> **Note:** This project uses Next.js 16 / React 19, which have breaking changes from prior versions. Read `node_modules/next/dist/docs/` before writing Next.js–specific code.

---

## Truth

Knowledge base di `truth/` — dikelola oleh Claude, diupdate saat ada perubahan signifikan atau diminta.

### Struktur
- `truth/` → halaman-halaman knowledge, satu topik per file
- `truth/index.md` → katalog semua halaman
- `truth/log.md` → append-only log: `## [YYYY-MM-DD] operation | judul`

### Conventions
- Setiap page pakai YAML frontmatter: type, created, sources, tags
- Gunakan `[[wikilinks]]` ke konsep terkait
- Update index.md dan log.md setiap kali buat atau edit halaman

### Custom slash commands (Claude Code)

- Project-level: `.claude/commands/<name>.md` → hanya aktif di project ini
- Global: `~/.claude/commands/<name>.md` → aktif di semua project di mesin ini
- `.agents/skills/` adalah sistem berbeda (skills-lock.json) — jangan taruh slash commands di sana, akan muncul duplikat

### End-of-session knowledge extraction: `/store-session`

Jalankan `/store-session` di akhir sesi untuk menyimpan knowledge penting ke `truth/` — supaya sesi berikutnya tidak mulai dari nol.

Skill ini otomatis:
1. Scan conversation, ekstrak knowledge reusable (bug fixes, decisions, patterns, deployment gotchas)
2. Buat atau update halaman di `truth/`
3. Update `truth/index.md` dan `truth/log.md`
4. Update tabel `<!-- TRUTH_INDEX_START -->` … `<!-- TRUTH_INDEX_END -->` di CLAUDE.md ini

Trigger lama `'store` (apostrophe) masih bisa dipakai untuk quick-store topik spesifik yang sedang dibahas.
