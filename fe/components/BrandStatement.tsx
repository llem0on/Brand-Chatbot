"use client";

import { useScrollFadeIn } from "@/hooks/useScrollFadeIn";

export default function BrandStatement() {
  const ref = useScrollFadeIn<HTMLDivElement>();

  return (
    <section id="statement" className="bg-section py-32 px-6">
      <div ref={ref} className="fade-in-up mx-auto max-w-3xl text-center">
        <p className="font-serif italic text-3xl md:text-4xl leading-relaxed text-ink">
          &ldquo;Kemewahan bukan tentang seberapa banyak yang terlihat, tapi
          seberapa dalam yang terasa.&rdquo;
        </p>
        <p className="mt-8 text-sm text-ink/60 tracking-wide">
          Setiap potongan brand dirancang untuk dipakai seumur hidup, bukan
          semusim.
        </p>
      </div>
    </section>
  );
}
