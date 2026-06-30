"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAdmin } from "@/hooks/useAdminAuth";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin" },
  { label: "FAQs", href: "/admin/faqs" },
  { label: "Produk", href: "/admin/products" },
  { label: "Kategori", href: "/admin/categories" },
  { label: "Promosi", href: "/admin/promotions" },
  { label: "Pesanan", href: "/admin/orders" },
  { label: "Pelanggan", href: "/admin/customers" },
  { label: "Pengaturan", href: "/admin/settings" },
  { label: "Chat", href: "/admin/chat" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="w-60 shrink-0 h-screen sticky top-0 flex flex-col"
      style={{ background: "#4B1D24", borderRight: "1px solid rgba(203,180,167,0.15)" }}
    >
      <div className="px-6 py-7">
        <p className="font-serif text-xl tracking-[0.1em]" style={{ color: "#EFE4DC" }}>BRAND</p>
        <p className="text-[11px] tracking-[0.15em] uppercase mt-1" style={{ color: "#A56A6C" }}>Admin Panel</p>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2.5 rounded-md text-sm tracking-wide transition-colors"
              style={
                active
                  ? { background: "#7C2A35", color: "#EFE4DC" }
                  : { color: "#CBB4A7" }
              }
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.color = "#EFE4DC";
                  (e.currentTarget as HTMLAnchorElement).style.background = "rgba(203,180,167,0.08)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.color = "#CBB4A7";
                  (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                }
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-6">
        <button
          onClick={logoutAdmin}
          className="w-full px-3 py-2.5 rounded-md text-sm transition-colors text-left"
          style={{ color: "#A56A6C" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#EFE4DC";
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(203,180,167,0.08)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#A56A6C";
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          }}
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
