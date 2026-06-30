"use client";

import { useScrollFadeIn } from "@/hooks/useScrollFadeIn";
import { featuredProducts } from "@/lib/mock-products";
import ProductCard from "./ProductCard";

export default function FeaturedCollection() {
  const ref = useScrollFadeIn<HTMLDivElement>();
  const [large, ...rest] = featuredProducts;

  return (
    <section id="featured" className="px-6 md:px-12 py-28 [perspective:1200px]">
      <div ref={ref} className="fade-in-up mx-auto max-w-7xl">
        <div className="mb-14 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-accent mb-3">Pilihan Kami</p>
          <h2 className="font-serif text-4xl md:text-5xl text-ink">Koleksi Unggulan</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <ProductCard product={large} aspect="aspect-[3/4] md:aspect-auto md:h-full" priority />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 content-start">
            {rest.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
