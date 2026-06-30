# Wiki Index

## Checkout & Auth
- [Payment System](payment-system.md) — proof upload di CheckoutModal, admin verify (ACC/tolak), model fields, 2 endpoint baru, akan dimodifikasi lagi
- [OTP Phone Verification](otp-phone-verification.md) — ON HOLD, arsitektur siap, titik injeksi di handlePhoneContinue, butuh nomor WA cadangan

## Admin
- [Admin Panel](admin-panel.md) — pages, auth (ADMIN_TOKEN Bearer), API layer (apiFetch), ports :3000/:8080

## Dev & Ops
- [Local Dev Setup](local-dev-setup.md) — cara run be/ dan fe/, MySQL port gotcha, .next cache gotcha, Google OAuth setup
- [Railway Deployment](railway-deployment.md) — env vars mapping Railway MySQL → DB_*, port 8080 backend, CORS/ADMIN_ORIGIN, build commands
- [React / Next.js Gotchas](react-nextjs-gotchas.md) — useEffect [router] infinite loop, SessionProvider polling fix, .next cache setelah rename

## Infrastructure & Integrations
- [Cloudinary Client](cloudinary-client.md) — signed server-side image upload, returns HTTPS URL

## Storefront & Cart
- [Cart Flow](cart-flow.md) — session identity, API shape `{ items, total }`, frontend files, bug fix (keranjang kosong)

## Conversation & Ordering
- [Conversation State Machine](conversation-state-machine.md) — FlowNew/FlowChat/FlowOrdering, escalation, dispatch priority order
- [Order Flow State Machine](order-flow-state-machine.md) — OrderStep constants, slot-filling via LLM, mergeExtraction, finalisasi order
