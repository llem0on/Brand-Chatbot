"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import { useTilt } from "@/hooks/useTilt";
import type { Product } from "@/lib/types";
import ProductCinema from "./ProductCinema";
import CartModal from "./CartModal";
import { useTheme } from "@/lib/theme";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

// ── helpers ────────────────────────────────────────────────────────────────

function parseImages(url: string): string[] {
  if (!url) return [];
  try {
    const a = JSON.parse(url);
    if (Array.isArray(a)) return a.filter(Boolean);
  } catch {}
  return [url];
}

function splitCSV(s: string): string[] {
  return s ? s.split(/[,、]/).map((v) => v.trim()).filter(Boolean) : [];
}

function rupiah(n: number) {
  return "Rp" + n.toLocaleString("id-ID");
}

// ── types ──────────────────────────────────────────────────────────────────

type Filters = {
  genders: Set<string>;
  materials: Set<string>;
  sizes: Set<string>;
  colors: Set<string>;
  categories: Set<string>;
};

type CartDefaults = { size?: string; color?: string; qty?: number };

function emptyFilters(): Filters {
  return {
    genders: new Set(),
    materials: new Set(),
    sizes: new Set(),
    colors: new Set(),
    categories: new Set(),
  };
}

// ── HeroCard ───────────────────────────────────────────────────────────────

