---
type: workflow
created: 2026-07-01
updated: 2026-07-01
sources:
  - memory/feedback_push_workflow.md
  - fe/.git/config
tags: [git, deploy, subtree, frontend, backend]
---

# Git Push Workflow

Repo monorepo di `/Users/akyunnn/Downloads/wa-ai-bot/` dengan dua subfolder:
- `fe/` → frontend Next.js
- `be/` → backend Go

Remote: `https://github.com/llem0on/Brand-Chatbot.git`

## Dua branch terpisah

| Folder | Branch tujuan |
|---|---|
| `fe/` | `Frontend-dev` |
| `be/` | `Backend-dev` |

**Penting:** Railway/Vercel deploy dari **root branch**, bukan subfolder. Kalau `go.mod` ada di `be/be/go.mod` (nested), Railpack gagal detect Go. Harus di root.

## Cara push yang benar

### Dari root monorepo (pakai git subtree)

```bash
# Push isi fe/ ke root Frontend-dev
git subtree push --prefix=fe origin Frontend-dev

# Push isi be/ ke root Backend-dev
git subtree push --prefix=be origin Backend-dev
```

### Kalau subtree push ditolak (history diverged)

```bash
# be/
git subtree split --prefix=be -b temp-be
git push origin temp-be:Backend-dev --force
git branch -D temp-be

# fe/
git subtree split --prefix=fe -b temp-fe
git push origin temp-fe:Frontend-dev --force
git branch -D temp-fe
```

### Alternatif: dari dalam folder fe/ atau be/ langsung

Kalau `fe/` punya git repo sendiri (ada `.git` di dalamnya):

```bash
cd fe
git add <files>
git commit -m "..."
git push origin main:Frontend-dev
```

Ini equivalen dengan subtree karena root repo `fe/` = root branch `Frontend-dev`.

## Jangan lakukan ini

- `git checkout Frontend-dev -- fe/` lalu push → push `fe/` sebagai **subfolder**, bukan root
- Push langsung ke `main` monorepo untuk deploy
