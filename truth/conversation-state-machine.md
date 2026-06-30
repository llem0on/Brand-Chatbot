---
name: conversation-state-machine
description: Top-level flow constants (FlowNew/FlowChat/FlowOrdering), escalation, and the dispatch logic in processTextMessage
type: concept
created: 2026-06-29
sources:
  - handler/webhook.go
  - models/conversation_state.go
tags: [conversation, state-machine, escalation, llm, whatsapp, web]
---

# Conversation State Machine

Setiap user punya satu baris `ConversationState` (keyed by `user_id`). State ini persist di MySQL dan menentukan bagaimana pesan berikutnya diproses.

## Flow Constants

| Konstanta | Value | Deskripsi |
|-----------|-------|-----------|
| `FlowNew` | `"new"` | User baru, belum pernah kirim pesan |
| `FlowChat` | `"chat"` | Mode percakapan normal (FAQ/LLM) |
| `FlowOrdering` | `"ordering"` | Sedang dalam proses pembelian |

Defined di `models/conversation_state.go:20-24`.

## Channel Constants

| Konstanta | Value |
|-----------|-------|
| `ChannelWeb` | `"web"` |
| `ChannelWhatsApp` | `"whatsapp"` |

## Dispatch Logic (`processTextMessage`)

Entry point untuk semua pesan masuk — baik dari WhatsApp webhook maupun web chat widget. Urutan pengecekan penting karena bersifat priority-ordered:

```
1. Load/create ConversationState dari DB
2. Simpan pesan user ke riwayat chat (selalu, termasuk saat escalated)
3. [GUARD] IsEscalated == true → return "" (bot diam)
4. [GUARD] DetectEscalationIntent(text) → escalateToAdmin()
5. FlowNew → kirim welcome, transisi ke FlowChat, return
6. FlowOrdering → handleOrderingFlow() [lihat [[order-flow-state-machine]]]
7. DetectPurchaseIntent(text) → startOrderingFlow()
8. Fallback → processWithLLM() (FAQ + product catalog context)
```

Kode: `handler/webhook.go:70-135`.

## Escalation

Dipicu oleh kata kunci: `admin`, `customer service`, `cs`, `manusia`, `operator`, `hubungkan`, `bicara dengan orang` (regex word-boundary, case-insensitive).

Saat eskalasi:
- LLM dipanggil untuk buat **ringkasan singkat** masalah customer (`groq.Summarize`)
- `IsEscalated = true`, `EscalationSummary` disimpan, `EscalatedAt` dicatat
- Bot tidak lagi auto-reply; pesan user tetap disimpan ke history
- Admin manusia bisa reply via `/admin/conversations/:userId/reply`
- `CurrentFlow` di-reset ke `FlowChat` (bukan state tersendiri)

Kode: `handler/webhook.go:149-172`.

## Normal LLM Flow (`processWithLLM`)

Dipakai saat `FlowChat` dan bukan purchase intent. Kompilasi context:
- History chat terakhir (max 20 pesan, `maxHistory = 20`)
- FAQ aktif (`faqSvc.FormatFAQContext()`)
- Katalog produk (`productSvc.FormatProductContext()`)
- Promo aktif (`promoSvc.FormatActiveContext()`)

Semuanya dikirim ke `groq.Ask()`. Lihat [[llm-integration]] untuk detail client Groq.

## State Transitions (diagram)

```
[NEW USER]
     │
     ▼
  FlowNew ──── first message ────► FlowChat
                                       │
                       ┌───────────────┼───────────────┐
                       │               │               │
               escalation      purchase intent    normal text
                       │               │               │
                       ▼               ▼               ▼
                 IsEscalated=true  FlowOrdering   groq.Ask()
                 (bot silent)          │
                                       │ konfirmasi / batal
                                       ▼
                                   FlowChat (reset)
```

## Field Lengkap `ConversationState`

| Field | Type | Keterangan |
|-------|------|------------|
| `UserID` | string | Primary key unik per user/session |
| `AccountID` | *uint | Diisi setelah web visitor login |
| `Channel` | string | `"web"` atau `"whatsapp"` |
| `CurrentFlow` | string | `new`, `chat`, atau `ordering` |
| `OrderStep` | string | Sub-step saat ordering (lihat [[order-flow-state-machine]]) |
| `IsEscalated` | bool | Bot diam saat true |
| `EscalationSummary` | string | LLM summary untuk briefing admin |
| `EscalatedAt` | *time.Time | Timestamp eskalasi |
| `Context` | string | JSON-serialized [[order-draft]] saat ordering |
