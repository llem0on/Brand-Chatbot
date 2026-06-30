import Image from "next/image";
import { heroImage } from "@/lib/mock-products";

export default function Hero() {
  return (
    <section className="relative h-screen w-full overflow-hidden">
      <Image
        src={heroImage}
        alt="Editorial fashion campaign"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-bg/30 via-bg/40 to-bg" />

      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
        <p className="text-xs tracking-[0.3em] uppercase text-accent mb-6">
          Koleksi Edisi Terbatas
        </p>
        <h1 className="font-serif text-5xl sm:text-6xl md:text-7xl leading-[1.05] max-w-3xl text-ink">
          Keberanian yang
          <br />
          <span className="italic">Tertenun Diam</span>
        </h1>
        <a
          href="/koleksi"
          className="mt-10 inline-block border border-accent text-accent text-xs tracking-[0.25em] uppercase px-10 py-4 transition-colors duration-300 hover:bg-accent-strong hover:text-ink hover:border-accent-strong"
        >
          Jelajahi Koleksi
        </a>
      </div>
    </section>
  );
}
