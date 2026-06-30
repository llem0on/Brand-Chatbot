"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { Product } from "@/lib/types";
import { addToCart } from "@/lib/cart";

function splitCSV(s: string): string[] {
  return s ? s.split(/[,、]/).map((v) => v.trim()).filter(Boolean) : [];
}

function rupiah(n: number) {
  return "Rp" + n.toLocaleString("id-ID");
}

function parseImages(url: string): string[] {
  if (!url) return [];
  try {
    const a = JSON.parse(url);
    if (Array.isArray(a)) return a.filter(Boolean);
  } catch {}
  return [url];
}

type State = "idle" | "success" | "error";

export default function CartModal({
  product,
  initialSize,
  initialColor,
  initialQty,
  onClose,
}: {
  product: Product;
  initialSize?: string;
  initialColor?: string;
  initialQty?: number;
  onClose: () => void;
}) {
  const sizes = splitCSV(product.sizes);
  const colors = splitCSV(product.colors);

  const [selSize, setSelSize] = useState(initialSize ?? sizes[0] ?? "");
  const [selColor, setSelColor] = useState(initialColor ?? colors[0] ?? "");
  const [qty, setQty] = useState(initialQty ?? 1);
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const image = parseImages(product.image_url)[0] ?? null;

  // ESC to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // body scroll lock
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  function handleAdd() {
    const variant = product.variants?.find(
      (v) => v.size === selSize && v.color === selColor
    );

    if (!variant) {
      setErrorMsg(
        sizes.length > 0 || colors.length > 0
          ? `Kombinasi ukuran ${selSize} / warna ${selColor} tidak ditemukan. Coba pilihan lain.`
          : "Data varian produk tidak tersedia."
      );
      setState("error");
      return;
    }

    if (variant.stock <= 0) {
      setErrorMsg(`Stok ${selSize}/${selColor} sedang habis.`);
      setState("error");
      return;
    }

    addToCart({
      variantId: variant.id,
      productId: product.id,
      quantity: qty,
      name: product.name,
      code: product.code,
      price: product.price,
      imageUrl: parseImages(product.image_url)[0] ?? "",
      size: selSize,
      color: selColor,
      stock: variant.stock,
    });

    setState("success");
  }

  const chipBtn = (active: boolean): React.CSSProperties => ({
    fontSize: 10,
    letterSpacing: "0.16em",
    textTransform: "uppercase" as const,
    padding: "7px 16px",
    border: active ? "1px solid rgba(203,180,167,0.8)" : "1px solid rgba(203,180,167,0.12)",
    color: active ? "var(--color-accent)" : "rgba(239,228,220,0.78)",
    background: active ? "rgba(165,106,108,0.13)" : "transparent",
    boxShadow: active ? "0 0 12px rgba(165,106,108,0.2)" : "none",
    cursor: "pointer",
    transition: "all 0.2s ease",
  });

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{ animation: "hero-backdrop-in 0.2s ease both" }}
    >
      {/* blurred backdrop */}
      <div
        className="absolute inset-0"
        style={{
          backdropFilter: "blur(18px) brightness(0.35)",
          WebkitBackdropFilter: "blur(18px) brightness(0.35)",
          background: "rgba(75,29,36,0.5)",
        }}
      />

      {/* panel */}
      <div
        className="relative z-10 w-full max-w-lg"
        style={{
          background: "rgba(75,29,36,0.95)",
          border: "1px solid rgba(203,180,167,0.15)",
          boxShadow: "0 0 60px rgba(165,106,108,0.15), 0 32px 96px rgba(0,0,0,0.8)",
          backdropFilter: "blur(8px)",
          animation: "hero-overlay-in 0.38s cubic-bezier(0.16,1,0.3,1) both",
        }}
      >
        {/* top bar */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: "1px solid rgba(203,180,167,0.08)" }}
        >
          <span className="text-[8px] tracking-[0.35em] uppercase" style={{ color: "rgba(203,180,167,0.88)" }}>
            Tambah ke Keranjang
          </span>
          <button
            onClick={onClose}
            className="hover:text-accent transition-colors"
            style={{ color: "rgba(239,228,220,0.72)" }}
            aria-label="Tutup"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="1" y1="1" x2="9" y2="9" />
              <line x1="9" y1="1" x2="1" y2="9" />
            </svg>
          </button>
        </div>

        {/* SUCCESS STATE */}
        {state === "success" ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center gap-5">
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                border: "1px solid rgba(100,210,140,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 24px rgba(100,210,140,0.2)",
              }}
            >
              <svg width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="rgba(100,210,140,0.9)" strokeWidth="1.5">
                <polyline points="1,7 6,12 17,1" />
              </svg>
            </div>
            <div>
              <div className="font-serif text-xl text-ink mb-2">{product.name}</div>
              <div className="text-[11px] tracking-wider" style={{ color: "rgba(239,228,220,0.75)" }}>
                {selSize} / {selColor} · {qty} pcs · {rupiah(product.price * qty)}
              </div>
              <div className="text-xs mt-3" style={{ color: "rgba(100,210,140,0.7)" }}>
                Berhasil ditambahkan ke keranjang
              </div>
            </div>
            <button
              onClick={onClose}
              className="mt-2 text-[9px] tracking-[0.3em] uppercase hover:text-accent transition-colors"
              style={{ color: "rgba(203,180,167,0.75)" }}
            >
              Tutup
            </button>
          </div>
        ) : (
          <div className="p-5 flex gap-5">
            {/* product thumbnail */}
            {image && (
              <div className="flex-shrink-0 relative overflow-hidden" style={{ width: 90, height: 120 }}>
                <Image
                  src={image}
                  alt={product.name}
                  fill
                  sizes="100px"
                  className="object-cover"
                  style={{ filter: "brightness(0.88)" }}
                />
              </div>
            )}

            {/* form */}
            <div className="flex-1 flex flex-col gap-4 min-w-0">
              <div>
                <div className="font-serif text-lg text-ink leading-tight">{product.name}</div>
                <div className="text-accent text-sm mt-1">{rupiah(product.price)}</div>
              </div>

              {/* size */}
              {sizes.length > 0 && (
                <div>
                  <div
                    className="text-[7px] tracking-[0.3em] uppercase mb-2"
                    style={{ color: "rgba(203,180,167,0.82)" }}
                  >
                    Ukuran
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {sizes.map((sz) => (
                      <button key={sz} onClick={() => { setSelSize(sz); setState("idle"); }} style={chipBtn(sz === selSize)}>
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* color */}
              {colors.length > 0 && (
                <div>
                  <div
                    className="text-[7px] tracking-[0.3em] uppercase mb-2"
                    style={{ color: "rgba(203,180,167,0.82)" }}
                  >
                    Warna
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {colors.map((col) => (
                      <button key={col} onClick={() => { setSelColor(col); setState("idle"); }} style={chipBtn(col === selColor)}>
                        {col}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* quantity */}
              <div>
                <div
                  className="text-[7px] tracking-[0.3em] uppercase mb-2"
                  style={{ color: "rgba(203,180,167,0.82)" }}
                >
                  Jumlah
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    style={{
                      width: 28, height: 28,
                      border: "1px solid rgba(203,180,167,0.12)",
                      color: "rgba(239,228,220,0.8)",
                      cursor: "pointer", background: "transparent", fontSize: 14,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >−</button>
                  <span className="text-ink text-base w-6 text-center">{qty}</span>
                  <button
                    onClick={() => setQty(qty + 1)}
                    style={{
                      width: 28, height: 28,
                      border: "1px solid rgba(203,180,167,0.12)",
                      color: "rgba(239,228,220,0.8)",
                      cursor: "pointer", background: "transparent", fontSize: 14,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >+</button>
                </div>
              </div>

              {/* error */}
              {state === "error" && (
                <div
                  className="text-xs leading-relaxed"
                  style={{ color: "rgba(210,100,100,0.85)" }}
                >
                  {errorMsg}
                </div>
              )}

              {/* total + CTA */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <div>
                  <div className="text-[7px] tracking-[0.2em] uppercase mb-1" style={{ color: "rgba(203,180,167,0.82)" }}>Total</div>
                  <div className="text-accent text-base font-light">{rupiah(product.price * qty)}</div>
                </div>

                <button
                  onClick={() => { setState("idle"); setErrorMsg(""); handleAdd(); }}
                  style={{
                    padding: "12px 20px",
                    border: "1px solid rgba(165,106,108,0.55)",
                    color: "#EFE4DC",
                    background: "rgba(165,106,108,0.12)",
                    fontSize: 9,
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    transition: "background 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(165,106,108,0.24)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = "rgba(165,106,108,0.12)";
                  }}
                >
                  Tambah
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
