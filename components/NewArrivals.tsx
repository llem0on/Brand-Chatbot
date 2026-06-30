"use client";

import { useScrollFadeIn } from "@/hooks/useScrollFadeIn";
import { newArrivals } from "@/lib/mock-products";
import ProductCard from "./ProductCard";

export default function NewArrivals() {
  const ref = useScrollFadeIn<HTMLDivElement>();

  return (
    <section className="px-6 md:px-12 py-28 [perspective:1200px]">
      <div ref={ref} className="fade-in-up mx-auto max-w-7xl">
        <div className="mb-14 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-accent mb-3">Baru Tiba</p>
          <h2 className="font-serif text-4xl md:text-5xl text-ink">New Arrivals</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
