---
type: ops
created: 2026-06-30
sources: [be/.env, be/database/db.go, fe/.env.local]
tags: [railway, deployment, mysql, env-vars, cors]
---

# Railway Deployment

## Service structure

Dua service terpisah di Railway:
- **Brand-Chatbot** — Go backend, port 8080 → `https://carin.up.railway.app`
- **Frontend** (opsional) — Next.js, port 3000

## Go backend — env vars yang wajib diset di Railway Variables

Railway MySQL expose variabel dengan nama berbeda dari yang dipakai `be/database/db.go`:

| Railway Variable | Di-map ke env var ini | Keterangan |
|---|---|---|
| `${{MySQL.MYSQLHOST}}` | `DB_HOST` | Private domain Railway MySQL |
| `${{MySQL.MYSQLPORT}}` | `DB_PORT` | Biasanya `3306` |
| `${{MySQL.MYSQLUSER}}` | `DB_USER` | |
| `${{MySQL.MYSQL_ROOT_PASSWORD}}` | `DB_PASSWORD` | |
| — | `DB_NAME` | Isi nama bebas, misal `brand_baju` (tanpa spasi). Go auto-create database. |

**Gotcha penting:** Go code (`db.go`) punya default `DB_HOST=127.0.0.1` dan `DB_PORT=3307`. Kalau `DB_HOST` tidak diset di Railway Variables, backend akan mencoba connect ke `127.0.0.1` dan gagal (`connection refused`). Railway hanya set `MYSQLHOST` dll — harus di-remap manual.

Tanda sudah benar: log Railway menampilkan `Server jalan di :8080` tanpa error database.

## CORS dan origin

| Var | Nilai di Railway | Keterangan |
|---|---|---|
| `ADMIN_ORIGIN` | `https://<url-fe>.up.railway.app` | URL frontend — dipakai Go untuk CORS whitelist |
| `PUBLIC_BASE_URL` | `https://<url-be>.up.railway.app` | URL backend itu sendiri |

## Frontend Railway env vars

Di service Next.js:

| Var | Nilai |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `https://<url-be>.up.railway.app` |
| `NEXTAUTH_URL` | `https://<url-fe>.up.railway.app` |

## Port di Railway Networking

Backend Go service harus pakai port **8080** di Railway Networking settings (bukan 3000). Port 3000 adalah Next.js frontend (service terpisah).

## Biteship env vars (tambahan setelah integrasi 2026-07-02)

| Var | Nilai |
|---|---|
| `BITESHIP_API_KEY` | API key dari Biteship dashboard |
| `BITESHIP_WEBHOOK_SECRET` | Secret bebas, harus sama dengan isian di Biteship dashboard Headers |

Lihat [[biteship-integration]] untuk detail setup webhook.

## Railway build/start commands

Backend: `cd be && go run main.go` (atau `go build -o app && ./app`)
Frontend: `cd fe && npm run build && npm run start`
