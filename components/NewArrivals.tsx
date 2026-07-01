"use client";

import type { FC } from "react";
import { useScrollFadeIn } from "@/hooks/useScrollFadeIn";
import { useTheme } from "@/lib/theme";
import { useLocale } from "@/lib/locale";

type JournalItem = {
  catKey: number;
  date: string;
  titleKey: number;
  Svg: FC<{ accent: string }>;
};

const JOURNAL: JournalItem[] = [
  {
    catKey: 1, date: "04 / 2026", titleKey: 1,
    Svg: ({ accent }) => (
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%" }}>
        <g fill="none" stroke={accent} strokeWidth="1">
          <rect x="120" y="70" width="160" height="160"/>
          <circle cx="200" cy="150" r="50"/>
        </g>
      </svg>
    ),
  },
  {
    catKey: 2, date: "03 / 2026", titleKey: 2,
    Svg: ({ accent }) => (
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%" }}>
        <g fill="none" stroke={accent} strokeWidth="1">
          <path d="M40 110 L360 70 L360 190 L40 230 Z"/>
          <path d="M40 110 L200 150 L360 70"/>
          <path d="M200 150 L200 300"/>
        </g>
      </svg>
    ),
  },
  {
    catKey: 3, date: "02 / 2026", titleKey: 3,
    Svg: ({ accent }) => (
      <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" style={{ width: "100%", height: "100%" }}>
        <g fill="none" stroke={accent} strokeWidth="1">
          <path d="M80 40 C 160 120 240 120 320 40"/>
          <path d="M80 120 C 160 200 240 200 320 120"/>
          <path d="M80 200 C 160 280 240 280 320 200"/>
        </g>
      </svg>
    ),
  },
];

export default function NewArrivals() {
  const ref = useScrollFadeIn<HTMLElement>();
  const { theme } = useTheme();
  const { t } = useLocale();
  const accent = theme === "light" ? "#321318" : "#D9B88A";

  const cats = [t.journalCat1, t.journalCat2, t.journalCat3];
  const titles = [t.journalTitle1, t.journalTitle2, t.journalTitle3];

  return (
    <section
      ref={ref}
      id="journal"
      className="fade-in-up"
      style={{ padding: "110px 0", background: "color-mix(in srgb, var(--color-bg) 86%, transparent)" }}
    >
      <div style={{ maxWidth: 1380, margin: "0 auto", padding: "0 40px" }}>

        <div className="flex items-end justify-between flex-wrap" style={{ marginBottom: 64, gap: 30 }}>
          <h2 style={{ fontFamily: "var(--font-fraunces, serif)", fontWeight: 300, fontSize: "clamp(2.2rem, 5vw, 4rem)", letterSpacing: "-0.02em", lineHeight: 1, color: "var(--color-ink)" }}>
            {t.journalHeading}
          </h2>
          <div style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--color-muted)", textAlign: "right", lineHeight: 1.9, whiteSpace: "pre-line" }}>
            {t.journalSub}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 26 }}>
          {JOURNAL.map((j) => {
            const { Svg } = j;
            return (
              <article key={j.titleKey} className="group" style={{ cursor: "pointer" }}>
                <div style={{ aspectRatio: "4/3", border: "0.5px solid var(--color-border)", overflow: "hidden", background: "var(--color-surface)" }}>
                  <Svg accent={accent} />
                </div>
                <div style={{ display: "flex", gap: 14, marginTop: 16, fontSize: 10, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--color-muted)" }}>
                  <span>{cats[j.catKey - 1]}</span><span>·</span><span>{j.date}</span>
                </div>
                <h3 style={{ fontFamily: "var(--font-fraunces, serif)", fontWeight: 300, fontSize: "clamp(1.3rem, 2.2vw, 1.7rem)", letterSpacing: "-0.01em", marginTop: 10, lineHeight: 1.2, color: "var(--color-ink)" }}>
                  {titles[j.titleKey - 1]}
                </h3>
                <div
                  style={{ marginTop: 14, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-muted)", display: "inline-flex", alignItems: "center", gap: 8, transition: "color .3s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.color = accent; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.color = "var(--color-muted)"; }}
                >
                  {t.readNote}{" "}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 15, height: 15 }}>
                    <path d="M5 12h14M13 6l6 6-6 6"/>
                  </svg>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
