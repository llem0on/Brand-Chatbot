"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import type { Product } from "@/lib/types";

// ── helpers ────────────────────────────────────────────────────────────────

function parseImages(url: string): string[] {
  if (!url) return [];
  try {
    const a = JSON.parse(url);
    if (Array.isArray(a)) return a.filter(Boolean);
  } catch {}
  return [url];
}

function splitCSV(s: string): string[] {
  return s ? s.split(/[,、]/).map((v) => v.trim()).filter(Boolean) : [];
}

function rupiah(n: number) {
  return "Rp" + n.toLocaleString("id-ID");
}

// ── mock data ──────────────────────────────────────────────────────────────

const MOCK = {
  materialSubtitle: "Premium Combed 30s · Tenun Lokal",
  materialDesc:
    "Serat pilihan untuk kenyamanan sepanjang hari. Breathable, anti-pilling, dan tetap lembut setelah dicuci berkali-kali.",
  materialCare: [
    "Cuci air dingin (maks 30°C)",
    "Balikkan sebelum dicuci",
    "Angin-anginkan, hindari matahari langsung",
  ],
  craftHeadline: "DIBUAT DENGAN PRESISI",
  craftSub: "Detail yang berbicara lewat ketahanan",
  craftPoints: [
    { n: "01", label: "Double-lock stitching di setiap sambungan" },
    { n: "02", label: "Flatlock seam di bahu & ketiak" },
    { n: "03", label: "Collar tape untuk kerah yang terjaga" },
    { n: "04", label: "Reinforced stress points — tahan tarik" },
  ],
  designHeadline: "ESTETIKA YANG BERANI",
  designStory:
    "Lahir dari eksplorasi bentuk yang melampaui tren sesaat. Potongan tepat, proporsi matang, detail tanpa keberlebihan.",
  designSeason: "KOLEKSI 2025",
};

// ── Flow helpers ───────────────────────────────────────────────────────────
// All transitions: opacity + blur + scale only — ZERO translate movement

// Shorthand: apply flow-in keyframe with a stagger delay to a content element
function fi(delay: number): React.CSSProperties {
  return {
    animation: `flow-in 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s both`,
  };
}

// Section label
function SLabel({ n, name, delay = 0, dark = false }: { n: number; name: string; delay?: number; dark?: boolean }) {
  const c1 = dark ? "rgba(75,29,36,0.42)" : "rgba(203,180,167,0.45)";
  const c2 = dark ? "rgba(75,29,36,0.2)" : "rgba(203,180,167,0.25)";
  const c3 = dark ? "rgba(75,29,36,0.75)" : "rgba(203,180,167,0.75)";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, ...fi(delay) }}>
      <span style={{ fontSize: 11, letterSpacing: "0.32em", textTransform: "uppercase", color: c1 }}>
        {String(n).padStart(2, "0")}
      </span>
      <div style={{ width: 36, height: 1, background: c2 }} />
      <span style={{ fontSize: 11, letterSpacing: "0.32em", textTransform: "uppercase", color: c3 }}>
        {name}
      </span>
    </div>
  );
}

// ── Scene 1: INTRO ─────────────────────────────────────────────────────────

