"use client";

import { useState } from "react";
import Image from "next/image";
import type { Product } from "@/lib/types";
import { useTheme } from "@/lib/theme";

function rupiah(n: number) {
  return "Rp" + n.toLocaleString("id-ID");
}

function firstImage(url: string): string | null {
  if (!url) return null;
  try {
    const a = JSON.parse(url);
    if (Array.isArray(a) && a[0]) return a[0];
  } catch {}
  return url || null;
}

export default function DiscountSidebar({ products }: { products: Product[] }) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const accent = isLight ? "#321318" : "#D9B88A";
  const [paused, setPaused] = useState(false);

  const items = products
    .filter((p) => (p.discount_pct ?? 0) > 0)
    .map((p) => {
      const pct = p.discount_pct!;
      const salePrice = Math.round(p.price * (1 - pct / 100));
      return { ...p, pct, salePrice };
    });
  const loopItems = [...items, ...items];

  if (items.length === 0) return null;

  return (
    <div
      style={{
        width: 300,
        flexShrink: 0,
        borderLeft: "0.5px solid var(--color-border)",
        borderTop: "0.5px solid var(--color-border)",
        borderBottom: "0.5px solid var(--color-border)",
        background: "transparent",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* auto-scroll list */}
      <div
        style={{ flex: 1, minHeight: 0, overflow: "hidden" }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          style={{
            animation: "tickV 44s linear infinite",
            animationPlayState: paused ? "paused" : "running",
          }}
        >
          {loopItems.map((p, idx) => {
            const img = firstImage(p.image_url);
            const catName = (p as Product & { category?: { name: string } }).category?.name ?? "";
            return (
              <div
                key={`${p.id}-${idx}`}
                className="sale-item"
                style={{
                  display: "grid",
                  gridTemplateColumns: "82px 1fr",
                  gap: 14,
                  alignItems: "center",
                  padding: "14px 18px 14px 14px",
                  borderBottom: "0.5px solid var(--color-border)",
                  position: "relative",
                }}
              >
                {/* thumbnail */}
                <div
                  className="sale-thumb"
                  style={{
                    width: 82, height: 112,
                    background: "#ECE5DC",
                    border: "0.5px solid var(--color-border)",
                    overflow: "hidden",
                    position: "relative",
                    flexShrink: 0,
                  }}
                >
                  {img && (
                    <Image
                      src={img}
                      alt={p.name}
                      fill
                      sizes="82px"
                      className="object-cover"
                    />
                  )}
                </div>

                {/* info */}
                <div style={{ minWidth: 0 }}>
                  {catName && (
                    <div style={{ fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--color-muted)", marginBottom: 4, fontFamily: "var(--font-space-mono, monospace)" }}>
                      {catName}
                    </div>
                  )}
                  <div style={{ fontFamily: "var(--font-serif)", fontWeight: 400, fontSize: 15, letterSpacing: "-0.01em", lineHeight: 1.15, color: "var(--color-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {p.name}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: accent, lineHeight: 1.1 }}>{rupiah(p.salePrice)}</div>
                    <div style={{ fontSize: 10, color: "var(--color-muted)", textDecoration: "line-through", marginTop: 2 }}>{rupiah(p.price)}</div>
                  </div>
                </div>

                {/* ghost % */}
                {/* ghost % — absolute, mentok kanan */}
                <span
                  className="sale-ghost"
                  style={{
                    position: "absolute",
                    right: 5,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontFamily: "var(--font-serif)",
                    fontWeight: 400,
                    fontSize: 42,
                    lineHeight: 1,
                    color: "transparent",
                    WebkitTextStroke: `1px ${accent}`,
                    writingMode: "vertical-rl",
                    letterSpacing: "0.04em",
                    pointerEvents: "none",
                  }}
                >
                  −{p.pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
