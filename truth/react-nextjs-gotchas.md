---
type: knowledge
created: 2026-06-30
sources: [fe/hooks/useAdminAuth.ts, fe/components/SessionProvider.tsx]
tags: [react, nextjs, infinite-loop, useEffect, nextauth, session]
---

# React / Next.js Gotchas

## useEffect dengan `[router]` dep → infinite loop

**Symptom:** Admin pages memicu ratusan request per detik ke backend (GET /admin/orders, GET /api/auth/session dll) — terlihat di terminal log.

**Root cause:** `useRouter()` dari Next.js App Router bisa menghasilkan referensi baru tiap render di kondisi tertentu. Kalau `router` dimasukkan ke deps `useEffect`, effect akan re-run terus.

```ts
// SALAH — bikin infinite loop
useEffect(() => { ... }, [router]);

// BENAR — run sekali saja, router stable setelah mount
useEffect(() => { ... }, []);
```

File yang diperbaiki: `fe/hooks/useAdminAuth.ts`

## NextAuth SessionProvider polling tanpa batas

**Symptom:** `/api/auth/session` dipanggil terus-terusan (setiap beberapa detik) meski admin panel tidak pakai Google login.

**Root cause:** `<NextAuthSessionProvider>` default polling session secara berkala dan refetch saat window focus.

**Fix:** Matikan polling di `fe/components/SessionProvider.tsx`:
```tsx
<NextAuthSessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
  {children}
</NextAuthSessionProvider>
```

Admin panel pakai `ADMIN_TOKEN` di localStorage — tidak butuh NextAuth session sama sekali. Storefront (Google login) masih works karena SessionProvider tetap ada, hanya tidak polling aktif.

## .next cache harus dihapus setelah rename folder

Kalau folder frontend di-rename (misal `frontend/` → `fe/`), Next.js dev server lama masih jalan dari path lama. Efeknya: port 3000 listen tapi semua request pending/timeout.

**Fix:**
1. Kill proses Next.js lama (`kill <pid>`)
2. `rm -rf fe/.next`
3. Start ulang dari folder baru: `cd fe && npm run dev`
