"use client";

import { useScrollFadeIn } from "@/hooks/useScrollFadeIn";
import { useTheme } from "@/lib/theme";
import { useLocale } from "@/lib/locale";

export default function StorySection() {
  const ref1 = useScrollFadeIn<HTMLDivElement>();
  const ref2 = useScrollFadeIn<HTMLElement>();
  const ref3 = useScrollFadeIn<HTMLDivElement>();
  const { theme } = useTheme();
  const { t } = useLocale();
  const accent = theme === "light" ? "#321318" : "#D9B88A";

  const RAIL = [
    { k: t.railFounded,    v: t.railFoundedVal   },
    { k: t.railWhere,      v: t.railWhereVal      },
    { k: t.railPerEdition, v: t.railPerEditionVal },
    { k: t.railMethod,     v: t.railMethodVal     },
    { k: t.railSeen,       v: t.railSeenVal       },
  ];

  return (
    <section
      id="atelier"
      style={{ padding: "124px 0", background: "color-mix(in srgb, var(--color-bg) 86%, transparent)" }}
    >
      <div style={{ maxWidth: 1380, margin: "0 auto", padding: "0 40px" }}>

        <div ref={ref1} className="fade-in-up">
          <div className="flex items-center" style={{ gap: 14, marginBottom: 44 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: accent, flexShrink: 0 }} />
            <span style={{ fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--color-muted)" }}>
              {t.atelierEyebrow}
            </span>
            <span style={{ marginLeft: "auto", fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--color-muted)" }}>
              No. 04
            </span>
          </div>
          <p style={{ fontFamily: "var(--font-fraunces, serif)", fontWeight: 300, fontSize: "clamp(1.9rem, 4.6vw, 3.7rem)", lineHeight: 1.16, letterSpacing: "-0.02em", maxWidth: 1040, color: "var(--color-ink)" }}>
            {t.atelierLeadPre}{" "}
            <em style={{ fontStyle: "italic", color: accent }}>{t.atelierLeadHl}</em>
            {t.atelierLeadPost}
          </p>
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "0.85fr 2.15fr", gap: 64, marginTop: 76, paddingTop: 54, borderTop: "0.5px solid var(--color-border)" }}
        >
          <aside ref={ref2} className="fade-in-up" style={{ alignSelf: "start" }}>
            {RAIL.map((item, i) => (
              <div
                key={item.k}
                style={{ padding: "15px 0", borderBottom: "0.5px solid var(--color-border)", borderTop: i === 0 ? "0.5px solid var(--color-border)" : undefined }}
              >
                <div style={{ fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-muted)" }}>{item.k}</div>
                <div style={{ fontFamily: "var(--font-fraunces, serif)", fontWeight: 300, fontSize: 17, color: "var(--color-ink)", marginTop: 5, letterSpacing: "-0.01em" }}>{item.v}</div>
              </div>
            ))}
          </aside>

          <div ref={ref3} className="fade-in-up story-prose" style={{ maxWidth: 640 }}>
            <p>
              {t.prose1Pre}
              <span style={{ color: "var(--color-ink)", fontWeight: 400 }}>{t.prose1Hl}</span>
              {t.prose1Post}
            </p>
            <p>{t.prose2}</p>
            <p>
              {t.prose3Pre}
              <span style={{ color: "var(--color-ink)", fontWeight: 400 }}>{t.prose3Hl}</span>
              {t.prose3Post}
            </p>
            <div style={{ fontFamily: "var(--font-fraunces, serif)", fontStyle: "italic", fontWeight: 300, fontSize: 19, color: accent, marginTop: 8 }}>
              — atelier des hauts
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .story-prose p {
          font-family: var(--font-fraunces, serif);
          font-weight: 300;
          font-size: clamp(1.06rem, 1.55vw, 1.28rem);
          line-height: 1.62;
          color: var(--color-muted);
          margin-bottom: 1.45em;
        }
        .story-prose p:first-of-type::first-letter {
          font-family: var(--font-fraunces, serif);
          font-weight: 300;
          font-style: italic;
          font-size: 3.6em;
          line-height: 0.74;
          float: left;
          margin: 0.06em 0.1em 0 0;
          color: ${accent};
        }
      `}</style>
    </section>
  );
}
