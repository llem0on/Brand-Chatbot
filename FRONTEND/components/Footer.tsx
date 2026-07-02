"use client";

import { useLocale } from "@/lib/locale";

export default function Footer() {
  const { t } = useLocale();

  return (
    <footer
      style={{
        borderTop: "0.5px solid var(--color-border)",
        padding: "60px 0 40px",
        background: "var(--color-surface)",
      }}
    >
      <div style={{ maxWidth: 1380, margin: "0 auto", padding: "0 40px" }}>

        <div
          style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 30, paddingBottom: 50 }}
          className="footer-top-grid"
        >
          {/* Brand */}
          <div>
            <div style={{ fontFamily: "var(--font-fraunces, serif)", fontWeight: 300, fontSize: 40, letterSpacing: "0.12em", color: "var(--color-ink)" }}>
              brand
            </div>
            <p style={{ marginTop: 16, fontSize: 12, lineHeight: 1.7, color: "var(--color-muted)", maxWidth: 280, letterSpacing: "0.02em" }}>
              {t.footerTagline}
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-muted)", marginBottom: 16 }}>{t.footerShop}</h4>
            {["Édition 04", "Archive", "Lookbook"].map(label => (
              <a key={label} href="/koleksi"
                style={{ display: "block", fontSize: 12, color: "var(--color-muted)", padding: "6px 0", letterSpacing: "0.03em", transition: "color .2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-ink)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-muted)"; }}
              >{label}</a>
            ))}
          </div>

          {/* Atelier */}
          <div>
            <h4 style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-muted)", marginBottom: 16 }}>{t.footerAtelier}</h4>
            {["Fittings", "Care", "Shipping", "Returns"].map(label => (
              <a key={label} href="#atelier"
                style={{ display: "block", fontSize: 12, color: "var(--color-muted)", padding: "6px 0", letterSpacing: "0.03em", transition: "color .2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-ink)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-muted)"; }}
              >{label}</a>
            ))}
          </div>

          {/* Reach */}
          <div>
            <h4 style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-muted)", marginBottom: 16 }}>{t.footerReach}</h4>
            {["Instagram", "Contact", "Studio"].map(label => (
              <a key={label} href="#"
                style={{ display: "block", fontSize: 12, color: "var(--color-muted)", padding: "6px 0", letterSpacing: "0.03em", transition: "color .2s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-ink)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = "var(--color-muted)"; }}
              >{label}</a>
            ))}
          </div>
        </div>

        <div
          className="flex flex-wrap items-center justify-between"
          style={{ gap: 16, paddingTop: 26, borderTop: "0.5px solid var(--color-border)" }}
        >
          <span style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--color-muted)", textTransform: "uppercase" }}>
            © {new Date().getFullYear()} brand — atelier des hauts
          </span>
          <span style={{ fontSize: 11, letterSpacing: "0.08em", color: "var(--color-muted)", textTransform: "uppercase" }}>
            6.2088° S · 106.8456° E
          </span>
        </div>
      </div>

      <style>{`
        @media (max-width: 980px) { .footer-top-grid { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 620px) { .footer-top-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </footer>
  );
}
