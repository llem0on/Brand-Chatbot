# Log

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
