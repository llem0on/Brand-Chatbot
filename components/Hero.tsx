"use client";

import { useTheme } from "@/lib/theme";
import { useLocale } from "@/lib/locale";

export default function Hero() {
  const { theme } = useTheme();
  const { t } = useLocale();
  const accent = theme === "light" ? "#321318" : "#D9B88A";
  const accentText = theme === "light" ? "#EFE4DC" : "#321318";

  return (
    <section className="hero-section relative" style={{ height: "100%", display: "flex", alignItems: "center" }}>
      <div className="w-full mx-auto px-6 md:px-10" style={{ maxWidth: 1380, padding: "60px 40px" }}>

        <div className="flex items-center gap-4" style={{ marginBottom: 40 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: accent, flexShrink: 0 }} />
          <span style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--color-muted)" }}>
            {t.heroEdition}
          </span>
        </div>

        <h1 style={{ fontFamily: "var(--font-fraunces, serif)", fontWeight: 300, lineHeight: 0.9, letterSpacing: "-0.02em", color: "var(--color-ink)" }}>
          <span className="hero-l1" style={{ fontSize: "clamp(3rem, 11vw, 9.5rem)", display: "block" }}>the shape</span>
          <span className="hero-l2" style={{ fontSize: "clamp(3rem, 11vw, 9.5rem)", display: "block", marginLeft: "clamp(40px, 14vw, 200px)", fontStyle: "italic", color: accent }}>before</span>
          <span className="hero-l3" style={{ fontSize: "clamp(3rem, 11vw, 9.5rem)", display: "block", marginLeft: "clamp(20px, 6vw, 90px)" }}>the garment</span>
        </h1>

        <div className="flex items-end justify-between flex-wrap" style={{ marginTop: 56, gap: 40 }}>
          <p style={{ fontSize: 12.5, lineHeight: 1.7, color: "var(--color-muted)", maxWidth: 330, letterSpacing: "0.02em" }}>
            {t.heroTagline}
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="/koleksi"
              style={{ fontFamily: "var(--font-space-mono, monospace)", fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", cursor: "pointer", padding: "15px 26px", border: `1px solid ${accent}`, background: accent, color: accentText, transition: "all .3s ease" }}
              onMouseEnter={e => { const t = e.currentTarget as HTMLAnchorElement; t.style.background = "transparent"; t.style.color = "var(--color-ink)"; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = accent; el.style.color = accentText; }}
            >
              {t.heroCtaShop}
            </a>
            <a
              href="#atelier"
              style={{ fontFamily: "var(--font-space-mono, monospace)", fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", cursor: "pointer", padding: "15px 26px", border: `1px solid ${accent}`, background: "transparent", color: "var(--color-ink)", transition: "all .3s ease" }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = accent; el.style.color = accentText; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = "transparent"; el.style.color = "var(--color-ink)"; }}
            >
              {t.heroCtaFitting}
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
