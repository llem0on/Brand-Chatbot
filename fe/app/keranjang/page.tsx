"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { getCart, updateCartQty, removeFromCart, type LocalCartItem } from "@/lib/cart";
import CheckoutModal from "./CheckoutModal";

function rupiah(n: number) {
  return "Rp" + n.toLocaleString("id-ID");
}

export default function KeranjangPage() {
  const [items, setItems] = useState<LocalCartItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  useEffect(() => {
    setItems(getCart());
    setMounted(true);
  }, []);

  function handleUpdateQty(variantId: number, quantity: number) {
    updateCartQty(variantId, quantity);
    setItems(getCart());
  }

  function handleRemove(variantId: number) {
    removeFromCart(variantId);
    setItems(getCart());
  }

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-28 pb-20" style={{ background: "var(--color-bg)" }}>
        <div className="mx-auto max-w-4xl px-6">

          {/* header */}
          <div className="mb-12">
            <div style={{ fontSize: 8, letterSpacing: "0.38em", textTransform: "uppercase", color: "rgba(203,180,167,0.88)", marginBottom: 10 }}>
              Keranjang Belanja
            </div>
            <h1 className="font-serif" style={{ fontSize: "clamp(28px,4vw,46px)", color: "#EFE4DC", lineHeight: 1.05 }}>
              {!mounted ? "Memuat..." : items.length === 0 ? "Keranjang Kosong" : `${items.length} Item`}
            </h1>
          </div>

          {/* empty state */}
          {mounted && items.length === 0 && (
            <div style={{ textAlign: "center", paddingTop: 60, paddingBottom: 60 }}>
              <div style={{ marginBottom: 24, color: "rgba(203,180,167,0.55)" }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ margin: "0 auto" }}>
                  <path d="M6 7h12l-1 13H7L6 7Z" strokeLinejoin="round" />
                  <path d="M9 7a3 3 0 0 1 6 0" strokeLinecap="round" />
                </svg>
              </div>
              <p style={{ fontSize: 13, color: "rgba(239,228,220,0.72)", marginBottom: 28 }}>
                Belum ada produk di keranjang.
              </p>
              <Link
                href="/koleksi"
                style={{
                  fontSize: 9,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "var(--color-accent)",
                  border: "1px solid rgba(203,180,167,0.3)",
                  padding: "12px 28px",
                  transition: "all 0.2s ease",
                }}
              >
                Lihat Koleksi
              </Link>
            </div>
          )}

          {/* item list */}
          {mounted && items.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {items.map((item, i) => (
                <div
                  key={item.variantId}
                  style={{
                    display: "flex",
                    gap: 20,
                    padding: "24px 0",
                    borderBottom: "1px solid rgba(203,180,167,0.07)",
                    borderTop: i === 0 ? "1px solid rgba(203,180,167,0.07)" : "none",
                  }}
                >
                  {/* image */}
                  <div style={{ width: 88, height: 110, flexShrink: 0, position: "relative", overflow: "hidden", background: "#5C2230" }}>
                    {item.imageUrl && (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        sizes="100px"
                        className="object-cover"
                        style={{ filter: "brightness(0.9)" }}
                      />
                    )}
                  </div>

                  {/* info */}
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 7, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(203,180,167,0.78)", marginBottom: 6 }}>
                        {item.code}
                      </div>
                      <div style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(16px,2vw,20px)", color: "#EFE4DC", lineHeight: 1.2, marginBottom: 8 }}>
                        {item.name}
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {item.size && (
                          <span style={{ fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(239,228,220,0.78)", border: "1px solid rgba(239,228,220,0.25)", padding: "3px 10px" }}>
                            {item.size}
                          </span>
                        )}
                        {item.color && (
                          <span style={{ fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(239,228,220,0.78)", border: "1px solid rgba(239,228,220,0.25)", padding: "3px 10px" }}>
                            {item.color}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* qty + price */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <button
                          onClick={() => handleUpdateQty(item.variantId, item.quantity - 1)}
                          style={{ width: 28, height: 28, border: "1px solid rgba(203,180,167,0.35)", color: "rgba(239,228,220,0.82)", background: "transparent", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}
                        >−</button>
                        <span style={{ fontSize: 15, color: "#EFE4DC", minWidth: 20, textAlign: "center" }}>{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQty(item.variantId, item.quantity + 1)}
                          style={{ width: 28, height: 28, border: "1px solid rgba(203,180,167,0.35)", color: "rgba(239,228,220,0.82)", background: "transparent", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}
                        >+</button>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "clamp(14px,1.6vw,18px)", color: "var(--color-accent)", fontWeight: 300 }}>
                            {rupiah(item.price * item.quantity)}
                          </div>
                          {item.quantity > 1 && (
                            <div style={{ fontSize: 10, color: "rgba(239,228,220,0.62)", marginTop: 2 }}>
                              {rupiah(item.price)} / pcs
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => handleRemove(item.variantId)}
                          style={{ color: "rgba(239,228,220,0.55)", background: "transparent", border: "none", cursor: "pointer", transition: "color 0.2s ease", padding: 4 }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(210,80,80,0.85)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(239,228,220,0.55)"; }}
                          aria-label="Hapus"
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
                            <line x1="1" y1="1" x2="13" y2="13" />
                            <line x1="13" y1="1" x2="1" y2="13" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* summary */}
              <div style={{ paddingTop: 32, marginTop: 8 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 340, marginLeft: "auto" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <span style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(239,228,220,0.78)" }}>
                      Subtotal ({totalQty} item)
                    </span>
                    <span style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(20px,2.4vw,28px)", color: "#EFE4DC" }}>
                      {rupiah(total)}
                    </span>
                  </div>

                  <div style={{ height: 1, background: "rgba(203,180,167,0.08)", margin: "8px 0" }} />

                  <p style={{ fontSize: 11, color: "rgba(239,228,220,0.65)", lineHeight: 1.7, marginBottom: 12 }}>
                    Ongkos kirim dan detail pembayaran akan dikonfirmasi setelah checkout via WhatsApp.
                  </p>

                  <button
                    onClick={() => setShowCheckout(true)}
                    style={{
                      width: "100%",
                      padding: "16px 24px",
                      border: "1px solid rgba(165,106,108,0.55)",
                      color: "#EFE4DC",
                      background: "rgba(165,106,108,0.12)",
                      fontSize: 9,
                      letterSpacing: "0.3em",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      transition: "background 0.3s ease, box-shadow 0.3s ease",
                    }}
                    onMouseEnter={(e) => { const t = e.currentTarget; t.style.background = "rgba(165,106,108,0.26)"; t.style.boxShadow = "0 0 28px rgba(165,106,108,0.3)"; }}
                    onMouseLeave={(e) => { const t = e.currentTarget; t.style.background = "rgba(165,106,108,0.12)"; t.style.boxShadow = "none"; }}
                  >
                    Lanjut Checkout
                  </button>

                  <Link
                    href="/koleksi"
                    style={{
                      display: "block",
                      textAlign: "center",
                      fontSize: 8,
                      letterSpacing: "0.28em",
                      textTransform: "uppercase",
                      color: "rgba(203,180,167,0.72)",
                      paddingTop: 12,
                      transition: "color 0.2s ease",
                    }}
                  >
                    ← Lanjut Belanja
                  </Link>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
      <Footer />

      {showCheckout && (
        <CheckoutModal onClose={() => { setShowCheckout(false); setItems(getCart()); }} />
      )}
    </>
  );
}
