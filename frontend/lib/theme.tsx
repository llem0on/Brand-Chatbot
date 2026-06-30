"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "dark" | "light";

interface ThemeCtx { theme: Theme; toggle: () => void; }
const Ctx = createContext<ThemeCtx>({ theme: "dark", toggle: () => {} });

const DARK: Record<string, string> = {
  "--color-bg":           "#4B1D24",
  "--color-ink":          "#EFE4DC",
  "--color-accent":       "#CBB4A7",
  "--color-accent-strong":"#A56A6C",
  "--color-surface":      "#EFE4DC",
  "--color-section":      "#3A1520",
};

const LIGHT: Record<string, string> = {
  "--color-bg":           "#EFE4DC",
  "--color-ink":          "#4B1D24",
  "--color-accent":       "#A56A6C",
  "--color-accent-strong":"#7C2A35",
  "--color-surface":      "#FDFAF7",
  "--color-section":      "#E6D9CE",
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
