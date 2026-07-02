---
type: ops
created: 2026-06-29
updated: 2026-06-30
sources: be/.env, fe/.env.local, fe/next.config.ts, fe/lib/auth.ts
tags: [local-dev, mysql, nextauth, turbopack, google-oauth, folder-structure]
---

# Local Development Setup

## Folder structure (sejak 2026-07-02)

Project dipecah jadi dua subfolder:
- `BACKEND/` — Go backend (main.go, handler/, models/, database/, dll)
- `FRONTEND/` — Next.js frontend (app/, components/, lib/, dll)

> Sebelumnya bernama `be/` dan `fe/` — di-rename 2026-07-02. Semua referensi ke `be/` / `fe/` di docs lama harus dibaca sebagai `BACKEND/` / `FRONTEND/`.

File `.env` ada di `BACKEND/.env` (dibaca `godotenv.Load()` dari working dir).
File `FRONTEND/.env.local` untuk Next.js frontend.

## Dua proses yang harus jalan bersamaan

| Proses | Dir | Command | Port |
|---|---|---|---|
| Backend (Go/Gin) | `BACKEND/` | `go run main.go` | 8080 |
| Frontend (Next.js) | `FRONTEND/` | `npm run dev` | 3000 |

## .next cache

Kalau Next.js berperilaku aneh (Turbopack panic, infinite loop, stale build), hapus dulu:
```bash
rm -rf FRONTEND/.next
```
Wajib dilakukan setelah rename/pindah folder — `.next` berisi path lama yang di-hardcode.

## Prerequisite: MySQL

Backend butuh MySQL/MariaDB. Konfigurasi di `be/.env`:

```
DB_HOST=127.0.0.1
DB_PORT=3307
DB_USER=root
DB_PASSWORD=root
DB_NAME=Brand Baju
```

**Catatan port:** MySQL brew di Mac default jalan di **3306**, bukan 3307. Kalau backend gagal connect (`connection refused`), cek dulu dengan `lsof -iTCP -sTCP:LISTEN | grep mysql` — jika port 3306, update `DB_PORT` di `.env`.

Cek MySQL status: `brew services list | grep mysql`
Start MySQL: `brew services start mysql`

## Google OAuth (NextAuth v5)

Frontend pakai NextAuth v5 (`next-auth@5.0.0-beta.31`) dengan Google provider. Config di `fe/.env.local`:

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...
AUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

Redirect URI yang harus didaftarkan di Google Cloud Console:
```
http://localhost:3000/api/auth/callback/google
```

Route handler ada di `fe/app/api/auth/[...nextauth]/route.ts`, dikonfigurasi di `fe/lib/auth.ts`.

## Known Issue: Turbopack Lazy Compile → 404 saat pertama kali

Next.js 16 + Turbopack melakukan lazy compile — route `/api/auth/*` belum dikompilasi saat server baru start dan browser langsung hit. Akibatnya request pertama return 404 meski file route-nya ada.

**Fix:** Tunggu beberapa detik setelah `npm run dev` ready, atau reload halaman. Setelah route dikompilasi sekali, semua request berikutnya 200.

Tanda sudah benar: `GET /api/auth/session 200` muncul di log.

## Admin panel

Login admin di `http://localhost:3000/admin/login` — masukkan `ADMIN_TOKEN` dari `.env` root (bukan Google OAuth). Token disimpan di localStorage key `admin_token`.
