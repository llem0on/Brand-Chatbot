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
      style={{ background: "#4B1D24", borderRight: "1px solid rgba(200,183,158,0.12)" }}
    >
      <div className="px-6 py-7">
        <p className="font-serif text-xl tracking-[0.1em]" style={{ color: "#FCFAF6" }}>BRAND</p>
        <p className="text-[11px] tracking-[0.15em] uppercase mt-1" style={{ color: "#A89A8C" }}>Admin Panel</p>
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
                  ? { background: "rgba(200,183,158,0.18)", color: "#FCFAF6", borderLeft: "2px solid #C8B79E" }
                  : { color: "#C8B79E", borderLeft: "2px solid transparent" }
              }
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.color = "#FCFAF6";
                  (e.currentTarget as HTMLAnchorElement).style.background = "rgba(200,183,158,0.08)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.color = "#C8B79E";
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
          style={{ color: "#A89A8C" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#FCFAF6";
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(200,183,158,0.08)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = "#A89A8C";
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          }}
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
