"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "light";

interface ThemeCtx { theme: Theme; toggle: () => void; }
const Ctx = createContext<ThemeCtx>({ theme: "dark", toggle: () => {} });

const DARK: Record<string, string> = {
  "--color-bg":           "#321318",   // Garnet
  "--color-ink":          "#FCFAF6",   // Porcelain
  "--color-accent":       "#C8B79E",   // Champagne
  "--color-accent-strong":"#9B4558",   // Rose-garnet — CTA on dark bg, high contrast with cream ink
  "--color-surface":      "#5C2530",   // wine card surface
  "--color-section":      "#3A1520",   // deep section
  "--color-muted":        "#B0A090",   // muted on garnet
  "--color-border":       "#6B2A34",   // dark garnet border
  "--dot-color":          "rgba(200,183,158,0.22)", // beige dots on garnet
};

const LIGHT: Record<string, string> = {
  "--color-bg":           "#EFE4DC",   // warm cream
  "--color-ink":          "#2A2422",   // Espresso
  "--color-accent":       "#C8B79E",   // Champagne
  "--color-accent-strong":"#C8B79E",   // Champagne — CTA on light bg (soft warm)
  "--color-surface":      "#E8DAD0",   // slightly deeper cream
  "--color-section":      "#DDD0C4",   // warm oat
  "--color-muted":        "#8C7B6E",   // warm muted text
  "--color-border":       "#D0C3B5",   // warm border
  "--dot-color":          "rgba(160,150,142,0.28)", // grey dots on cream
};

function apply(theme: Theme) {
  const vars = theme === "dark" ? DARK : LIGHT;
  const root = document.documentElement;
  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
  root.setAttribute("data-theme", theme);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const saved = (localStorage.getItem("site-theme") as Theme) ?? "dark";
    setTheme(saved);
    apply(saved);
  }, []);

  function toggle() {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("site-theme", next);
      apply(next);
      return next;
    });
  }

  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>;
}

export function useTheme() { return useContext(Ctx); }
