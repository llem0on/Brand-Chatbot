"use client";

import Image from "next/image";
import { useScrollFadeIn } from "@/hooks/useScrollFadeIn";
import { categories } from "@/lib/mock-products";

export default function CategoryRow() {
  const ref = useScrollFadeIn<HTMLDivElement>();

  return (
    <section className="px-6 md:px-12 py-20">
      <div ref={ref} className="fade-in-up mx-auto max-w-7xl">

        {/* Section header */}
        <div
          className="flex items-baseline gap-5 mb-8"
          style={{ borderBottom: "1px solid color-mix(in srgb, var(--color-border) 45%, transparent)", paddingBottom: 12 }}
        >
          <span style={{ fontSize: 9, letterSpacing: "0.3em", color: "var(--color-muted)", opacity: 0.42 }}>02</span>
          <span style={{ fontSize: 8, letterSpacing: "0.4em", textTransform: "uppercase", color: "var(--color-muted)" }}>
            Belanja per Kategori
          </span>
        </div>

        {/* Asymmetric grid: 1 large left (7/12) + 2 stacked right (5/12) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">

          {/* Large panel */}
          <a
            href="/koleksi"
            className="group relative block overflow-hidden md:col-span-7"
            style={{ aspectRatio: "3/4" }}
          >
            <Image
              src={categories[0].image}
              alt={categories[0].label}
              fill
              sizes="(min-width:768px) 58vw, 100vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.62) 0%, transparent 55%)" }} />
            <span
              className="absolute top-6 left-6 font-serif select-none"
              style={{
                fontSize: "clamp(64px, 8vw, 110px)",
                color: "transparent",
                WebkitTextStroke: "1px rgba(255,255,255,0.12)",
                lineHeight: 1,
              }}
            >
              01
            </span>
            <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between">
              <span className="font-serif text-white" style={{ fontSize: "clamp(22px, 3vw, 34px)" }}>
                {categories[0].label}
              </span>
              <span className="text-white opacity-60 group-hover:opacity-100 transition-opacity"
                style={{ fontSize: 8, letterSpacing: "0.28em", textTransform: "uppercase" }}>
                Shop →
              </span>
            </div>
          </a>

          {/* Two stacked panels */}
          <div className="md:col-span-5 flex flex-col gap-3">
            {categories.slice(1).map((cat, i) => (
              <a
                key={cat.id}
                href="/koleksi"
                className="group relative block overflow-hidden flex-1"
                style={{ aspectRatio: "16/9", minHeight: 180 }}
              >
                <Image
                  src={cat.image}
                  alt={cat.label}
                  fill
                  sizes="(min-width:768px) 42vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)" }} />
                <span
                  className="absolute top-4 left-4 font-serif select-none"
                  style={{
                    fontSize: "clamp(36px, 5vw, 64px)",
                    color: "transparent",
                    WebkitTextStroke: "1px rgba(255,255,255,0.1)",
                    lineHeight: 1,
                  }}
                >
                  0{i + 2}
                </span>
                <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
                  <span className="font-serif text-xl text-white">{cat.label}</span>
                  <span className="text-white opacity-50 group-hover:opacity-100 transition-opacity"
                    style={{ fontSize: 8, letterSpacing: "0.28em", textTransform: "uppercase" }}>
                    Shop →
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