function SceneIntro({
  product,
  img,
  mouse,
}: {
  product: Product;
  img: string | null;
  mouse: { x: number; y: number };
}) {
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* image with 3D tilt */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{
          transform: `perspective(1400px) rotateX(${-mouse.y * 2.8}deg) rotateY(${mouse.x * 2.8}deg)`,
          transition: "transform 0.75s ease",
        }}
      >
        {img ? (
          <Image
            src={img}
            alt={product.name}
            fill
            sizes="100vw"
            className="object-cover"
            priority
            style={{ filter: "brightness(0.72)", transform: "scale(1.1)", transition: "none" }}
          />
        ) : (
          <div style={{ position: "absolute", inset: 0, background: "#5C2230" }} />
        )}
        {/* left gradient */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(75,29,36,0.94) 0%, rgba(75,29,36,0.42) 52%, rgba(75,29,36,0.04) 100%)" }} />
        {/* top + bottom vignette */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(75,29,36,0.6) 0%, transparent 28%, transparent 65%, rgba(75,29,36,0.82) 100%)" }} />
        {/* scanline */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.025) 3px,rgba(0,0,0,0.025) 6px)", pointerEvents: "none" }} />
      </div>

      {/* text — counter-parallax to image tilt */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 8vw",
          transform: `translate(${mouse.x * -10}px, ${mouse.y * -10}px)`,
          transition: "transform 0.75s ease",
        }}
      >
        <SLabel n={1} name="Intro" delay={0} />

        <div style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(44px,7vw,108px)", lineHeight: 0.93, color: "#EFE4DC", marginTop: 26, maxWidth: 680, ...fi(0.08) }}>
          {product.name}
        </div>

        <div style={{ fontSize: "clamp(18px,2vw,28px)", color: "var(--color-accent)", marginTop: 20, fontWeight: 300, letterSpacing: "0.04em", ...fi(0.2) }}>
          {rupiah(product.price)}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 22, flexWrap: "wrap", ...fi(0.3) }}>
          {product.category && (
            <span style={{ fontSize: 8, letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(203,180,167,0.58)", border: "1px solid rgba(203,180,167,0.16)", padding: "5px 14px" }}>
              {product.category.name}
            </span>
          )}
          {product.gender && (
            <span style={{ fontSize: 8, letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(239,228,220,0.28)", border: "1px solid rgba(239,228,220,0.07)", padding: "5px 14px" }}>
              {product.gender}
            </span>
          )}
        </div>

        {product.code && (
          <div style={{ fontSize: 8, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(203,180,167,0.2)", marginTop: 36, ...fi(0.4) }}>
            {product.code}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Scene 2: MATERIAL ──────────────────────────────────────────────────────

function SceneMaterial({ product, img }: { product: Product; img: string | null }) {
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center" }}>
      {/* dimmed image — right */}
      <div style={{ position: "absolute", top: 0, right: 0, width: "44%", height: "100%", overflow: "hidden" }}>
        {img && (
          <Image
            src={img}
            alt={product.name}
            fill
            sizes="45vw"
            className="object-cover"
            style={{ filter: "brightness(0.22) saturate(0.5)", transform: "scale(1.08)" }}
          />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to left, rgba(239,228,220,0.1) 0%, rgba(239,228,220,0.88) 52%, #EFE4DC 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(165,106,108,0.09) 0%, transparent 65%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, padding: "0 8vw", maxWidth: 580 }}>
        <SLabel n={2} name="Material" delay={0} dark />

        <div style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(36px,5vw,72px)", lineHeight: 1.05, color: "#4B1D24", marginTop: 22, ...fi(0.08) }}>
          {product.material || "Premium Cotton"}
        </div>

        <div style={{ fontSize: 13, color: "rgba(75,29,36,0.6)", letterSpacing: "0.12em", marginTop: 8, ...fi(0.16) }}>
          {MOCK.materialSubtitle}
        </div>

        <div style={{ height: 1, background: "rgba(75,29,36,0.12)", margin: "24px 0", ...fi(0.22) }} />

        <div style={{ fontSize: 15, lineHeight: 1.9, color: "rgba(75,29,36,0.7)", maxWidth: 420, ...fi(0.26) }}>
          {MOCK.materialDesc}
        </div>

        <div style={{ marginTop: 28 }}>
          <div style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(75,29,36,0.5)", marginBottom: 16, ...fi(0.32) }}>
            ◆ Perawatan
          </div>
          {MOCK.materialCare.map((c, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 14,
                padding: "12px 0",
                borderBottom: i < MOCK.materialCare.length - 1 ? "1px solid rgba(75,29,36,0.1)" : "none",
                ...fi(0.36 + i * 0.07),
              }}
            >
              <span style={{ color: "rgba(124,42,53,0.7)", fontSize: 10, marginTop: 3, flexShrink: 0 }}>—</span>
              <span style={{ fontSize: 14, color: "rgba(75,29,36,0.72)", lineHeight: 1.7 }}>{c}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Scene 3: CRAFT ─────────────────────────────────────────────────────────

function SceneCraft({ img }: { img: string | null }) {
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center" }}>
      {/* zoomed image — left */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "38%", height: "100%", overflow: "hidden" }}>
        {img && (
          <Image
            src={img}
            alt="craft"
            fill
            sizes="40vw"
            className="object-cover"
            style={{ filter: "brightness(0.28) saturate(0.5)", transform: "scale(1.3) translateY(-8%)", transformOrigin: "center 25%" }}
          />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(239,228,220,0.1) 0%, rgba(239,228,220,0.9) 55%, #EFE4DC 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 50%, rgba(165,106,108,0.1) 0%, transparent 60%)" }} />
      </div>

      {/* content — right */}
      <div style={{ position: "relative", zIndex: 1, padding: "0 8vw 0 42%", width: "100%" }}>
        <SLabel n={3} name="Craftsmanship" delay={0} dark />

        <div style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(30px,4vw,58px)", lineHeight: 1.1, color: "#4B1D24", marginTop: 22, maxWidth: 400, ...fi(0.08) }}>
          {MOCK.craftHeadline}
        </div>

        <div style={{ fontSize: 14, color: "rgba(75,29,36,0.6)", letterSpacing: "0.1em", marginTop: 8, ...fi(0.16) }}>
          {MOCK.craftSub}
        </div>

        <div style={{ height: 1, background: "rgba(75,29,36,0.12)", margin: "24px 0", ...fi(0.22) }} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
          {MOCK.craftPoints.map((pt, i) => (
            <div
              key={i}
              style={{
                padding: "14px 0",
                borderBottom: "1px solid rgba(75,29,36,0.1)",
                ...fi(0.28 + i * 0.09),
              }}
            >
              <div style={{ fontSize: 10, letterSpacing: "0.28em", color: "rgba(75,29,36,0.5)", marginBottom: 6 }}>{pt.n}</div>
              <div style={{ fontSize: 14, lineHeight: 1.65, color: "rgba(75,29,36,0.78)" }}>{pt.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Scene 4: DESIGN ────────────────────────────────────────────────────────

function SceneDesign({ product, img }: { product: Product; img: string | null }) {
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* full bleed — very dark */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        {img && (
          <Image
            src={img}
            alt={product.name}
            fill
            sizes="100vw"
            className="object-cover"
            style={{ filter: "brightness(0.18) saturate(0.5)", transform: "scale(1.06)" }}
          />
        )}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(75,29,36,0.15) 0%, rgba(75,29,36,0.92) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 45%, rgba(165,106,108,0.16) 0%, transparent 52%)" }} />
      </div>

      {/* bg watermark number */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          fontFamily: "var(--font-serif)",
          fontSize: "clamp(180px,28vw,340px)",
          color: "rgba(239,228,220,0.018)",
          userSelect: "none",
          pointerEvents: "none",
          lineHeight: 1,
          letterSpacing: "-0.05em",
        }}
      >
        04
      </div>

      <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "0 10vw", maxWidth: 680, width: "100%" }}>
        <SLabel n={4} name="Design" delay={0} />

        <div style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(36px,6vw,84px)", lineHeight: 0.98, color: "#EFE4DC", marginTop: 24, letterSpacing: "0.02em", ...fi(0.08) }}>
          {MOCK.designHeadline}
        </div>

        <div style={{ width: 44, height: 1, background: "rgba(165,106,108,0.45)", margin: "28px auto", ...fi(0.2) }} />

        <div style={{ fontSize: "clamp(14px,1.6vw,17px)", lineHeight: 1.95, color: "rgba(239,228,220,0.65)", ...fi(0.28) }}>
          {product.description || MOCK.designStory}
        </div>

        <div style={{ marginTop: 34, ...fi(0.38) }}>
          <span style={{ fontSize: 9, letterSpacing: "0.38em", textTransform: "uppercase", color: "rgba(203,180,167,0.55)", border: "1px solid rgba(203,180,167,0.2)", padding: "7px 22px" }}>
            {MOCK.designSeason}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Scene 5: YOURS ─────────────────────────────────────────────────────────

function SceneYours({
  product,
  img,
  sizes,
  colors,
  onBuy,
}: {
  product: Product;
  img: string | null;
  sizes: string[];
  colors: string[];
  onBuy: (size: string, color: string, qty: number) => void;
}) {
  const [selSize, setSelSize] = useState(sizes[0] ?? "");
  const [selColor, setSelColor] = useState(colors[0] ?? "");
  const [qty, setQty] = useState(1);

  const stockPct = Math.min(100, Math.round((product.stock / 50) * 100));
  const stockColor =
    product.stock > 20
      ? "rgba(100,210,140,0.85)"
      : product.stock > 5
      ? "rgba(228,175,70,0.85)"
      : "rgba(210,80,80,0.85)";

  const chip = (active: boolean): React.CSSProperties => ({
    fontSize: 10,
    letterSpacing: "0.16em",
    textTransform: "uppercase" as const,
    padding: "8px 18px",
    border: active ? "1px solid rgba(75,29,36,0.7)" : "1px solid rgba(75,29,36,0.18)",
    color: active ? "#4B1D24" : "rgba(75,29,36,0.55)",
    background: active ? "rgba(75,29,36,0.08)" : "transparent",
    boxShadow: active ? "0 0 14px rgba(75,29,36,0.1)" : "none",
    cursor: "pointer",
    transition: "all 0.2s ease",
  });

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* subtle image echo */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        {img && (
          <Image
            src={img}
            alt={product.name}
            fill
            sizes="100vw"
            className="object-cover"
            style={{ filter: "brightness(0.07) saturate(0.4)", transform: "scale(1.04)" }}
          />
        )}
        <div style={{ position: "absolute", inset: 0, background: "rgba(239,228,220,0.96)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 520, padding: "0 8vw" }}>
        <SLabel n={5} name="Make It Yours" delay={0} dark />

        <div style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(30px,4vw,54px)", lineHeight: 1.1, color: "#4B1D24", marginTop: 20, ...fi(0.08) }}>
          {product.name}
        </div>

        <div style={{ fontSize: "clamp(18px,2vw,26px)", color: "#7C2A35", marginTop: 10, fontWeight: 300, ...fi(0.16) }}>
          {rupiah(product.price * qty)}
        </div>

        <div style={{ height: 1, background: "rgba(75,29,36,0.12)", margin: "20px 0", ...fi(0.22) }} />

        {sizes.length > 0 && (
          <div style={{ marginBottom: 16, ...fi(0.26) }}>
            <div style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(75,29,36,0.5)", marginBottom: 10 }}>◆ Ukuran</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {sizes.map((sz) => (
                <button key={sz} onClick={() => setSelSize(sz)} style={chip(sz === selSize)}>{sz}</button>
              ))}
            </div>
          </div>
        )}

        {colors.length > 0 && (
          <div style={{ marginBottom: 16, ...fi(0.32) }}>
            <div style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(75,29,36,0.5)", marginBottom: 10 }}>◆ Warna</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {colors.map((col) => (
                <button key={col} onClick={() => setSelColor(col)} style={chip(col === selColor)}>{col}</button>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom: 16, ...fi(0.38) }}>
          <div style={{ fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(75,29,36,0.5)", marginBottom: 10 }}>◆ Jumlah</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {(["-", "+"] as const).map((sign) => (
              <button
                key={sign}
                onClick={() => setQty(sign === "+" ? qty + 1 : Math.max(1, qty - 1))}
                style={{ width: 36, height: 36, border: "1px solid rgba(75,29,36,0.22)", color: "rgba(75,29,36,0.65)", background: "transparent", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                {sign}
              </button>
            ))}
            <span style={{ fontSize: 24, color: "#4B1D24", minWidth: 32, textAlign: "center" }}>{qty}</span>
          </div>
        </div>

        <div style={{ ...fi(0.44) }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(75,29,36,0.5)" }}>Ketersediaan</span>
            <span style={{ fontSize: 11, color: "rgba(75,29,36,0.65)" }}>{product.stock > 0 ? `${product.stock} pcs` : "HABIS"}</span>
          </div>
          <div style={{ height: 2, background: "rgba(75,29,36,0.1)", borderRadius: 2, marginBottom: 16 }}>
            <div style={{ height: "100%", width: `${stockPct}%`, background: stockColor, borderRadius: 2, boxShadow: `0 0 8px ${stockColor}` }} />
          </div>
        </div>

        <div style={{ ...fi(0.5) }}>
          <button
            onClick={() => onBuy(selSize, selColor, qty)}
            style={{
              width: "100%",
              padding: "18px 24px",
              border: "1px solid rgba(75,29,36,0.45)",
              color: "#EFE4DC",
              background: "#7C2A35",
              fontSize: 13,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "background 0.3s ease, box-shadow 0.3s ease",
            }}
            onMouseEnter={(e) => { const t = e.currentTarget; t.style.background = "#4B1D24"; t.style.boxShadow = "0 4px 24px rgba(75,29,36,0.35)"; }}
            onMouseLeave={(e) => { const t = e.currentTarget; t.style.background = "#7C2A35"; t.style.boxShadow = "none"; }}
          >
            Beli Sekarang
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Nav dots ───────────────────────────────────────────────────────────────

function NavDots({ current, total, onGo }: { current: number; total: number; onGo: (i: number) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          onClick={() => onGo(i)}
          aria-label={`Section ${i + 1}`}
          style={{
            width: 2,
            height: i === current ? 20 : 6,
            background: i === current ? "#7C2A35" : "rgba(75,29,36,0.25)",
            border: "none",
            cursor: "pointer",
            padding: 0,
            transition: "height 0.35s cubic-bezier(0.16,1,0.3,1), background 0.35s ease",
            borderRadius: 2,
            boxShadow: i === current ? "0 0 8px rgba(165,106,108,0.55)" : "none",
          }}
        />
      ))}
    </div>
  );
}

// ── ProductCinema ──────────────────────────────────────────────────────────

export default function ProductCinema({
  product,
  onBuy,
  onClose,
}: {
  product: Product;
  onBuy: (size: string, color: string, qty: number) => void;
  onClose: () => void;
}) {
  // Per-scene transition config (values for the scene you're LEAVING)
  const SCENE_CONFIG = [
    { anim: "iris-bottom",  ms: 840, ease: "cubic-bezier(0.76,0,0.24,1)", color: "radial-gradient(ellipse at 50% 110%,#7C2A35 0%,#1A0810 70%)" },
    { anim: "iris-left",    ms: 760, ease: "cubic-bezier(0.4,0,0.2,1)",   color: "radial-gradient(ellipse at -5% 50%,#CBB4A7 0%,#EFE4DC 100%)" },
    { anim: "iris-corner",  ms: 720, ease: "cubic-bezier(0.55,0,0.2,1)",  color: "radial-gradient(ellipse at 105% 0%,#A56A6C 0%,#CBB4A7 70%,#EFE4DC 100%)" },
    { anim: "scene-slash",  ms: 980, ease: "cubic-bezier(0.9,0,0.1,1)",   color: "linear-gradient(105deg,#0D0508 0%,#3A1520 50%,#4B1D24 100%)" },
    { anim: "iris-center",  ms: 740, ease: "cubic-bezier(0.6,0,0.3,1)",   color: "radial-gradient(ellipse at 50% 50%,#A56A6C 0%,#EFE4DC 100%)" },
  ];

  const [idx, setIdx] = useState(0);
  const [exiting, setExiting] = useState(false);
  const [curtain, setCurtain] = useState<{ anim: string; ms: number; ease: string; color: string; key: number } | null>(null);
  const curtainKeyRef = useRef(0);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [contentKey, setContentKey] = useState(0);
  const lockRef = useRef(false);
  const touchStartY = useRef(0);
  const TOTAL = 5;

  // Navigate: iris/slash curtain — single keyframe (in+hold+out), no remount
  const goTo = useCallback(
    (next: number) => {
      if (lockRef.current || next === idx || next < 0 || next >= TOTAL) return;
      lockRef.current = true;
      setExiting(true);

      const cfg = SCENE_CONFIG[idx];
      curtainKeyRef.current += 1;
      setCurtain({ ...cfg, key: curtainKeyRef.current });

      // swap content at 42% of animation (curtain fully expanded)
      const swapAt = Math.round(cfg.ms * 0.42);
      setTimeout(() => {
        setIdx(next);
        setContentKey((k) => k + 1);
        setExiting(false);
      }, swapAt);

      // remove curtain after animation
      setTimeout(() => {
        setCurtain(null);
        lockRef.current = false;
      }, cfg.ms + 40);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [idx]
  );

  const goNext = useCallback(() => goTo(idx + 1), [idx, goTo]);
  const goPrev = useCallback(() => goTo(idx - 1), [idx, goTo]);

  // Wheel (captures to prevent page scroll behind overlay)
  useEffect(() => {
    let acc = 0;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      acc += e.deltaY;
      if (Math.abs(acc) >= 60) {
        acc > 0 ? goNext() : goPrev();
        acc = 0;
      }
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [goNext, goPrev]);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight") { e.preventDefault(); goNext(); }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goPrev, onClose]);

  // Touch
  useEffect(() => {
    const onStart = (e: TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
    const onEnd = (e: TouchEvent) => {
      const dy = touchStartY.current - e.changedTouches[0].clientY;
      if (Math.abs(dy) > 40) dy > 0 ? goNext() : goPrev();
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchend", onEnd);
    };
  }, [goNext, goPrev]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Mouse 3D tilt — hero section only
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (idx !== 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setMouse({
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
    });
  };

  // Wrapper animation: exit = bloom-blur-out, enter = instant appear (elements do the stagger)
  const wrapperAnim: React.CSSProperties = exiting
    ? { animation: "flow-out 0.29s cubic-bezier(0.4,0,1,1) both", pointerEvents: "none" }
    : { animation: "flow-appear 0.1s ease both" };

  return (
    <div
      className="fixed inset-0 z-50"
      onMouseMove={onMouseMove}
      onMouseLeave={() => { if (idx === 0) setMouse({ x: 0, y: 0 }); }}
    >
      {/* blurred listing page behind */}
      <div
        className="absolute inset-0"
        style={{
          backdropFilter: "blur(22px) brightness(0.3) saturate(0.7)",
          WebkitBackdropFilter: "blur(22px) brightness(0.3) saturate(0.7)",
          background: "rgba(75,29,36,0.62)",
        }}
      />

      {/* solid base — prevents any flash between transitions */}
      <div className="absolute inset-0" style={{ background: "var(--color-bg)" }} />

      {/* ── Scene transition — iris / slash, one keyframe in+hold+out ── */}
      {curtain && (
        <div
          key={curtain.key}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 25,
            background: curtain.color,
            animation: `${curtain.anim} ${curtain.ms}ms ${curtain.ease} both`,
            willChange: "clip-path",
            overflow: "hidden",
          }}
        >
          {/* diagonal sheen that sweeps while curtain is open */}
          <div
            style={{
              position: "absolute",
              top: "-20%",
              left: "0",
              width: "35%",
              height: "140%",
              background: "linear-gradient(to right, transparent, rgba(255,255,255,0.09), transparent)",
              animation: `curtain-sheen ${curtain.ms * 0.65}ms ease-in-out ${curtain.ms * 0.18}ms both`,
              pointerEvents: "none",
            }}
          />
        </div>
      )}

      {/* close */}
      <button
        onClick={onClose}
        className="absolute top-5 left-6 z-30 flex items-center gap-2 hover:text-accent transition-colors"
        style={{ color: "rgba(75,29,36,0.55)" }}
        aria-label="Tutup"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4">
          <line x1="1" y1="1" x2="13" y2="13" />
          <line x1="13" y1="1" x2="1" y2="13" />
        </svg>
        <span className="text-[8px] tracking-[0.3em] uppercase hidden md:block">Tutup</span>
      </button>

      {/* section counter top-right */}
      <div
        className="absolute top-5 right-14 z-30"
        style={{ fontSize: 8, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(75,29,36,0.55)" }}
      >
        {String(idx + 1).padStart(2, "0")} / {String(TOTAL).padStart(2, "0")}
      </div>

      {/* nav dots — right edge */}
      <div className="absolute right-5 top-1/2 -translate-y-1/2 z-30">
        <NavDots current={idx} total={TOTAL} onGo={goTo} />
      </div>

      {/* ── CONTENT — keyed so remount plays fresh stagger animations ── */}
      <div
        key={contentKey}
        style={{ ...wrapperAnim, position: "absolute", inset: 0, zIndex: 10 }}
      >
        {idx === 0 && <SceneIntro product={product} img={parseImages(product.image_url)[0] ?? null} mouse={mouse} />}
        {idx === 1 && <SceneMaterial product={product} img={parseImages(product.image_url)[0] ?? null} />}
        {idx === 2 && <SceneCraft img={parseImages(product.image_url)[0] ?? null} />}
        {idx === 3 && <SceneDesign product={product} img={parseImages(product.image_url)[0] ?? null} />}
        {idx === 4 && (
          <SceneYours
            product={product}
            img={parseImages(product.image_url)[0] ?? null}
            sizes={splitCSV(product.sizes)}
            colors={splitCSV(product.colors)}
            onBuy={onBuy}
          />
        )}
      </div>

      {/* prev / next arrows — bottom center */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-6">
        <button
          onClick={goPrev}
          disabled={idx === 0 || exiting}
          style={{
            color: idx === 0 ? "rgba(75,29,36,0.15)" : "rgba(75,29,36,0.5)",
            transition: "color 0.25s ease",
            background: "transparent",
            border: "none",
            cursor: idx === 0 ? "default" : "pointer",
            padding: 8,
          }}
        >
          <svg width="14" height="8" viewBox="0 0 14 8" fill="none" stroke="currentColor" strokeWidth="1.3">
            <polyline points="13,7 7,1 1,7" />
          </svg>
        </button>

        <span style={{ fontSize: 7, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(75,29,36,0.4)" }}>
          scroll · swipe
        </span>

        <button
          onClick={goNext}
          disabled={idx === TOTAL - 1 || exiting}
          style={{
            color: idx === TOTAL - 1 ? "rgba(75,29,36,0.15)" : "rgba(75,29,36,0.5)",
            transition: "color 0.25s ease",
            background: "transparent",
            border: "none",
            cursor: idx === TOTAL - 1 ? "default" : "pointer",
            padding: 8,
          }}
        >
          <svg width="14" height="8" viewBox="0 0 14 8" fill="none" stroke="currentColor" strokeWidth="1.3">
            <polyline points="1,1 7,7 13,1" />
          </svg>
        </button>
      </div>
    </div>
  );
}
