"use client";

import Image from "next/image";
import { useScrollFadeIn } from "@/hooks/useScrollFadeIn";
import { categories } from "@/lib/mock-products";

export default function CategoryRow() {
  const ref = useScrollFadeIn<HTMLDivElement>();

  return (
    <section id="categories" className="py-28 bg-section">
      <div ref={ref} className="fade-in-up">
        <div className="mb-12 text-center px-6">
          <p className="text-xs tracking-[0.3em] uppercase text-accent mb-3">Telusuri</p>
          <h2 className="font-serif text-4xl md:text-5xl text-ink">Belanja per Kategori</h2>
        </div>

        <div className="flex gap-6 overflow-x-auto no-scrollbar px-6 md:px-12 snap-x snap-mandatory pb-2">
          {categories.map((cat) => (
            <a
              key={cat.id}
              href="#"
              className="group relative shrink-0 w-[78vw] sm:w-[40vw] md:w-[28vw] aspect-[4/5] overflow-hidden snap-start"
            >
              <Image
                src={cat.image}
                alt={cat.label}
                fill
                sizes="(min-width: 768px) 28vw, 78vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg/80 via-bg/10 to-transparent" />
              <span className="absolute bottom-6 left-6 font-serif text-2xl text-ink tracking-wide">
                {cat.label}
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
