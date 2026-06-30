"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { ConversationState, Customer, FAQ, Order, Product, Promotion } from "@/lib/types";

const STAT_CONFIG = [
  { key: "faqs", label: "FAQ" },
  { key: "products", label: "Produk" },
  { key: "promotions", label: "Promosi Aktif" },
  { key: "escalations", label: "Chat Eskalasi" },
  { key: "orders", label: "Pesanan" },
  { key: "customers", label: "Pelanggan" },
] as const;

type Stats = Record<(typeof STAT_CONFIG)[number]["key"], number>;

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<FAQ[]>("/admin/faqs"),
      apiFetch<Product[]>("/admin/products"),
      apiFetch<Promotion[]>("/admin/promotions"),
      apiFetch<ConversationState[]>("/admin/conversations"),
      apiFetch<Order[]>("/admin/orders"),
      apiFetch<Customer[]>("/admin/customers"),
    ]).then(([faqs, products, promotions, conversations, orders, customers]) => {
      setStats({
        faqs: faqs.length,
        products: products.length,
        promotions: promotions.filter((p) => p.active).length,
        escalations: conversations.length,
        orders: orders.length,
        customers: customers.length,
      });
    });
  }, []);

  return (
    <div>
      <h1 className="font-serif text-3xl text-ink mb-8">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
        {STAT_CONFIG.map((stat) => (
          <div key={stat.key} className="bg-surface border border-accent/10 rounded-lg p-6">
            <p className="text-[11px] tracking-[0.12em] uppercase text-ink/40 mb-2">{stat.label}</p>
            <p className="font-serif text-4xl text-accent">
              {stats ? stats[stat.key] : "—"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
