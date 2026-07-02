"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession, signOut } from "next-auth/react";
import { cartCount, onCartChange } from "@/lib/cart";
import { useTheme } from "@/lib/theme";
import { useLocale, LOCALES, LOCALE_LABELS } from "@/lib/locale";

function UserMenu() {
  const { data: session, status } = useSession();
  const { t } = useLocale();
  const [open, setOpen] = useState(false);

  if (status === "loading") return <div style={{ width: 28, height: 28 }} />;

  if (!session) {
    return (
      <Link
        href="/login"
        className="text-[9px] tracking-[0.28em] uppercase transition-all"
        style={{
          color: "var(--color-ink)",
          border: "1px solid color-mix(in srgb, var(--color-accent) 70%, transparent)",
          padding: "6px 16px",
          fontWeight: 500,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.background = "color-mix(in srgb, var(--color-accent) 12%, transparent)";
          (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--color-accent)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
          (e.currentTarget as HTMLAnchorElement).style.borderColor = "color-mix(in srgb, var(--color-accent) 70%, transparent)";
        }}
      >
        {t.signIn}
      </Link>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ background: "transparent", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}
        aria-label="Akun"
      >
        {session.user?.image ? (
          <Image
            src={session.user.image}
            alt={session.user.name ?? "User"}
            width={28}
            height={28}
            style={{ borderRadius: "50%", border: "1px solid rgba(200,183,158,0.3)" }}
          />
        ) : (
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(200,183,158,0.15)", border: "1px solid rgba(200,183,158,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 11, color: "var(--color-accent)", fontWeight: 500 }}>
              {(session.user?.name ?? "U")[0].toUpperCase()}
            </span>
          </div>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 12px)",
              right: 0,
              minWidth: 200,
              background: "rgba(75,29,36,0.97)",
              border: "1px solid rgba(200,183,158,0.12)",
              backdropFilter: "blur(12px)",
              zIndex: 50,
              boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
            }}
          >
            <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(200,183,158,0.08)" }}>
              <div style={{ fontSize: 12, color: "#FCFAF6", fontWeight: 500, marginBottom: 2 }}>{session.user?.name}</div>
              <div style={{ fontSize: 10, color: "rgba(252,250,246,0.55)" }}>{session.user?.email}</div>
            </div>
            <div style={{ padding: "6px 0" }}>
              <Link
                href="/pesanan"
                onClick={() => setOpen(false)}
                style={{ display: "block", padding: "10px 16px", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(252,250,246,0.75)", transition: "color 0.2s ease" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#C8B79E"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(252,250,246,0.75)"; }}
              >
                {t.myOrders}
              </Link>
              <Link
                href="/keranjang"
                onClick={() => setOpen(false)}
                style={{ display: "block", padding: "10px 16px", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(252,250,246,0.75)", transition: "color 0.2s ease" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#C8B79E"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(252,250,246,0.75)"; }}
              >
                {t.cart}
              </Link>
              <button
                onClick={() => { setOpen(false); signOut({ callbackUrl: "/" }); }}
                style={{ width: "100%", textAlign: "left", padding: "10px 16px", fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(252,250,246,0.75)", background: "transparent", border: "none", cursor: "pointer", transition: "color 0.2s ease" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(210,100,100,0.85)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(252,250,246,0.75)"; }}
              >
                {t.signOut}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isLight = theme === "light";

  return (
    <button
      onClick={toggle}
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        border: "1px solid color-mix(in srgb, var(--color-accent) 45%, transparent)",
        background: "transparent",
        position: "relative",
        cursor: "pointer",
        flexShrink: 0,
        padding: 0,
        transition: "border-color 0.3s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "color-mix(in srgb, var(--color-accent) 80%, transparent)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "color-mix(in srgb, var(--color-accent) 45%, transparent)";
      }}
    >
      <span
        style={{
          position: "absolute",
          inset: 2,
          borderRadius: 10,
          background: isLight
            ? "color-mix(in srgb, var(--color-accent) 22%, transparent)"
            : "color-mix(in srgb, var(--color-ink) 6%, transparent)",
          transition: "background 0.3s",
          pointerEvents: "none",
        }}
      />
      <span
        style={{
          position: "absolute",
          top: 3,
          left: isLight ? 22 : 3,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "var(--color-accent)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "left 0.35s cubic-bezier(0.34,1.56,0.64,1)",
          pointerEvents: "none",
        }}
      >
        {isLight ? (
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#321318" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="4" />
            <line x1="12" y1="2" x2="12" y2="5" />
            <line x1="12" y1="19" x2="12" y2="22" />
            <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" />
            <line x1="19.78" y1="19.78" x2="17.66" y2="17.66" />
            <line x1="2" y1="12" x2="5" y2="12" />
            <line x1="19" y1="12" x2="22" y2="12" />
          </svg>
        ) : (
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#321318" strokeWidth="2.5">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </span>
    </button>
  );
}

// 3-position sliding pill: ID → EN → 中 → ID
function LocaleSwitch() {
  const { locale, cycle } = useLocale();
  const idx = LOCALES.indexOf(locale);

  // thumb left positions for 3 slots inside a 72px pill (1px border each side)
  // inner width = 70px; slot = 70/3 ≈ 23px; thumb = 20px
  const SLOT = 70 / 3;
  const thumbLeft = 2 + idx * SLOT;

  return (
    <button
      onClick={cycle}
      aria-label={`Language: ${LOCALE_LABELS[locale]}`}
      style={{
        width: 72,
        height: 24,
        borderRadius: 12,
        border: "1px solid color-mix(in srgb, var(--color-accent) 45%, transparent)",
        background: "transparent",
        position: "relative",
        cursor: "pointer",
        flexShrink: 0,
        padding: 0,
        display: "flex",
        alignItems: "center",
        transition: "border-color 0.3s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "color-mix(in srgb, var(--color-accent) 80%, transparent)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "color-mix(in srgb, var(--color-accent) 45%, transparent)";
      }}
    >
      {/* sliding highlight */}
      <span
        style={{
          position: "absolute",
          top: 2,
          left: thumbLeft,
          width: SLOT - 2,
          height: 18,
          borderRadius: 9,
          background: "var(--color-accent)",
          transition: "left 0.35s cubic-bezier(0.34,1.56,0.64,1)",
          pointerEvents: "none",
        }}
      />
      {/* labels */}
      {LOCALES.map((l, i) => (
        <span
          key={l}
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: l === "zh" ? 11 : 8,
            fontWeight: i === idx ? 700 : 400,
            color: i === idx ? "#321318" : "color-mix(in srgb, var(--color-ink) 55%, transparent)",
            letterSpacing: l === "zh" ? 0 : "0.06em",
            position: "relative",
            zIndex: 1,
            transition: "color 0.3s, font-weight 0.1s",
            lineHeight: 1,
            userSelect: "none",
          }}
        >
          {LOCALE_LABELS[l]}
        </span>
      ))}
    </button>
  );
}

export default function Navbar() {
  const { t } = useLocale();
  const [scrolled, setScrolled] = useState(false);
  const [count, setCount] = useState(0);

  const LINKS = [
    { label: t.home, href: "/" },
    { label: t.collection, href: "/koleksi" },
  ];

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 64); }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setCount(cartCount());
    return onCartChange(() => setCount(cartCount()));
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-bg/70 backdrop-blur-md border-b border-accent/10 py-4"
          : "bg-transparent py-7"
      }`}
    >
      <nav className="mx-auto max-w-7xl px-6 grid grid-cols-3 items-center">
        {/* left: nav links */}
        <ul className="hidden md:flex items-center gap-8 text-xs tracking-[0.2em] uppercase text-ink/80">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="hover:text-accent transition-colors">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* center: brand */}
        <Link href="/" className="font-serif text-2xl tracking-[0.15em] text-center text-ink">
          BRAND
        </Link>

        {/* right: switches + icons */}
        <div className="flex items-center justify-end gap-4">
          <LocaleSwitch />
          <ThemeToggle />

          {/* cart */}
          <Link href="/keranjang" aria-label={t.cart} className="text-ink hover:text-accent transition-colors" style={{ position: "relative" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 7h12l-1 13H7L6 7Z" strokeLinejoin="round" />
              <path d="M9 7a3 3 0 0 1 6 0" strokeLinecap="round" />
            </svg>
            {count > 0 && (
              <span style={{
                position: "absolute",
                top: -6,
                right: -7,
                minWidth: 14,
                height: 14,
                borderRadius: 99,
                background: "var(--color-accent)",
                color: "#321318",
                fontSize: 8,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 3px",
                lineHeight: 1,
              }}>
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>

          {/* pesanan */}
          <Link href="/pesanan" aria-label={t.orders} className="text-ink hover:text-accent transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
              <line x1="9" y1="12" x2="15" y2="12" />
              <line x1="9" y1="16" x2="13" y2="16" />
            </svg>
          </Link>

          <UserMenu />
        </div>
      </nav>
    </header>
  );
}
