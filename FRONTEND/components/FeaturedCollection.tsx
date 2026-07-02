"use client";

import type { FC } from "react";
import { useScrollFadeIn } from "@/hooks/useScrollFadeIn";
import { useTheme } from "@/lib/theme";
import { useLocale } from "@/lib/locale";

type ProductShape = {
  tag: string;
  name: string;
  subKey: number;
  price: string;
  offset?: boolean;
  invert?: boolean;
  Svg: FC<{ ink: string; accent: string }>;
};

const PRODUCTS: ProductShape[] = [
  {
    tag: "n°01 · One-shoulder", name: "Suspended", subKey: 1, price: "Rp 459.000",
    Svg: ({ ink, accent }) => (
      <svg viewBox="0 0 300 380" style={{ width: "78%", height: "86%" }}>
        <path style={{ fill: accent, opacity: 0.12 }} d="M96 96 L206 70 L228 158 L212 300 L94 300 L78 158 Z"/>
        <path style={{ fill: "none", stroke: ink, strokeWidth: 1.5, strokeLinejoin: "round", strokeLinecap: "round" }} d="M96 96 L206 70 L228 158 L212 300 L94 300 L78 158 Z"/>
        <path style={{ fill: "none", stroke: ink, strokeWidth: 1.5, strokeLinejoin: "round", strokeLinecap: "round" }} d="M96 96 C124 124 156 126 178 100"/>
        <path style={{ fill: "none", stroke: ink, strokeWidth: 1.5, strokeLinejoin: "round", strokeLinecap: "round" }} d="M78 158 L62 214 M228 158 L246 214"/>
        <path style={{ fill: "none", stroke: accent, strokeWidth: 1.5, strokeLinecap: "round" }} d="M206 70 C218 58 202 50 190 62"/>
      </svg>
    ),
  },
  {
    tag: "n°02 · Cut-out", name: "Negative", subKey: 2, price: "Rp 389.000", offset: true, invert: true,
    Svg: ({ ink, accent }) => (
      <svg viewBox="0 0 300 380" style={{ width: "78%", height: "86%" }}>
        <path style={{ fill: accent, opacity: 0.14 }} d="M86 94 L214 94 L226 160 L212 300 L88 300 L74 160 Z"/>
        <path style={{ fill: "none", stroke: ink, strokeWidth: 1.5, strokeLinejoin: "round", strokeLinecap: "round" }} d="M86 94 L214 94 L226 160 L212 300 L88 300 L74 160 Z"/>
        <path style={{ fill: "none", stroke: ink, strokeWidth: 1.5, strokeLinejoin: "round", strokeLinecap: "round" }} d="M118 94 C128 118 172 118 182 94"/>
        <circle style={{ fill: "none", stroke: accent, strokeWidth: 1.5 }} cx="150" cy="186" r="42"/>
        <path style={{ fill: "none", stroke: ink, strokeWidth: 1.5, strokeLinejoin: "round", strokeLinecap: "round" }} d="M74 160 L60 214 M226 160 L240 214"/>
      </svg>
    ),
  },
  {
    tag: "n°03 · Longline", name: "The Column", subKey: 3, price: "Rp 425.000",
    Svg: ({ ink, accent }) => (
      <svg viewBox="0 0 300 380" style={{ width: "78%", height: "86%" }}>
        <path style={{ fill: accent, opacity: 0.12 }} d="M104 92 L196 92 L204 150 L198 330 L102 330 L96 150 Z"/>
        <path style={{ fill: "none", stroke: ink, strokeWidth: 1.5, strokeLinejoin: "round", strokeLinecap: "round" }} d="M104 92 L196 92 L204 150 L198 330 L102 330 L96 150 Z"/>
        <path style={{ fill: "none", stroke: ink, strokeWidth: 1.5, strokeLinejoin: "round", strokeLinecap: "round" }} d="M124 92 C136 112 164 112 176 92"/>
        <path style={{ fill: "none", stroke: accent, strokeWidth: 1.5, strokeLinecap: "round" }} d="M150 150 L150 320"/>
        <path style={{ fill: "none", stroke: ink, strokeWidth: 1.5, strokeLinejoin: "round", strokeLinecap: "round" }} d="M96 150 L84 196 M204 150 L216 196"/>
      </svg>
    ),
  },
  {
    tag: "n°04 · Asymmetric", name: "Asymmetry", subKey: 4, price: "Rp 419.000",
    Svg: ({ ink, accent }) => (
      <svg viewBox="0 0 300 380" style={{ width: "78%", height: "86%" }}>
        <path style={{ fill: accent, opacity: 0.12 }} d="M92 100 L208 78 L222 158 L196 308 L96 296 L80 158 Z"/>
        <path style={{ fill: "none", stroke: ink, strokeWidth: 1.5, strokeLinejoin: "round", strokeLinecap: "round" }} d="M92 100 L208 78 L222 158 L196 308 L96 296 L80 158 Z"/>
        <path style={{ fill: "none", stroke: ink, strokeWidth: 1.5, strokeLinejoin: "round", strokeLinecap: "round" }} d="M92 100 C124 130 158 126 178 104"/>
        <path style={{ fill: "none", stroke: accent, strokeWidth: 1.5, strokeLinecap: "round" }} d="M150 120 L132 300"/>
        <path style={{ fill: "none", stroke: ink, strokeWidth: 1.5, strokeLinejoin: "round", strokeLinecap: "round" }} d="M80 158 L66 210 M222 158 L238 210"/>
      </svg>
    ),
  },
  {
    tag: "n°05 · Pleated front", name: "Folded", subKey: 5, price: "Rp 445.000", offset: true, invert: true,
    Svg: ({ ink, accent }) => (
      <svg viewBox="0 0 300 380" style={{ width: "78%", height: "86%" }}>
        <path style={{ fill: accent, opacity: 0.14 }} d="M88 92 L212 92 L224 160 L210 300 L90 300 L76 160 Z"/>
        <path style={{ fill: "none", stroke: ink, strokeWidth: 1.5, strokeLinejoin: "round", strokeLinecap: "round" }} d="M88 92 L212 92 L224 160 L210 300 L90 300 L76 160 Z"/>
        <path style={{ fill: "none", stroke: ink, strokeWidth: 1.5, strokeLinejoin: "round", strokeLinecap: "round" }} d="M120 92 C130 116 170 116 180 92"/>
        <path style={{ fill: "none", stroke: accent, strokeWidth: 1.5, strokeLinecap: "round" }} d="M88 168 L212 150 M90 210 L210 192 M92 252 L208 234"/>
        <path style={{ fill: "none", stroke: ink, strokeWidth: 1.5, strokeLinejoin: "round", strokeLinecap: "round" }} d="M76 160 L62 214 M224 160 L238 214"/>
      </svg>
    ),
  },
  {
    tag: "n°06 · Layered", name: "The Veil", subKey: 6, price: "Rp 399.000",
    Svg: ({ ink, accent }) => (
      <svg viewBox="0 0 300 380" style={{ width: "78%", height: "86%" }}>
        <path style={{ fill: accent, opacity: 0.12 }} d="M90 96 C124 128 176 128 210 96 L226 300 C176 332 124 332 74 300 Z"/>
        <path style={{ fill: "none", stroke: ink, strokeWidth: 1.5, strokeLinejoin: "round", strokeLinecap: "round" }} d="M90 96 C124 128 176 128 210 96 L226 300 C176 332 124 332 74 300 Z"/>
        <path style={{ fill: "none", stroke: accent, strokeWidth: 1.5, strokeLinecap: "round" }} d="M104 130 C134 158 166 158 196 130"/>
        <path style={{ fill: "none", stroke: accent, strokeWidth: 1.5, strokeLinecap: "round", opacity: 0.7 }} d="M100 196 C134 226 166 226 200 196"/>
        <path style={{ fill: "none", stroke: accent, strokeWidth: 1.5, strokeLinecap: "round", opacity: 0.5 }} d="M96 262 C134 294 166 294 204 262"/>
      </svg>
    ),
  },
];

