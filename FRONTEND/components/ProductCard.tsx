"use client";

import Image from "next/image";
import { useState } from "react";
import { useTilt } from "@/hooks/useTilt";
import type { MockProduct } from "@/lib/mock-products";

type Props = {
  product: MockProduct;
  aspect?: string;
  priority?: boolean;
};

export default function ProductCard({ product, aspect = "aspect-[3/4]", priority }: Props) {
  const { ref, onMouseMove, onMouseLeave } = useTilt<HTMLDivElement>();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        onMouseMove(e);
        setHovered(true);
      }}
      onMouseLeave={() => {
        onMouseLeave();
        setHovered(false);
      }}
      className="group relative will-change-transform transition-shadow duration-300"
      style={{
        boxShadow: hovered
          ? "0 30px 60px -20px rgba(194, 99, 122, 0.45)"
          : "0 8px 24px -16px rgba(0, 0, 0, 0.5)",
      }}
    >
      <div className={`relative overflow-hidden bg-surface ${aspect}`}>
        <Image
          src={product.image}
          alt={product.name}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 33vw, 100vw"
          className={`object-cover transition-all duration-700 ${
            hovered && product.hoverImage ? "opacity-0 scale-105" : "opacity-100 scale-100"
          }`}
        />
        {product.hoverImage && (
          <Image
            src={product.hoverImage}
            alt={`${product.name} - tampilan lain`}
            fill
            sizes="(min-width: 1024px) 33vw, 100vw"
            className={`object-cover transition-all duration-700 ${
              hovered ? "opacity-100 scale-105" : "opacity-0 scale-100"
            }`}
          />
        )}

        <div
          className={`absolute inset-x-0 bottom-0 p-4 transition-all duration-300 ${
            hovered ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
          }`}
        >
          <button className="w-full border border-accent/70 bg-bg/60 backdrop-blur-sm text-ink text-[11px] tracking-[0.2em] uppercase py-3 hover:bg-accent-strong hover:border-accent-strong transition-colors">
            Quick Add
          </button>
        </div>
      </div>

      <div className="pt-4 flex items-baseline justify-between">
        <h3 className="font-serif text-lg text-ink">{product.name}</h3>
        <span className="text-accent text-sm">{product.price}</span>
      </div>
    </div>
  );
}
