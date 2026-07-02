---
type: workflow
created: 2026-07-01
updated: 2026-07-02
sources:
  - user instruction 2026-07-02
tags: [git, deploy, frontend, backend, railway]
---

# Git Push Workflow

Repo monorepo di `/Users/akyunnn/Downloads/wa-ai-bot/` dengan dua subfolder:
- `FRONTEND/` → frontend Next.js
- `BACKEND/` → backend Go

Remote: `https://github.com/llem0on/Brand-Chatbot.git`

## Satu branch untuk semua (sejak 2026-07-02)

**Semua perubahan — backend maupun frontend — push ke satu branch: `Development`.**

Backend-dev dan Frontend-dev sudah tidak dipakai lagi.

```bash
git push origin Development
```

## Railway config

| Service | Branch | Root Directory |
|---|---|---|
| Backend (carin-be) | `Development` | `/BACKEND` |
| Frontend (carin) | `Development` | `/FRONTEND` |

## Aturan push

- **Selalu minta konfirmasi user sebelum push** — jangan push otomatis
- Commit dulu, baru tanya user apakah mau push
- Kalau user bilang push, jalankan: `git push origin Development`

## Jangan lakukan ini

- Push ke `Backend-dev` atau `Frontend-dev` — branch itu sudah tidak aktif
- Push tanpa konfirmasi user terlebih dahulu
- `git subtree push` — tidak diperlukan lagi
