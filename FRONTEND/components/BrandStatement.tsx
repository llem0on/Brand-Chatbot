"use client";

import { useScrollFadeIn } from "@/hooks/useScrollFadeIn";
import { useTheme } from "@/lib/theme";
import { useLocale } from "@/lib/locale";

export default function BrandStatement() {
  const ref = useScrollFadeIn<HTMLDivElement>();
  const { theme } = useTheme();
  const { t } = useLocale();
  const accent = theme === "light" ? "#321318" : "#D9B88A";

  return (
    <section
      id="interlude"
      style={{
        position: "relative",
        padding: "130px 0",
        borderTop: "0.5px solid var(--color-border)",
        borderBottom: "0.5px solid var(--color-border)",
      }}
    >
      <div style={{ maxWidth: 1380, margin: "0 auto", padding: "0 40px" }}>
        <div ref={ref} className="fade-in-up">
          <blockquote
            style={{
              fontFamily: "var(--font-fraunces, serif)",
              fontWeight: 300,
              fontStyle: "italic",
              fontSize: "clamp(1.6rem, 3.8vw, 3.1rem)",
              lineHeight: 1.3,
              letterSpacing: "-0.01em",
              maxWidth: 880,
              color: "var(--color-ink)",
            }}
          >
            {t.quotePart1}{" "}
            <span style={{ fontStyle: "normal", color: accent }}>{t.quoteDescribing}</span>
            {" "}{t.quotePart2}{" "}
            <span style={{ fontStyle: "normal", color: accent }}>{t.quoteProposing}</span>
            {" "}{t.quotePart3}
          </blockquote>
          <div style={{ marginTop: 30, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-muted)" }}>
            {t.quoteCaption}
          </div>
        </div>
      </div>
    </section>
  );
}
