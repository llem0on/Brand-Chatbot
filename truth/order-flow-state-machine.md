---
name: order-flow-state-machine
description: Order step constants, slot-filling via LLM, mergeExtraction, dan finalisasi order
type: concept
created: 2026-06-29
sources:
  - handler/order_flow.go
  - models/conversation_state.go
  - models/order_draft.go
tags: [order, state-machine, slot-filling, llm, groq, product-variant, stock]
---

# Order Flow State Machine

Ketika [[conversation-state-machine]] mendeteksi purchase intent, `CurrentFlow` diset ke `FlowOrdering`. Sub-state ditrack di `OrderStep` (field terpisah), dan draft pesanan di-serialize sebagai JSON di `ConversationState.Context`.

## OrderStep Constants

| Konstanta | Value | Kondisi masuk |
|-----------|-------|---------------|
| `OrderStepPilihProduk` | `"pilih_produk"` | `draft.ProductID == 0` |
| `OrderStepPilihVarian` | `"pilih_varian"` | `Size == ""` atau `Color == ""` atau `Quantity <= 0` |
| `OrderStepDataPembeli` | `"data_pembeli"` | `Name == ""` atau `Phone == ""` atau `Address == ""` |
| `OrderStepPilihBayar` | `"pilih_bayar"` | `PaymentMethod == ""` |
| `OrderStepKonfirmasi` | `"konfirmasi"` | Semua slot terisi |
| `OrderStepKonfirmasiBatal` | `"konfirmasi_batal"` | User mengetik kata cancel |

Defined di `models/conversation_state.go:27-34`.

## OrderDraft — Slot Blob

Disimpan sebagai JSON di `ConversationState.Context`. Semua field opsional saat dibuat; diisi bertahap melalui LLM slot-filling.

```go
type OrderDraft struct {
    ProductID     uint
    ProductCode   string
    ProductName   string
    Size          string
    Color         string
    Quantity      int
    Name          string    // nama penerima
    Phone         string
    Address       string
    PaymentMethod string    // "transfer_bank" atau "qris"
    PreOrder      bool      // aktif jika user ketik "pre-order"
}
```

Defined di `models/order_draft.go`.

## Flow per Pesan (`handleOrderingFlow`)

Setiap pesan saat `FlowOrdering` melewati pipeline ini:

```
1. loadDraft() — unmarshal JSON dari ConversationState.Context
2. [PRIORITY] OrderStep == konfirmasi_batal?
     - affirmPattern match → resetOrderState() → FlowChat
     - else → nextStepAndPrompt() → lanjut order
3. [PRIORITY] cancelPattern match → step = konfirmasi_batal, minta konfirmasi
4. OrderStep == konfirmasi && confirmPattern match → finalizeOrder()
5. preorderPattern match → draft.PreOrder = true
6. groq.ExtractOrderUpdate(draftJSON, catalogContext, text) → rawJSON
7. mergeExtraction(&draft, rawJSON, productSvc) → issue atau ""
     - issue != "" → saveDraft(), return issue ke user (jangan advance)
8. nextStepAndPrompt(draft, settings) → step, prompt
9. step == konfirmasi → buildOrderSummaryForDraft() (ringkasan + "ketik konfirmasi")
   else → return prompt
```

Kode: `handler/order_flow.go:56-121`.

## Slot-Filling via LLM (`groq.ExtractOrderUpdate`)

Setiap pesan dikirim ke LLM dengan konteks:
- JSON draft saat ini (apa yang sudah diketahui)
- Katalog produk lengkap (`productSvc.FormatProductContext()`)
- Teks pesan user

LLM mengembalikan JSON partial (hanya field yang bisa diekstrak dari pesan ini). Lihat [[llm-integration]] untuk detail prompt Groq.

## Catalog Validation (`mergeExtraction`)

Setelah LLM mengisi slot, field divalidasi ke DB nyata — **bukan dipercaya mentah-mentah**:

```
extracted.ProductCode / ProductName
  → productSvc.FindByCodeOrName()
  → tidak ketemu: return error message ke user

Size + Color
  → productSvc.FindVariant(productID, size, color)
  → kombinasi tidak ada: describe available variants, clear size/color dari draft

Stok
  → variant.Stock <= 0 && !draft.PreOrder: tawarkan pre-order
  → draft.Quantity > variant.Stock && !draft.PreOrder: tawarkan kurangi quantity
```

Kode: `handler/order_flow.go:127-207`.

Penting: `mergeExtraction` mengembalikan string issue. Jika non-empty, draft disimpan dan issue dikembalikan ke user **tanpa advance step**. Ini mencegah looping ke step berikutnya saat ada masalah katalog.

## State Derivation (bukan linear counter)

`nextStepAndPrompt()` men-derive step dari kelengkapan draft, bukan increment counter:

```
ProductID == 0           → pilih_produk
Size == "" || Color == "" || Quantity <= 0 → pilih_varian
Name/Phone/Address kosong → data_pembeli
PaymentMethod == ""       → pilih_bayar
semua terisi              → konfirmasi
```

**Efek**: User bisa mengisi beberapa slot dalam satu pesan (misalnya "mau beli kaos hitam ukuran M, 2 pcs") dan langsung loncat ke step yang relevan. Lihat `handler/order_flow.go:227-244`.

## Finalisasi (`finalizeOrder`)

Dipicu saat `OrderStep == konfirmasi` dan user mengetik `konfirmasi`:

1. `customerSvc.GetOrCreate()` — upsert data customer
2. `productSvc.FindVariant()` — ambil variant yang sudah divalidasi
3. `orderSvc.CreateOrder()` — buat Order + OrderLine di DB
4. `buildPaymentInstructions()` — rekening bank atau URL QRIS dari `PurchaseSettings`
5. `resetOrderState()` — `CurrentFlow = FlowChat`, bersihkan `OrderStep` dan `Context`

Order number dikembalikan ke user bersama instruksi pembayaran dan deadline (dari `settings.PaymentDeadlineHours`).

Kode: `handler/order_flow.go:281-324`.

## Cancel Flow

```
user: "batal"
  → OrderStep = konfirmasi_batal
  → bot: "Yakin? Balas 'ya' untuk batalkan"

user: "ya"
  → resetOrderState() → FlowChat
  → bot: "Pesanan dibatalkan"

user: (pesan lain)
  → lanjut order dari step sebelumnya
```

## Pre-Order

Diaktifkan dengan kata kunci `pre-order` atau `preorder`. Set `draft.PreOrder = true`, mem-bypass pengecekan stok di `mergeExtraction`. User perlu mengkonfirmasi secara eksplisit bahwa mereka mau pre-order.

## Payment Methods

| Konstanta | Value | Keterangan |
|-----------|-------|------------|
| `PaymentMethodTransferBank` | `"transfer_bank"` | Info rekening dari `PurchaseSettings` |
| `PaymentMethodQRIS` | `"qris"` | URL gambar QRIS dari `PurchaseSettings` |

Ketersediaan metode dikontrol admin via `settings.EnableBankTransfer` dan `settings.EnableQRIS`.

## Diagram Alur Lengkap

```
purchase intent detected
         │
         ▼
   startOrderingFlow()
   FlowOrdering, OrderStep=""
         │
         ▼ (setiap pesan)
   ┌─────────────────────────────────────────┐
   │           handleOrderingFlow()           │
   │                                         │
   │  cancel → konfirmasi_batal ──► reset    │
   │                                         │
   │  LLM ExtractOrderUpdate                 │
   │       ↓                                 │
   │  mergeExtraction (validate catalog)     │
   │       ↓ issue?                          │
   │       ├─ yes → return issue, stay step  │
   │       └─ no  → nextStepAndPrompt()      │
   │                    ↓                    │
   │              pilih_produk               │
   │                    ↓                    │
   │              pilih_varian               │
   │                    ↓                    │
   │              data_pembeli               │
   │                    ↓                    │
   │              pilih_bayar                │
   │                    ↓                    │
   │              konfirmasi ──"konfirmasi"──► finalizeOrder()
   └─────────────────────────────────────────┘             │
                                                           ▼
                                                     FlowChat (reset)
```