export default function FeaturedCollection() {
  const ref = useScrollFadeIn<HTMLElement>();
  const { theme } = useTheme();
  const { t } = useLocale();
  const accent = theme === "light" ? "#321318" : "#D9B88A";
  const accentText = theme === "light" ? "#EFE4DC" : "#321318";
  const ink = theme === "light" ? "#2A171B" : "#EFE4DC";

  const subKeys = [t.formSub1, t.formSub2, t.formSub3, t.formSub4, t.formSub5, t.formSub6];

  return (
    <section
      ref={ref}
      id="forms"
      className="fade-in-up"
      style={{ padding: "120px 0 90px", background: "color-mix(in srgb, var(--color-bg) 86%, transparent)" }}
    >
      <div style={{ maxWidth: 1380, margin: "0 auto", padding: "0 40px" }}>

        <div className="flex items-end justify-between flex-wrap" style={{ marginBottom: 64, gap: 30 }}>
          <h2 style={{ fontFamily: "var(--font-fraunces, serif)", fontWeight: 300, fontSize: "clamp(2.2rem, 5vw, 4rem)", letterSpacing: "-0.02em", lineHeight: 1, color: "var(--color-ink)" }}>
            {t.sectionForms}
          </h2>
          <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--color-muted)", textAlign: "right", lineHeight: 1.9, whiteSpace: "pre-line" }}>
            {t.formsSub}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "28px 24px" }}>
          {PRODUCTS.map((p) => {
            const { Svg } = p;
            const sub = subKeys[p.subKey - 1];
            return (
              <article key={p.name} style={{ cursor: "pointer" }}>
                <div
                  style={{ position: "relative", aspectRatio: "3/4", overflow: "hidden", border: "0.5px solid var(--color-border)", background: p.invert ? accent : undefined, display: "grid", placeItems: "center" }}
                  onMouseEnter={e => { const inner = e.currentTarget.querySelector(".card-img") as HTMLDivElement; if (inner) inner.style.transform = "scale(1.045)"; }}
                  onMouseLeave={e => { const inner = e.currentTarget.querySelector(".card-img") as HTMLDivElement; if (inner) inner.style.transform = "scale(1)"; }}
                >
                  <div className="card-img" style={{ display: "grid", placeItems: "center", width: "100%", height: "100%", transition: "transform .8s cubic-bezier(.2,.7,.2,1)" }}>
                    <Svg ink={p.invert ? accentText : ink} accent={p.invert ? accentText : accent} />
                  </div>
                  <span style={{ position: "absolute", top: 12, left: 12, zIndex: 2, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: p.invert ? accentText : "var(--color-muted)", background: p.invert ? "transparent" : "var(--color-bg)", padding: "4px 9px" }}>
                    {p.tag}
                  </span>
                </div>
                <div className="flex items-baseline justify-between" style={{ gap: 12, marginTop: 14 }}>
                  <div>
                    <div style={{ fontFamily: "var(--font-fraunces, serif)", fontWeight: 300, fontSize: 18, letterSpacing: "-0.01em", color: ink }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: "var(--color-muted)", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 3 }}>{sub}</div>
                  </div>
                  <div style={{ fontSize: 13, color: ink, whiteSpace: "nowrap" }}>{p.price}</div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