function HeroCard({
  product,
  highlighted,
  onDetail,
  onBuy,
}: {
  product: Product;
  highlighted: boolean;
  onDetail: () => void;
  onBuy: (e: React.MouseEvent) => void;
}) {
  const { ref, onMouseMove, onMouseLeave } = useTilt<HTMLDivElement>();
  const [hovered, setHovered] = useState(false);
  const { theme } = useTheme();
  const isLight = theme === "light";
  const image = parseImages(product.image_url)[0] ?? null;
  const colors = splitCSV(product.colors);

  const shadow = isLight
    ? highlighted
      ? "0 0 0 1px rgba(42,36,34,0.5), 0 0 42px rgba(42,36,34,0.2), 0 24px 60px rgba(75,29,36,0.2)"
      : hovered
      ? "0 0 0 1px rgba(42,36,34,0.3), 0 0 28px rgba(75,29,36,0.15), 0 16px 40px rgba(42,36,34,0.15)"
      : "0 0 0 1px rgba(42,36,34,0.12), 0 8px 24px rgba(42,36,34,0.1)"
    : highlighted
    ? "0 0 0 1px rgba(200,183,158,0.9), 0 0 42px rgba(168,154,140,0.5), 0 0 100px rgba(168,154,140,0.18), 0 24px 60px rgba(0,0,0,0.7)"
    : hovered
    ? "0 0 0 1px rgba(200,183,158,0.5), 0 0 40px rgba(200,183,158,0.4), 0 0 16px rgba(168,154,140,0.3), 0 16px 40px rgba(0,0,0,0.55)"
    : "0 0 0 1px rgba(200,183,158,0.25), 0 8px 24px rgba(0,0,0,0.5)";

  return (
    <div
      ref={ref}
      onMouseMove={(e) => { onMouseMove(e); setHovered(true); }}
      onMouseLeave={() => { onMouseLeave(); setHovered(false); }}
      onClick={onDetail}
      className="relative will-change-transform cursor-pointer select-none"
      style={{ transition: "box-shadow 0.35s ease", boxShadow: shadow }}
    >
      <div className="relative overflow-hidden bg-surface">

        {/* selected badge */}
        {highlighted && (
          <div className="absolute top-0 left-0 right-0 z-20 flex justify-center">
            <span className="bg-accent-strong text-ink text-[8px] tracking-[0.28em] uppercase px-3 py-0.5">
              SELECTED
            </span>
          </div>
        )}

        {/* image */}
        <div className="aspect-[3/4] relative overflow-hidden">
          {image ? (
            <Image
              src={image}
              alt={product.name}
              fill
              sizes="(min-width:1280px) 22vw,(min-width:768px) 30vw,50vw"
              className="object-cover"
              style={{
                transition: "transform 0.65s cubic-bezier(0.25,0.46,0.45,0.94), filter 0.35s ease",
                transform: hovered || highlighted ? "scale(1.07)" : "scale(1)",
                filter:
                  highlighted
                    ? "brightness(1.1) saturate(1.15)"
                    : hovered
                    ? "brightness(0.98)"
                    : "brightness(0.82)",
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: "var(--color-surface)" }}>
              <span className="text-[9px] tracking-widest uppercase" style={{ color: "color-mix(in srgb, var(--color-ink) 30%, transparent)" }}>No Image</span>
            </div>
          )}

          {/* scanline */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.04) 2px,rgba(0,0,0,0.04) 4px)",
            }}
          />

          {/* bottom gradient */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: isLight
                ? "linear-gradient(to top,rgba(239,228,220,0.92) 0%,rgba(239,228,220,0.2) 22%,transparent 48%)"
                : "linear-gradient(to top,rgba(75,29,36,0.92) 0%,rgba(75,29,36,0.18) 22%,transparent 48%)",
              opacity: hovered || highlighted ? 1 : 0.75,
              transition: "opacity 0.35s ease",
            }}
          />

          {/* info strip */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <div
              style={{
                opacity: hovered || highlighted ? 1 : 0,
                transform: hovered || highlighted ? "translateY(0)" : "translateY(4px)",
                transition: "opacity 0.3s ease, transform 0.3s ease",
              }}
            >
              <div
                className="text-[7px] tracking-[0.25em] uppercase mb-0.5"
                style={{ color: isLight ? "rgba(42,36,34,0.6)" : "rgba(200,183,158,0.8)" }}
              >
                {product.code}
              </div>
            </div>
            <div className="font-serif text-[15px] leading-snug text-ink">{product.name}</div>
            <div className="text-accent text-xs mt-1 font-medium tracking-wide">
              {rupiah(product.price)}
            </div>
            <div
              className="flex flex-wrap gap-1 mt-1.5"
              style={{
                opacity: hovered || highlighted ? 1 : 0,
                transition: "opacity 0.3s ease 0.05s",
              }}
            >
              {colors.slice(0, 3).map((c) => (
                <span
                  key={c}
                  className="text-[7px] tracking-widest uppercase border px-1.5 py-0.5"
                  style={{
                    color: isLight ? "rgba(42,36,34,0.72)" : "rgba(252,250,246,0.65)",
                    borderColor: isLight ? "rgba(42,36,34,0.25)" : "rgba(252,250,246,0.2)",
                  }}
                >
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* BUY button (hover only) */}
          <div
            className="absolute left-0 right-0 flex gap-2 px-3"
            style={{
              bottom: hovered ? 108 : 80,
              opacity: hovered ? 1 : 0,
              transition: "opacity 0.25s ease, bottom 0.3s ease",
              pointerEvents: hovered ? "auto" : "none",
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBuy(e);
              }}
              className="flex-1 text-center text-[8px] tracking-[0.25em] uppercase py-2"
              style={{
                border: isLight ? "1px solid rgba(42,36,34,0.5)" : "1px solid rgba(168,154,140,0.55)",
                color: isLight ? "#4B1D24" : "#FCFAF6",
                background: isLight ? "rgba(75,29,36,0.1)" : "rgba(168,154,140,0.25)",
                backdropFilter: "blur(6px)",
                transition: "background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
              }}
              onMouseEnter={(e) => {
                const t = e.currentTarget as HTMLButtonElement;
                t.style.background = isLight ? "rgba(124,42,53,0.85)" : "rgba(124,42,53,0.9)";
                t.style.borderColor = isLight ? "rgba(42,36,34,1)" : "rgba(168,154,140,1)";
                t.style.color = "#FCFAF6";
                t.style.boxShadow = "0 0 18px rgba(168,154,140,0.5)";
              }}
              onMouseLeave={(e) => {
                const t = e.currentTarget as HTMLButtonElement;
                t.style.background = isLight ? "rgba(75,29,36,0.1)" : "rgba(168,154,140,0.25)";
                t.style.borderColor = isLight ? "rgba(42,36,34,0.5)" : "rgba(168,154,140,0.55)";
                t.style.color = isLight ? "#4B1D24" : "#FCFAF6";
                t.style.boxShadow = "none";
              }}
            >
              Beli
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDetail();
              }}
              className="flex-1 text-center text-[8px] tracking-[0.25em] uppercase py-2"
              style={{
                border: isLight ? "1px solid rgba(42,36,34,0.25)" : "1px solid rgba(200,183,158,0.25)",
                color: isLight ? "rgba(42,36,34,0.72)" : "rgba(252,250,246,0.72)",
                background: isLight ? "rgba(239,228,220,0.6)" : "rgba(75,29,36,0.55)",
                backdropFilter: "blur(6px)",
                transition: "background 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease",
              }}
              onMouseEnter={(e) => {
                const t = e.currentTarget as HTMLButtonElement;
                t.style.background = isLight ? "rgba(42,36,34,0.88)" : "rgba(75,29,36,0.92)";
                t.style.borderColor = isLight ? "rgba(42,36,34,0.7)" : "rgba(200,183,158,0.7)";
                t.style.color = "#FCFAF6";
                t.style.boxShadow = isLight ? "0 0 14px rgba(42,36,34,0.6)" : "0 0 14px rgba(75,29,36,0.6)";
              }}
              onMouseLeave={(e) => {
                const t = e.currentTarget as HTMLButtonElement;
                t.style.background = isLight ? "rgba(239,228,220,0.6)" : "rgba(75,29,36,0.55)";
                t.style.borderColor = isLight ? "rgba(42,36,34,0.25)" : "rgba(200,183,158,0.25)";
                t.style.color = isLight ? "rgba(42,36,34,0.72)" : "rgba(252,250,246,0.72)";
                t.style.boxShadow = "none";
              }}
            >
              Detail
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── FilterSidebar ──────────────────────────────────────────────────────────

function FilterSidebar({
  products,
  filters,
  onChange,
}: {
  products: Product[];
  filters: Filters;
  onChange: (f: Filters) => void;
}) {
  const allGenders = [...new Set(products.map((p) => p.gender).filter(Boolean))];
  const allMaterials = [...new Set(products.map((p) => p.material).filter(Boolean))];
  const allSizes = [...new Set(products.flatMap((p) => splitCSV(p.sizes)))];
  const allColors = [...new Set(products.flatMap((p) => splitCSV(p.colors)))];
  const allCategories = [
    ...new Set(products.map((p) => p.category?.name).filter(Boolean)),
  ] as string[];

  const { theme } = useTheme();
  const isLight = theme === "light";
  const hasActive = Object.values(filters).some((s) => s.size > 0);

  function toggle(field: keyof Filters, value: string) {
    const next = new Set(filters[field]);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange({ ...filters, [field]: next });
  }

  const sections = (
    [
      { key: "categories" as const, label: "Kategori", options: allCategories },
      { key: "genders" as const, label: "Gender", options: allGenders },
      { key: "materials" as const, label: "Material", options: allMaterials },
      { key: "sizes" as const, label: "Ukuran", options: allSizes },
      { key: "colors" as const, label: "Warna", options: allColors },
    ] as { key: keyof Filters; label: string; options: string[] }[]
  ).filter((s) => s.options.length > 0);

  return (
    <aside className="w-52 flex-shrink-0 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <span
          className="text-[9px] tracking-[0.38em] uppercase font-semibold"
          style={{ color: isLight ? "var(--color-ink)" : "#C8B79E" }}
        >
          Filter
        </span>
        {hasActive && (
          <button
            onClick={() => onChange(emptyFilters())}
            className="text-[8px] tracking-wider uppercase transition-colors"
            style={{ color: isLight ? "rgba(42,36,34,0.55)" : "rgba(200,183,158,0.7)" }}
          >
            Reset
          </button>
        )}
      </div>

      {sections.map(({ key, label, options }) => (
        <div key={key}>
          <div
            className="text-[8px] tracking-[0.3em] uppercase mb-3 pb-2 font-semibold"
            style={{
              color: isLight ? "rgba(42,36,34,0.65)" : "rgba(200,183,158,0.85)",
              borderBottom: isLight ? "2px solid rgba(42,36,34,0.15)" : "2px solid rgba(200,183,158,0.35)",
            }}
          >
            {label}
          </div>
          <div className="flex flex-col gap-2.5">
            {options.map((opt) => {
              const checked = filters[key].has(opt);
              return (
                <label key={opt} className="flex items-center gap-2.5 cursor-pointer">
                  <div
                    className="w-3.5 h-3.5 flex-shrink-0 flex items-center justify-center transition-all duration-200"
                    style={{
                      border: checked
                        ? isLight ? "1px solid rgba(42,36,34,0.8)" : "1px solid rgba(200,183,158,0.85)"
                        : isLight ? "1px solid rgba(42,36,34,0.3)" : "1px solid rgba(200,183,158,0.5)",
                      background: checked ? (isLight ? "rgba(42,36,34,0.12)" : "rgba(200,183,158,0.18)") : "transparent",
                      boxShadow: checked ? "0 0 6px rgba(168,154,140,0.25)" : "none",
                    }}
                  >
                    {checked && (
                      <div className="w-1.5 h-1.5" style={{ background: isLight ? "#4B1D24" : "#C8B79E" }} />
                    )}
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={checked}
                    onChange={() => toggle(key, opt)}
                  />
                  <span
                    className="text-[13px] tracking-wide transition-colors duration-200"
                    style={{
                      color: checked
                        ? isLight ? "#4B1D24" : "#C8B79E"
                        : isLight ? "rgba(42,36,34,0.75)" : "rgba(252,250,246,0.82)",
                    }}
                  >
                    {opt}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </aside>
  );
}

// ── KoleksiPage ────────────────────────────────────────────────────────────

export default function KoleksiPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [cinemaProduct, setCinemaProduct] = useState<Product | null>(null);
  const [cartProduct, setCartProduct] = useState<Product | null>(null);
  const [cartDefaults, setCartDefaults] = useState<CartDefaults>({});

  const [filters, setFilters] = useState<Filters>(emptyFilters());

  useEffect(() => {
    fetch(`${API}/api/products`)
      .then((r) => r.json())
      .then((data: unknown) => {
        setProducts(Array.isArray(data) ? (data as Product[]) : []);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = products.filter((p) => {
    const pSizes = splitCSV(p.sizes);
    const pColors = splitCSV(p.colors);
    if (filters.genders.size && !filters.genders.has(p.gender)) return false;
    if (filters.materials.size && !filters.materials.has(p.material)) return false;
    if (filters.sizes.size && !pSizes.some((s) => filters.sizes.has(s))) return false;
    if (filters.colors.size && !pColors.some((c) => filters.colors.has(c))) return false;
    if (filters.categories.size && !filters.categories.has(p.category?.name ?? "")) return false;
    return true;
  });

  const handleCinemaBuy = useCallback(
    (size: string, color: string, qty: number) => {
      if (!cinemaProduct) return;
      setCartDefaults({ size, color, qty });
      setCartProduct(cinemaProduct);
      setCinemaProduct(null);
    },
    [cinemaProduct]
  );

  const handleCardBuy = useCallback((product: Product) => {
    setCartDefaults({});
    setCartProduct(product);
  }, []);

  return (
    <>
      <Navbar />

      <main
        className="min-h-screen pt-28 pb-24 px-5 md:px-8"
        style={{
          backgroundImage: "radial-gradient(var(--color-border) 0.5px, transparent 0.5px)",
          backgroundSize: "36px 36px",
        }}
      >
        <div className="mx-auto max-w-7xl">
          {/* header */}
          <div className="mb-10">
            <div
              className="text-[8px] tracking-[0.45em] uppercase mb-3"
              style={{ color: "var(--color-muted)" }}
            >
              {loading ? "Memuat koleksi..." : `${filteredProducts.length} item tersedia`}
            </div>
            <div className="flex items-end gap-4">
              <h1 className="font-serif text-4xl md:text-5xl text-ink leading-none">
                Pilih Koleksi
              </h1>
              <div
                className="mb-1 text-[8px] tracking-[0.3em] uppercase hidden md:block"
                style={{ color: isLight ? "rgba(42,36,34,0.55)" : "rgba(252,250,246,0.72)" }}
              >
                — select your character
              </div>
            </div>
            <div
              className="mt-3 h-px max-w-xs"
              style={{
                background: isLight
                  ? "linear-gradient(to right, rgba(42,36,34,0.3), transparent)"
                  : "linear-gradient(to right, rgba(200,183,158,0.5), transparent)",
              }}
            />
          </div>

          <div className="flex gap-8 md:gap-12 items-start">
            {/* filter sidebar */}
            {!loading && products.length > 0 && (
              <div className="hidden lg:block sticky top-24">
                <FilterSidebar
                  products={products}
                  filters={filters}
                  onChange={setFilters}
                />
              </div>
            )}

            {/* product grid */}
            <div className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center h-72">
                  <div
                    className="text-[9px] tracking-[0.38em] uppercase animate-pulse"
                    style={{ color: isLight ? "rgba(42,36,34,0.55)" : "rgba(200,183,158,0.7)" }}
                  >
                    Memuat...
                  </div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-72 gap-3">
                  <div
                    className="text-[9px] tracking-[0.3em] uppercase"
                    style={{ color: isLight ? "rgba(42,36,34,0.55)" : "rgba(252,250,246,0.65)" }}
                  >
                    Tidak ada produk ditemukan
                  </div>
                  {Object.values(filters).some((s) => s.size > 0) && (
                    <button
                      onClick={() => setFilters(emptyFilters())}
                      className="text-[9px] tracking-widest uppercase hover:text-accent transition-colors"
                      style={{ color: isLight ? "rgba(42,36,34,0.38)" : "rgba(200,183,158,0.4)" }}
                    >
                      Reset Filter
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
                  {filteredProducts.map((product) => (
                    <HeroCard
                      key={product.id}
                      product={product}
                      highlighted={cinemaProduct?.id === product.id}
                      onDetail={() =>
                        setCinemaProduct(
                          cinemaProduct?.id === product.id ? null : product
                        )
                      }
                      onBuy={() => handleCardBuy(product)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* cinema overlay */}
      {cinemaProduct && (
        <ProductCinema
          product={cinemaProduct}
          onBuy={handleCinemaBuy}
          onClose={() => setCinemaProduct(null)}
        />
      )}

      {/* cart modal */}
      {cartProduct && (
        <CartModal
          product={cartProduct}
          initialSize={cartDefaults.size}
          initialColor={cartDefaults.color}
          initialQty={cartDefaults.qty}
          onClose={() => setCartProduct(null)}
        />
      )}
    </>
  );
}
