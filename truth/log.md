# Log

## [2026-07-02] store-session | Folder rename, Railway migration, discount_pct fix, filter-values 404, push workflow update
Created: truth/session-gotchas-2026-07-02.md — nested .git bug, filter-values missing from Development, discount_pct field fix, DiscountSidebar conditional render, push confirmation rule
Updated: truth/railway-deployment.md — folder rename be/→BACKEND/ fe/→FRONTEND/, kedua service dari Development branch, root dir /BACKEND & /FRONTEND
Updated: truth/local-dev-setup.md — folder rename, path commands updated
Updated: truth/git-push-workflow.md — single branch Development, no more subtree split, konfirmasi sebelum push
Updated: truth/index.md — tambah entry session-gotchas, update deskripsi

## [2026-07-02] store-session | Biteship webhook security + Railway URL + payment-system update
Updated: truth/biteship-integration.md — webhook security (Headers Signature Key/Secret), Railway webhook URL, ngrok gotcha untuk local testing
Updated: truth/railway-deployment.md — URL backend carin.up.railway.app, env vars Biteship
Updated: truth/payment-system.md — checkout phase flow berubah (loading → address → courier → form), bug fix GET /api/settings/public tidak return bank details, approve flow sekarang auto-create Biteship shipment

## [2026-07-02] implement | Biteship shipment integration
Created: truth/biteship-integration.md — Biteship rate API (checkout courier selection), auto-create shipment on payment approve, webhook status tracking, new Order fields, admin settings UI

## [2026-07-01] store-session | Localization system + Filter Values DB
Created: truth/localization-system.md — React Context ID/EN/ZH, LocaleProvider, 3-position switch, 70+ keys, split-key highlight pattern, all pages localized
Created: truth/filter-values-db.md — FilterValue model "EN,ID,ZH" format, Groq TranslateFilterValue(), admin CRUD, seed 40 values, fvLabel() helper
Updated: truth/koleksi-discount-sidebar.md — replaced stale "fake discount" with real discount_pct DB field info

## [2026-07-01] store-session | Claude Code slash command locations
Updated: CLAUDE.md — project commands di .claude/commands/, global di ~/.claude/commands/, jangan taruh di .agents/skills/

## [2026-07-01] store-session | Koleksi Discount Sidebar
Created: truth/koleksi-discount-sidebar.md — arsitektur DiscountSidebar: auto-scroll via tickV keyframe, fake discount logic, ghost % absolute positioning, CSS hover effects (.sale-*), translucent backdrop

## [2026-07-01] store-session | Git Push Workflow
Created: truth/git-push-workflow.md — push fe/ → Frontend-dev, be/ → Backend-dev via git subtree; kenapa root branch penting untuk Railway deploy

## [2026-06-30] store-session | Folder restructure, Railway deployment, React gotchas
Updated: local-dev-setup.md, admin-panel.md (path frontend/ → be/ dan fe/)
Created: railway-deployment.md — Railway MySQL env mapping, port config, CORS vars
Created: react-nextjs-gotchas.md — useEffect [router] infinite loop fix, SessionProvider polling fix, .next cache gotcha

## [2026-06-29] update | Admin Panel — Warm Palette Theme
Sources: frontend/app/globals.css, frontend/components/admin/AdminShell.tsx, AdminSidebar.tsx, Modal.tsx
Updated: truth/admin-panel.md
Palette: #4B1D24 · #7C2A35 · #A56A6C · #CBB4A7 · #EFE4DC. Dark wine sidebar + cream content. Root fix: @theme inline → @theme (inline bakes values statically, blokir CSS var cascade).


## [2026-06-29] ingest | Payment System
Sources: models/order.go, handler/payment.go, frontend/app/keranjang/CheckoutModal.tsx, frontend/app/pesanan/page.tsx, frontend/app/admin/orders/page.tsx
Created: truth/payment-system.md
Note: akan dimodifikasi lagi ke depannya

## [2026-06-29] ingest | OTP Phone Verification
Sources: frontend/app/keranjang/CheckoutModal.tsx, handler/cart.go
Created: truth/otp-phone-verification.md
Status: ON HOLD — user belum beli nomor WA cadangan

## [2026-06-29] ingest | Admin Panel
Sources: frontend/app/admin/layout.tsx, frontend/app/admin/*/page.tsx, frontend/lib/api.ts, main.go
Created: truth/admin-panel.md

## [2026-06-29] ingest | Local Dev Setup
Sources: .env, frontend/.env.local, next.config.ts, frontend/lib/auth.ts
Created: truth/local-dev-setup.md

## [2026-06-29] ingest | Cloudinary Client
Sources: cloudinary/client.go
Created: truth/cloudinary-client.md

## [2026-06-29] ingest | Conversation State Machine
Sources: handler/webhook.go, models/conversation_state.go
Created: truth/conversation-state-machine.md

## [2026-06-29] refactor | Cart → localStorage
Cart dipindah dari DB ke localStorage. Utility: frontend/lib/cart.ts. Checkout backend diubah terima items dari body.
Updated: truth/cart-flow.md

## [2026-06-29] ingest | Cart Flow
Sources: handler/cart.go, service/cart_service.go, models/cart_item.go, frontend/app/koleksi/CartModal.tsx, frontend/app/keranjang/page.tsx
Created: truth/cart-flow.md
Bug fixed: keranjang/page.tsx setItems(Array.isArray(data)) → setItems(Array.isArray(data?.items))

## [2026-06-29] ingest | Order Flow State Machine
Sources: handler/order_flow.go, models/conversation_state.go, models/order_draft.go
Created: truth/order-flow-state-machine.md
