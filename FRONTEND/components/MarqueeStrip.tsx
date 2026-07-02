"use client";

import { useTheme } from "@/lib/theme";
import { useLocale } from "@/lib/locale";

export default function MarqueeStrip() {
  const { theme } = useTheme();
  const { t } = useLocale();
  const accent = theme === "light" ? "#321318" : "#D9B88A";

  const ITEMS = [t.marqueeMade, "✦", t.marqueeCity, "✦", t.marqueeAppt, "✦", "Édition 04", "✦"];
  const content = [...ITEMS, ...ITEMS];

  return (
    <div
      aria-hidden
      style={{
        borderTop: "0.5px solid var(--color-border)",
        borderBottom: "0.5px solid var(--color-border)",
        overflow: "hidden",
        padding: "13px 0",
        background: "var(--color-bg)",
      }}
    >
      <div style={{ display: "flex", whiteSpace: "nowrap", animation: "tick 34s linear infinite" }}>
        {content.map((item, i) => (
          <span
            key={i}
            style={{
              fontSize: 11,
              letterSpacing: "0.26em",
              textTransform: "uppercase",
              color: item === "✦" ? accent : "var(--color-muted)",
              padding: "0 26px",
              fontFamily: "var(--font-space-mono, monospace)",
            }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
