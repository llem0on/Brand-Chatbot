"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import MarqueeStrip from "@/components/MarqueeStrip";
import DiscountSidebar from "./DiscountSidebar";
import { useTilt } from "@/hooks/useTilt";
import type { Product, FilterValue } from "@/lib/types";
import type { Locale } from "@/lib/locale";
import ProductCinema from "./ProductCinema";
import CartModal from "./CartModal";
import { useTheme } from "@/lib/theme";
import { useLocale } from "@/lib/locale";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

// ── filter value helpers ───────────────────────────────────────────────────

const FV_TYPE_FOR_FILTER: Record<string, string> = {
  genders: "gender",
  colors: "color",
  categories: "category",
  materials: "material",
  sizes: "size",
};

function fvLabel(filterValues: FilterValue[], filterKey: string, dbValue: string, locale: Locale): string {
  const type = FV_TYPE_FOR_FILTER[filterKey];
  if (!type) return dbValue;
  const match = filterValues.find((fv) => {
    if (fv.type !== type) return false;
    const parts = fv.value.split(",");
    return parts[1]?.trim() === dbValue; // match against Indonesian (index 1)
  });
  if (!match) return dbValue;
  const parts = match.value.split(",");
  const idx = locale === "en" ? 0 : locale === "id" ? 1 : 2;
  return parts[idx]?.trim() ?? dbValue;
}

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
  const { t } = useLocale();
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
            <span className="bg-accent-strong text-[8px] tracking-[0.28em] uppercase px-3 py-0.5" style={{ color: isLight ? "#2A2422" : "#FCFAF6" }}>
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
                    : "brightness(0.98)",
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
                : "linear-gradient(to top,rgba(75,29,36,0.75) 0%,rgba(75,29,36,0.14) 22%,transparent 44%)",
              opacity: hovered || highlighted ? 1 : 0.75,
              transition: "opacity 0.35s ease",
            }}
          />

          {/* info overlay — pure translateY, no layout-based transitions */}
          <div className="absolute inset-0 pointer-events-none">

            {/* code */}
            <div
              className="absolute left-3 right-3"
              style={{
                bottom: 70,
                opacity: hovered || highlighted ? 1 : 0,
                transform: hovered || highlighted ? "translateY(0)" : "translateY(10px)",
                transition: "opacity 0.3s ease, transform 0.44s cubic-bezier(0.16,1,0.3,1)",
              }}
            >
              <div className="text-[7px] tracking-[0.25em] uppercase" style={{ color: "rgba(20,16,14,0.75)" }}>
                {product.code}
              </div>
            </div>

            {/* name + price — slide up on hover */}
            <div
              className="absolute left-3 right-3"
              style={{
                bottom: 30,
                transform: hovered || highlighted ? "translateY(0)" : "translateY(20px)",
                transition: "transform 0.44s cubic-bezier(0.16,1,0.3,1)",
              }}
            >
              <div
                className="font-serif text-[15px] leading-snug"
                style={{
                  color: isLight ? "#2A2422" : "#FCFAF6",
                  textShadow: isLight ? "0 1px 6px rgba(239,228,220,0.9)" : "0 1px 10px rgba(0,0,0,0.7)",
                }}
              >{product.name}</div>
              {(product.discount_pct ?? 0) > 0 ? (
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style={{ background: isLight ? "#321318" : "#D9B88A", color: isLight ? "#FCFAF6" : "#1A0D0F" }}
                  >-{product.discount_pct}%</span>
                  <span
                    className="text-[11px] line-through"
                    style={{ color: isLight ? "#9C8E89" : "#4A3A35" }}
                  >{rupiah(product.price)}</span>
                  <span
                    className="text-xs tracking-wide"
                    style={{ color: isLight ? "#706560" : "#FCFAF6", fontWeight: 700 }}
                  >{rupiah(Math.round(product.price * (1 - (product.discount_pct ?? 0) / 100)))}</span>
                </div>
              ) : (
                <div
                  className="text-xs mt-0.5 tracking-wide"
                  style={{ color: isLight ? "#706560" : "#FCFAF6", fontWeight: 600 }}
                >{rupiah(product.price)}</div>
              )}
            </div>

            {/* chips — slide up from below */}
            <div
              className="absolute left-3 right-3"
              style={{
                bottom: 10,
                opacity: hovered || highlighted ? 1 : 0,
                transform: hovered || highlighted ? "translateY(0)" : "translateY(22px)",
                transition: "opacity 0.28s 0.06s ease, transform 0.44s 0.03s cubic-bezier(0.16,1,0.3,1)",
              }}
            >
              <div className="flex flex-wrap gap-1">
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

          </div>

          {/* Beli — fixed bottom-right, independent from slide */}
          <div
            className="absolute bottom-3 right-3 pointer-events-none"
            style={{
              opacity: hovered ? 1 : 0,
              transition: "opacity 0.25s ease",
              pointerEvents: hovered ? "auto" : "none",
            }}
          >
            <button
              onClick={(e) => { e.stopPropagation(); onBuy(e); }}
              className="text-[8px] uppercase"
              style={{
                padding: "8px 14px",
                letterSpacing: "0.28em",
                background: "transparent",
                backdropFilter: "blur(14px)",
                WebkitBackdropFilter: "blur(14px)",
                border: `1px solid ${isLight ? "rgba(90,80,75,0.35)" : "rgba(252,250,246,0.45)"}`,
                color: isLight ? "rgba(90,80,75,0.75)" : "rgba(252,250,246,0.88)",
                transition: "background 0.35s ease, color 0.25s ease, box-shadow 0.3s ease, border-color 0.28s ease",
              }}
              onMouseEnter={(e) => {
                const t = e.currentTarget as HTMLButtonElement;
                t.style.background = isLight ? "linear-gradient(135deg,#706560 0%,#504540 100%)" : "linear-gradient(135deg,#FCFAF6 0%,#EFE4DC 100%)";
                t.style.color = isLight ? "#FCFAF6" : "#2A2422";
                t.style.borderColor = "transparent";
                t.style.boxShadow = isLight ? "0 2px 18px rgba(80,69,64,0.25)" : "0 2px 18px rgba(252,250,246,0.16)";
              }}
              onMouseLeave={(e) => {
                const t = e.currentTarget as HTMLButtonElement;
                t.style.background = "transparent";
                t.style.color = isLight ? "rgba(90,80,75,0.75)" : "rgba(252,250,246,0.88)";
                t.style.borderColor = isLight ? "rgba(90,80,75,0.35)" : "rgba(252,250,246,0.45)";
                t.style.boxShadow = "none";
              }}
            >
              {t.buy}
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
  filterValues,
}: {
  products: Product[];
  filters: Filters;
  onChange: (f: Filters) => void;
  filterValues: FilterValue[];
}) {
  const allGenders = [...new Set(products.map((p) => p.gender).filter(Boolean))];
  const allMaterials = [...new Set(products.map((p) => p.material).filter(Boolean))];
  const allSizes = [...new Set(products.flatMap((p) => splitCSV(p.sizes)))];
  const allColors = [...new Set(products.flatMap((p) => splitCSV(p.colors)))];
  const allCategories = [
    ...new Set(products.map((p) => p.category?.name).filter(Boolean)),
  ] as string[];

  const { theme } = useTheme();
  const { t, locale } = useLocale();
  const isLight = theme === "light";
  const hasActive = Object.values(filters).some((s) => s.size > 0);

  function toggle(field: keyof Filters, value: string) {
    const already = filters[field].has(value);
    onChange({ ...filters, [field]: already ? new Set() : new Set([value]) });
  }

  const sections = (
    [
      { key: "categories" as const, label: t.filterCategory, options: allCategories },
      { key: "genders" as const, label: t.filterGender, options: allGenders },
      { key: "materials" as const, label: t.filterMaterial, options: allMaterials },
      { key: "sizes" as const, label: t.filterSize, options: allSizes },
      { key: "colors" as const, label: t.filterColor, options: allColors },
    ] as { key: keyof Filters; label: string; options: string[] }[]
  ).filter((s) => s.options.length > 0);

  return (
    <aside className="w-52 flex-shrink-0 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <span
          className="text-[9px] tracking-[0.38em] uppercase font-semibold"
          style={{ color: isLight ? "var(--color-ink)" : "#C8B79E" }}
        >
          {t.filter}
        </span>
        {hasActive && (
          <button
            onClick={() => onChange(emptyFilters())}
            className="text-[8px] tracking-wider uppercase transition-colors"
            style={{ color: isLight ? "rgba(42,36,34,0.55)" : "rgba(200,183,158,0.7)" }}
          >
            {t.reset}
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
                    className="w-3.5 h-3.5 flex-shrink-0 flex items-center justify-center rounded-full transition-all duration-200"
                    style={{
                      border: checked
                        ? isLight ? "1px solid rgba(42,36,34,0.8)" : "1px solid rgba(200,183,158,0.85)"
                        : isLight ? "1px solid rgba(42,36,34,0.3)" : "1px solid rgba(200,183,158,0.5)",
                      background: checked ? (isLight ? "rgba(42,36,34,0.08)" : "rgba(200,183,158,0.12)") : "transparent",
                      boxShadow: checked ? "0 0 6px rgba(168,154,140,0.25)" : "none",
                    }}
                  >
                    {checked && (
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: isLight ? "#321318" : "#C8B79E" }} />
                    )}
                  </div>
                  <input
                    type="radio"
                    className="hidden"
                    checked={checked}
                    onChange={() => {}}
                    onClick={() => toggle(key, opt)}
                  />
                  <span
                    className="text-[13px] tracking-wide transition-colors duration-200"
                    style={{
                      color: checked
                        ? isLight ? "#321318" : "#C8B79E"
                        : isLight ? "rgba(42,36,34,0.75)" : "rgba(252,250,246,0.82)",
                    }}
                  >
                    {fvLabel(filterValues, key, opt, locale)}
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
  const { t } = useLocale();
  const isLight = theme === "light";
  const [products, setProducts] = useState<Product[]>([]);
  const [filterValues, setFilterValues] = useState<FilterValue[]>([]);
  const [loading, setLoading] = useState(true);

  const [cinemaProduct, setCinemaProduct] = useState<Product | null>(null);
  const [cartProduct, setCartProduct] = useState<Product | null>(null);
  const [cartDefaults, setCartDefaults] = useState<CartDefaults>({});

  const [filters, setFilters] = useState<Filters>(emptyFilters());

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/products`).then((r) => r.json()),
      fetch(`${API}/api/filter-values`).then((r) => r.json()),
    ])
      .then(([products, fvs]) => {
        setProducts(Array.isArray(products) ? (products as Product[]) : []);
        setFilterValues(Array.isArray(fvs) ? (fvs as FilterValue[]) : []);
      })
      .catch(() => {})
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
      <div style={{ height: "100svh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <Navbar />

      <main
        className="pt-28 pb-8"
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "row",
          backgroundImage: "radial-gradient(var(--color-border) 0.5px, transparent 0.5px)",
          backgroundSize: "36px 36px",
        }}
      >
        {/* left: header + filter + grid */}
        <div className="flex-1 min-w-0 px-5 md:px-8" style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
          {/* header */}
          <div className="mb-10">
            <div
              className="text-[8px] tracking-[0.45em] uppercase mb-3"
              style={{ color: "var(--color-muted)" }}
            >
              {loading ? t.loading : t.itemsAvailable(filteredProducts.length)}
            </div>
            <div className="flex items-end gap-4">
              <h1 className="font-serif text-4xl md:text-5xl text-ink leading-none">
                {t.selectCollection}
              </h1>
              <div
                className="mb-1 text-[8px] tracking-[0.3em] uppercase hidden md:block"
                style={{ color: isLight ? "rgba(42,36,34,0.55)" : "rgba(252,250,246,0.72)" }}
              >
                {t.koleksiSub}
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

          <div
            className="flex gap-8 md:gap-12"
            style={{ flex: 1, minHeight: 0, overflow: "hidden", alignItems: "stretch" }}
          >
            {/* filter sidebar */}
            {!loading && products.length > 0 && (
              <div
                className="hidden lg:block theme-scrollbar"
                style={{ overflowY: "auto", height: "100%", flexShrink: 0 }}
              >
                <FilterSidebar
                    products={products}
                    filters={filters}
                    onChange={setFilters}
                    filterValues={filterValues}
                  />
              </div>
            )}

            {/* product grid */}
            <div className="flex-1 min-w-0 theme-scrollbar" style={{ overflowY: "auto", overflowX: "hidden", height: "100%" }}>
              {loading ? (
                <div className="flex items-center justify-center h-72">
                  <div
                    className="text-[9px] tracking-[0.38em] uppercase animate-pulse"
                    style={{ color: isLight ? "rgba(42,36,34,0.55)" : "rgba(200,183,158,0.7)" }}
                  >
                    {t.loading}
                  </div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-72 gap-3">
                  <div
                    className="text-[9px] tracking-[0.3em] uppercase"
                    style={{ color: isLight ? "rgba(42,36,34,0.55)" : "rgba(252,250,246,0.65)" }}
                  >
                    {t.noProducts}
                  </div>
                  {Object.values(filters).some((s) => s.size > 0) && (
                    <button
                      onClick={() => setFilters(emptyFilters())}
                      className="text-[9px] tracking-widest uppercase hover:text-accent transition-colors"
                      style={{ color: isLight ? "rgba(42,36,34,0.38)" : "rgba(200,183,158,0.4)" }}
                    >
                      {t.resetFilter}
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

        {/* right: discount sidebar */}
        <DiscountSidebar products={products} />
      </main>
      <MarqueeStrip />
      </div>

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
