---
name: localization-system
description: Arsitektur full localization ID/EN/ZH — React Context, 70+ keys, 3-position switch di Navbar, semua halaman localized kecuali nama produk
type: project
created: 2026-07-01
updated: 2026-07-01
sources:
  - fe/lib/locale.tsx
  - fe/components/Navbar.tsx
  - fe/app/layout.tsx
  - fe/app/koleksi/page.tsx
  - fe/app/keranjang/page.tsx
  - fe/app/pesanan/page.tsx
tags: [frontend, i18n, localization, context, navbar]
---

## Overview

Full 3-language localization (ID/EN/ZH) via React Context. Semua UI text berubah saat user klik switch — kecuali nama produk dan kategori yang datang dari DB.

---

## Core: `fe/lib/locale.tsx`

Satu file yang berisi tipe, data, dan provider:

```ts
export type Locale = "id" | "en" | "zh";
export const LOCALES: Locale[] = ["id", "en", "zh"];
export const LOCALE_LABELS: Record<Locale, string> = { id: "ID", en: "EN", zh: "中" };

export type Translations = { /* 70+ keys */ };

const T: Record<Locale, Translations> = { id: {...}, en: {...}, zh: {...} };
```

**Penting:** Type harus `Record<Locale, Translations>` (explicit type annotation), **bukan** `as const`. Kalau pakai `as const`, TypeScript membuat tiap locale punya literal types sehingga `T[locale]` jadi union type yang tidak assignable ke `Translations`.

Provider:
```tsx
export function LocaleProvider({ children }) {
  const [locale, setLocale] = useState<Locale>("id");
  useEffect(() => {
    const saved = localStorage.getItem("site-locale") as Locale;
    if (LOCALES.includes(saved)) setLocale(saved);
  }, []);
  function cycle() {
    setLocale(prev => {
      const next = LOCALES[(LOCALES.indexOf(prev) + 1) % LOCALES.length];
      localStorage.setItem("site-locale", next);
      return next;
    });
  }
  return <Ctx.Provider value={{ locale, t: T[locale], cycle }}>{children}</Ctx.Provider>;
}
export function useLocale() { return useContext(Ctx); }
```

Persistent ke `localStorage` key `"site-locale"`. Default `"id"`.

---

## Wrap di `fe/app/layout.tsx`

```tsx
<ThemeProvider>
  <LocaleProvider>
    {children}
  </LocaleProvider>
</ThemeProvider>
```

---

## 3-position switch di Navbar

Switch 72×24px dengan sliding background highlight (bukan thumb circle) — karena 3 pilihan perlu proportional spacing:

```tsx
const SLOT = 70 / 3;
const idx = LOCALES.indexOf(locale); // 0=id, 1=en, 2=zh
const thumbLeft = 2 + idx * SLOT;
// highlight span: top:2, left:thumbLeft, width:SLOT-2, height:18
// transition: left 0.35s cubic-bezier(0.34,1.56,0.64,1)
```

Click tombol → `cycle()` → locale berubah, all UI re-renders.

---

## Translations yang ada di `T`

**Navbar:** home, collection, signIn, myOrders, cart, orders, signOut

**Hero:** heroEdition, heroTagline, heroCtaShop, heroCtaFitting

**BrandStatement:** quotePart1, quoteDescribing, quotePart2, quoteProposing, quotePart3, quoteCaption

**FeaturedCollection:** sectionForms, formsSub, formSub1–6

**NewArrivals:** journalHeading, journalSub, readNote, journalCat1–3, journalTitle1–3

**StorySection:** atelierEyebrow, atelierLeadPre/Hl/Post, railFounded/Where/PerEdition/Method/Seen + vals, prose1Pre/Hl/Post, prose2, prose3Pre/Hl/Post

**MarqueeStrip:** marqueeMade, marqueeCity, marqueeAppt

**Footer:** footerTagline, footerShop, footerAtelier, footerReach

**Koleksi:** loading, noProducts, resetFilter, itemsAvailable(n), selectCollection, koleksiSub, filter, reset, buy, filterCategory/Gender/Material/Size/Color

**Keranjang:** cartTitle, cartEmpty, cartEmptyMsg, viewCollection, subtotal(qty), shippingNote, checkout, continueShopping

**Pesanan:** account, myOrdersTitle, notLoggedIn, notLoggedInMsg, signInGoogle, tabOngoing/Completed/Cancelled, noOrders, noOrdersInTab, startShopping, shipping, total, paymentRejected, proofSent, viewProof, awaitingPayment, statusPending/Paid/Shipped/Done/Cancelled

---

## Pola untuk teks dengan highlight inline

Split key jadi `_Pre`, `_Hl`, `_Post` agar bisa wrap `<span>` di bahasa apapun:

```tsx
// Di komponen:
<p>{t.prose1Pre}<span style={{color: accent}}>{t.prose1Hl}</span>{t.prose1Post}</p>

// Di translations:
id: { prose1Pre: "... teks sebelum ...", prose1Hl: "kata highlight", prose1Post: " sisa kalimat." }
en: { prose1Pre: "... text before ...", prose1Hl: "highlighted word", prose1Post: " rest of sentence." }
```

---

## Filter value translation

Filter values (Hitam, Pria, Kaos, dll.) yang datang dari DB **tidak** diterjemahkan via locale.tsx. Mereka pakai sistem terpisah: `FilterValue` tabel di DB, dengan format `"English,Indonesian,Mandarin"`. Lihat [[filter-values-db]].

---

## Cara pakai di komponen baru

```tsx
"use client";
import { useLocale } from "@/lib/locale";

export default function MyComponent() {
  const { t } = useLocale(); // t is Translations, full type-safety
  return <h1>{t.someKey}</h1>;
}
```

Untuk function keys: `t.itemsAvailable(n)`, `t.subtotal(qty)`.

---

## Komponen yang sudah localized

- `fe/components/Navbar.tsx` — LINKS, UserMenu, ThemeToggle, LocaleSwitch
- `fe/components/Hero.tsx`
- `fe/components/BrandStatement.tsx`
- `fe/components/MarqueeStrip.tsx`
- `fe/components/FeaturedCollection.tsx` — subKey number pattern
- `fe/components/NewArrivals.tsx` — catKey/titleKey number pattern
- `fe/components/StorySection.tsx` — RAIL array, prose split keys
- `fe/components/Footer.tsx`
- `fe/app/koleksi/page.tsx` — FilterSidebar + HeroCard + KoleksiPage
- `fe/app/keranjang/page.tsx`
- `fe/app/pesanan/page.tsx` — PaymentSection, OrderCard, PesananPage
