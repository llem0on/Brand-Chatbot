"use client";

import { useState } from "react";
import Image from "next/image";
import type { Product } from "@/lib/types";
import { addToCart } from "@/lib/cart";
import { useTheme } from "@/lib/theme";

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
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [selSize, setSelSize] = useState(initialSize ?? sizes[0] ?? "");
  const [selColor, setSelColor] = useState(initialColor ?? colors[0] ?? "");
  const [qty, setQty] = useState(initialQty ?? 1);
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const image = parseImages(product.image_url)[0] ?? null;

  function handleAdd() {
    if (sizes.length > 0 && !selSize) { setState("error"); setErrorMsg("Pilih ukuran terlebih dahulu."); return; }
    if (colors.length > 0 && !selColor) { setState("error"); setErrorMsg("Pilih warna terlebih dahulu."); return; }

    const variant = product.variants?.find((v) => v.size === selSize && v.color === selColor);

    addToCart({
      variantId: variant?.id ?? 0,
      productId: product.id,
      quantity: qty,
      name: product.name,
      code: product.code,
      price: product.price,
      imageUrl: image ?? "",
      size: selSize,
      color: selColor,
      stock: variant?.stock ?? product.stock,
    });

    setState("success");
  }

  const chipBtn = (active: boolean): React.CSSProperties => ({
    fontSize: 10,
    letterSpacing: "0.16em",
    textTransform: "uppercase" as const,
    padding: "7px 16px",
    border: active
      ? "1px solid color-mix(in srgb, var(--color-ink) 70%, transparent)"
      : "1px solid color-mix(in srgb, var(--color-border) 80%, transparent)",
    color: active
      ? "var(--color-ink)"
      : "color-mix(in srgb, var(--color-ink) 55%, transparent)",
    background: active
      ? "color-mix(in srgb, var(--color-ink) 8%, transparent)"
      : "transparent",
    cursor: "pointer",
    transition: "all 0.2s ease",
  });

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-8"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ animation: "hero-backdrop-in 0.2s ease both" }}
    >
      {/* backdrop — blur only, pointer-events none so clicks reach outer div */}
      <div
        className="absolute inset-0"
        style={{
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          pointerEvents: "none",
        }}
      />

      {/* panel */}
      <div
        className="relative z-10 w-full max-w-lg"
        style={{
          background: "var(--color-surface)",
          border: "1px solid color-mix(in srgb, var(--color-border) 80%, transparent)",
          boxShadow: "0 8px 48px rgba(0,0,0,0.18), 0 32px 80px rgba(0,0,0,0.12)",
          animation: "hero-overlay-in 0.38s cubic-bezier(0.16,1,0.3,1) both",
        }}
      >
        {/* top bar */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderBottom: "1px solid color-mix(in srgb, var(--color-border) 50%, transparent)" }}
        >
          <span className="text-[8px] tracking-[0.35em] uppercase" style={{ color: "var(--color-muted)" }}>
            Tambah ke Keranjang
          </span>
          <button
            onClick={onClose}
            style={{ color: "color-mix(in srgb, var(--color-ink) 45%, transparent)", background: "none", border: "none", cursor: "pointer" }}
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
            <div style={{ width: 48, height: 48, borderRadius: "50%", border: "1px solid rgba(100,210,140,0.5)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 24px rgba(100,210,140,0.15)" }}>
              <svg width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="rgba(100,210,140,0.9)" strokeWidth="1.5">
                <polyline points="1,7 6,12 17,1" />
              </svg>
            </div>
            <div>
              <div className="font-serif text-xl text-ink mb-2">{product.name}</div>
              <div className="text-[11px] tracking-wider" style={{ color: "var(--color-muted)" }}>
                {selSize} / {selColor} · {qty} pcs · {rupiah(product.price * qty)}
              </div>
              <div className="text-xs mt-3" style={{ color: "rgba(100,210,140,0.8)" }}>
                Berhasil ditambahkan ke keranjang
              </div>
            </div>
            <button
              onClick={onClose}
              className="mt-2 text-[9px] tracking-[0.3em] uppercase transition-colors hover:text-accent"
              style={{ color: "var(--color-muted)", background: "none", border: "none", cursor: "pointer" }}
            >
              Tutup
            </button>
          </div>
        ) : (
          <div className="p-5 flex gap-5">
            {/* thumbnail */}
            {image && (
              <div className="flex-shrink-0 relative overflow-hidden" style={{ width: 90, height: 120 }}>
                <Image src={image} alt={product.name} fill sizes="100px" className="object-cover" style={{ filter: "brightness(0.88)" }} />
              </div>
            )}

            {/* form */}
            <div className="flex-1 flex flex-col gap-4 min-w-0">
              <div>
                <div
                  className="font-serif text-lg leading-tight"
                  style={{ color: isLight ? "#2A2422" : "#FCFAF6" }}
                >{product.name}</div>
                <div
                  className="text-sm mt-1"
                  style={{
                    color: isLight ? "#706560" : "#FCFAF6",
                    fontWeight: 600,
                  }}
                >{rupiah(product.price)}</div>
              </div>

              {/* size */}
              {sizes.length > 0 && (
                <div>
                  <div className="text-[7px] tracking-[0.3em] uppercase mb-2" style={{ color: "var(--color-muted)" }}>Ukuran</div>
                  <div className="flex flex-wrap gap-1.5">
                    {sizes.map((sz) => (
                      <button key={sz} onClick={() => { setSelSize(sz); setState("idle"); }} style={chipBtn(sz === selSize)}>{sz}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* color */}
              {colors.length > 0 && (
                <div>
                  <div className="text-[7px] tracking-[0.3em] uppercase mb-2" style={{ color: "var(--color-muted)" }}>Warna</div>
                  <div className="flex flex-wrap gap-1.5">
                    {colors.map((col) => (
                      <button key={col} onClick={() => { setSelColor(col); setState("idle"); }} style={chipBtn(col === selColor)}>{col}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* quantity */}
              <div>
                <div className="text-[7px] tracking-[0.3em] uppercase mb-2" style={{ color: "var(--color-muted)" }}>Jumlah</div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    style={{ width: 28, height: 28, border: "1px solid color-mix(in srgb, var(--color-border) 60%, transparent)", color: "color-mix(in srgb, var(--color-ink) 70%, transparent)", cursor: "pointer", background: "transparent", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}
                  >−</button>
                  <span className="text-ink text-base w-6 text-center">{qty}</span>
                  <button
                    onClick={() => setQty(qty + 1)}
                    style={{ width: 28, height: 28, border: "1px solid color-mix(in srgb, var(--color-border) 60%, transparent)", color: "color-mix(in srgb, var(--color-ink) 70%, transparent)", cursor: "pointer", background: "transparent", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}
                  >+</button>
                </div>
              </div>

              {/* error */}
              {state === "error" && (
                <div className="text-xs leading-relaxed" style={{ color: "rgba(210,100,100,0.85)" }}>{errorMsg}</div>
              )}

              {/* total + CTA */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <div>
                  <div className="text-[7px] tracking-[0.2em] uppercase mb-1" style={{ color: "var(--color-muted)" }}>Total</div>
                  <div
                    className="text-base"
                    style={{
                      color: isLight ? "#321318" : "#C8B79E",
                      fontWeight: 600,
                    }}
                  >{rupiah(product.price * qty)}</div>
                </div>
                <button
                  onClick={() => { setState("idle"); setErrorMsg(""); handleAdd(); }}
                  style={{
                    padding: "12px 28px",
                    background: "color-mix(in srgb, var(--color-ink) 10%, transparent)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    border: "1px solid color-mix(in srgb, var(--color-ink) 38%, transparent)",
                    color: isLight ? "rgba(42,36,34,0.85)" : "rgba(252,250,246,0.85)",
                    fontSize: 9,
                    letterSpacing: "0.28em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    transition: "background 0.4s ease, color 0.3s ease, box-shadow 0.35s ease, letter-spacing 0.4s ease, transform 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    const t = e.currentTarget as HTMLButtonElement;
                    t.style.background = "var(--color-ink)";
                    t.style.color = isLight ? "#FCFAF6" : "#2A2422";
                    t.style.boxShadow = isLight
                      ? "0 0 22px rgba(42,36,34,0.2), 0 6px 18px rgba(0,0,0,0.1)"
                      : "0 0 22px rgba(252,250,246,0.15), 0 6px 18px rgba(0,0,0,0.35)";
                    t.style.letterSpacing = "0.36em";
                    t.style.transform = "scale(1.02)";
                  }}
                  onMouseLeave={(e) => {
                    const t = e.currentTarget as HTMLButtonElement;
                    t.style.background = "color-mix(in srgb, var(--color-ink) 10%, transparent)";
                    t.style.color = isLight ? "rgba(42,36,34,0.85)" : "rgba(252,250,246,0.85)";
                    t.style.boxShadow = "none";
                    t.style.letterSpacing = "0.28em";
                    t.style.transform = "scale(1)";
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
