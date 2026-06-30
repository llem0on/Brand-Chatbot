"use client";

import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

function rupiah(n: number) {
  return "Rp" + n.toLocaleString("id-ID");
}

function parseImage(url: string): string | null {
  if (!url) return null;
  try {
    const a = JSON.parse(url);
    if (Array.isArray(a) && a[0]) return a[0];
  } catch {}
  return url;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric", month: "short", year: "numeric",
  });
}

const STATUS_LABEL: Record<string, string> = {
  menunggu_pembayaran: "Menunggu Pembayaran",
  sudah_bayar:         "Sudah Dibayar",
  dikirim:             "Dalam Pengiriman",
  selesai:             "Selesai",
  dibatalkan:          "Dibatalkan",
};

const STATUS_COLOR: Record<string, string> = {
  menunggu_pembayaran: "rgba(228,175,70,0.9)",
  sudah_bayar:         "rgba(100,210,140,0.9)",
  dikirim:             "rgba(100,160,240,0.9)",
  selesai:             "rgba(100,210,140,0.9)",
  dibatalkan:          "rgba(210,80,80,0.8)",
};

type Variant   = { size: string; color: string };
type Product   = { name: string; code: string; price: number; image_url: string };
type OrderItem = { id: number; quantity: number; unit_price: number; subtotal: number; product: Product; product_variant: Variant };
type Order = {
  id: number;
  order_number: string;
  status: string;
  payment_method: string;
  address: string;
  shipping_cost: number;
  total_amount: number;
  created_at: string;
  payment_proof_url: string;
  rejection_reason: string;
  items: OrderItem[];
};

type Tab = "berlangsung" | "selesai" | "dibatalkan";
const ONGOING = new Set(["menunggu_pembayaran", "sudah_bayar", "dikirim"]);

function groupOrders(orders: Order[]): Record<Tab, Order[]> {
  return {
    berlangsung: orders.filter((o) => ONGOING.has(o.status)),
    selesai:     orders.filter((o) => o.status === "selesai"),
    dibatalkan:  orders.filter((o) => o.status === "dibatalkan"),
  };
}

// ── Payment Status Badge ───────────────────────────────────────────────────
// Shows proof status on the order card. Upload now happens during checkout.

function PaymentSection({ order }: { order: Order }) {
  if (order.status !== "menunggu_pembayaran") return null;

  const hasProof   = !!order.payment_proof_url;
  const isRejected = !!order.rejection_reason;

  return (
    <div style={{ borderTop: "1px solid rgba(203,180,167,0.08)", padding: "12px 20px", background: "rgba(165,106,108,0.03)" }}>
      {isRejected ? (
        <div style={{ padding: "10px 14px", border: "1px solid rgba(210,80,80,0.25)", background: "rgba(210,80,80,0.06)" }}>
          <div style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(210,80,80,0.8)", marginBottom: 4 }}>Bukti Pembayaran Ditolak</div>
          <div style={{ fontSize: 12, color: "rgba(239,228,220,0.6)", lineHeight: 1.6 }}>{order.rejection_reason}</div>
        </div>
      ) : hasProof ? (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(228,175,70,0.9)", flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 11, color: "rgba(228,175,70,0.9)" }}>Bukti dikirim — menunggu verifikasi admin</div>
            <button onClick={() => window.open(order.payment_proof_url, "_blank")}
              style={{ marginTop: 3, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(239,228,220,0.72)", background: "transparent", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}>
              Lihat bukti
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(228,175,70,0.5)", flexShrink: 0 }} />
          <div style={{ fontSize: 11, color: "rgba(228,175,70,0.6)" }}>Menunggu pembayaran</div>
        </div>
      )}
    </div>
  );
}


// ── Order Card ─────────────────────────────────────────────────────────────

function OrderCard({ order }: { order: Order }) {
  const [open, setOpen] = useState(false);
  const statusColor = STATUS_COLOR[order.status] ?? "rgba(239,228,220,0.4)";

  return (
    <div
      style={{ border: "1px solid rgba(203,180,167,0.1)", background: "rgba(239,228,220,0.02)", marginBottom: 10, transition: "border-color 0.25s ease" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(203,180,167,0.22)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(203,180,167,0.1)"; }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", background: "transparent", border: "none", cursor: "pointer", gap: 12 }}
      >
        {/* thumbnail stack */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", flexShrink: 0 }}>
            {order.items.slice(0, 3).map((item, i) => {
              const img = parseImage(item.product.image_url);
              return (
                <div key={item.id} style={{ width: 40, height: 50, position: "relative", overflow: "hidden", background: "#5C2230", border: "1px solid rgba(203,180,167,0.08)", marginLeft: i > 0 ? -10 : 0, zIndex: 3 - i }}>
                  {img && <Image src={img} alt={item.product.name} fill sizes="44px" className="object-cover" style={{ filter: "brightness(0.85)" }} />}
                </div>
              );
            })}
            {order.items.length > 3 && (
              <div style={{ width: 40, height: 50, background: "rgba(165,106,108,0.1)", border: "1px solid rgba(203,180,167,0.08)", marginLeft: -10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "rgba(203,180,167,0.6)", zIndex: 0 }}>
                +{order.items.length - 3}
              </div>
            )}
          </div>

          <div style={{ minWidth: 0, textAlign: "left" }}>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 14, color: "#EFE4DC", marginBottom: 4 }}>{order.order_number}</div>
            <div style={{ fontSize: 10, color: "rgba(239,228,220,0.72)" }}>
              {formatDate(order.created_at)} · {order.items.length} item
            </div>
          </div>
        </div>

        {/* status + total + chevron */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 7, letterSpacing: "0.2em", textTransform: "uppercase", color: statusColor, marginBottom: 3 }}>
              {STATUS_LABEL[order.status] ?? order.status}
            </div>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: 14, color: "#EFE4DC" }}>{rupiah(order.total_amount)}</div>
          </div>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="rgba(203,180,167,0.75)" strokeWidth="1.3"
            style={{ transition: "transform 0.25s ease", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            <polyline points="1,3 5.5,8 10,3" />
          </svg>
        </div>
      </button>

      {/* expanded detail */}
      {open && (
        <div style={{ borderTop: "1px solid rgba(203,180,167,0.07)", padding: "16px 20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
            {order.items.map((item) => {
              const img = parseImage(item.product.image_url);
              return (
                <div key={item.id} style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <div style={{ width: 52, height: 65, flexShrink: 0, position: "relative", overflow: "hidden", background: "#5C2230" }}>
                    {img && <Image src={img} alt={item.product.name} fill sizes="56px" className="object-cover" style={{ filter: "brightness(0.88)" }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 7, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(203,180,167,0.78)", marginBottom: 3 }}>{item.product.code}</div>
                    <div style={{ fontSize: 13, color: "#EFE4DC", lineHeight: 1.3, marginBottom: 5 }}>{item.product.name}</div>
                    {(item.product_variant.size || item.product_variant.color) && (
                      <div style={{ display: "flex", gap: 5 }}>
                        {[item.product_variant.size, item.product_variant.color].filter(Boolean).map((v) => (
                          <span key={v} style={{ fontSize: 8, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(239,228,220,0.78)", border: "1px solid rgba(239,228,220,0.25)", padding: "2px 8px" }}>{v}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 13, color: "var(--color-accent)" }}>{rupiah(item.subtotal)}</div>
                    <div style={{ fontSize: 9, color: "rgba(239,228,220,0.65)", marginTop: 2 }}>×{item.quantity}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ borderTop: "1px solid rgba(203,180,167,0.07)", paddingTop: 12, display: "flex", flexDirection: "column", gap: 5 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(239,228,220,0.72)" }}>
              <span>Ongkir</span><span>{rupiah(order.shipping_cost)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#EFE4DC" }}>
              <span>Total</span><span style={{ fontFamily: "var(--font-serif)" }}>{rupiah(order.total_amount)}</span>
            </div>
            <div style={{ marginTop: 6, fontSize: 10, color: "rgba(239,228,220,0.65)", display: "flex", gap: 10 }}>
              <span>{order.payment_method === "transfer_bank" ? "Transfer Bank" : "QRIS"}</span>
              <span style={{ color: "rgba(203,180,167,0.2)" }}>·</span>
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{order.address}</span>
            </div>
          </div>
        </div>
      )}

      {/* payment status badge */}
      <PaymentSection order={order} />
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function PesananPage() {
  const { data: session, status } = useSession();
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<Tab>("berlangsung");

  function loadOrders() {
    fetch("/api/my-orders")
      .then((r) => r.json())
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (status === "loading") return;
    if (!session) { setLoading(false); return; }
    loadOrders();
  }, [session, status]);

  const grouped = groupOrders(orders);

  const TABS: { key: Tab; label: string }[] = [
    { key: "berlangsung", label: "Berlangsung" },
    { key: "selesai",     label: "Selesai"     },
    { key: "dibatalkan",  label: "Dibatalkan"  },
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-28 pb-24" style={{ background: "var(--color-bg)" }}>
        <div className="mx-auto max-w-2xl px-6">

          {/* header */}
          <div className="mb-10">
            <div style={{ fontSize: 8, letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(203,180,167,0.88)", marginBottom: 10 }}>
              Akun
            </div>
            <h1 className="font-serif" style={{ fontSize: "clamp(26px,4vw,42px)", color: "#EFE4DC", lineHeight: 1.05 }}>
              Pesanan Saya
            </h1>
            {session?.user?.email && (
              <div style={{ marginTop: 8, fontSize: 11, color: "rgba(239,228,220,0.72)" }}>
                {session.user.email}
              </div>
            )}
            <div style={{ marginTop: 14, height: 1, maxWidth: 180, background: "linear-gradient(to right, rgba(165,106,108,0.4), transparent)" }} />
          </div>

          {/* ── not logged in ── */}
          {status !== "loading" && !session && (
            <div style={{ textAlign: "center", paddingTop: 56, paddingBottom: 56 }}>
              <div style={{ marginBottom: 8, fontFamily: "var(--font-serif)", fontSize: 20, color: "rgba(239,228,220,0.7)" }}>
                Belum login
              </div>
              <div style={{ fontSize: 12, color: "rgba(239,228,220,0.28)", marginBottom: 28 }}>
                Login untuk melihat pesanan kamu.
              </div>
              <button
                onClick={() => signIn("google")}
                style={{ fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", color: "var(--color-accent)", border: "1px solid rgba(203,180,167,0.32)", padding: "13px 32px", background: "transparent", cursor: "pointer", transition: "all 0.2s ease" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(165,106,108,0.1)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >
                Masuk dengan Google
              </button>
            </div>
          )}

          {/* ── loading ── */}
          {(status === "loading" || (session && loading)) && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 8 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ height: 82, background: "rgba(239,228,220,0.03)", border: "1px solid rgba(203,180,167,0.06)", animation: "pulse 1.6s ease infinite" }} />
              ))}
            </div>
          )}

          {/* ── orders ── */}
          {session && !loading && (
            <>
              {/* tabs */}
              <div style={{ display: "flex", borderBottom: "1px solid rgba(203,180,167,0.08)", marginBottom: 20 }}>
                {TABS.map(({ key, label }) => {
                  const count  = grouped[key].length;
                  const active = tab === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setTab(key)}
                      style={{
                        padding: "10px 20px",
                        background: "transparent", border: "none",
                        borderBottom: active ? "1px solid rgba(203,180,167,0.75)" : "1px solid transparent",
                        marginBottom: -1,
                        cursor: "pointer",
                        fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase",
                        color: active ? "var(--color-accent)" : "rgba(239,228,220,0.75)",
                        transition: "color 0.2s ease",
                        display: "flex", alignItems: "center", gap: 6,
                      }}
                    >
                      {label}
                      {count > 0 && (
                        <span style={{ fontSize: 8, padding: "1px 6px", borderRadius: 99, background: active ? "rgba(165,106,108,0.25)" : "rgba(239,228,220,0.07)", color: active ? "var(--color-accent)" : "rgba(239,228,220,0.65)" }}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* list */}
              {grouped[tab].length === 0 ? (
                <div style={{ textAlign: "center", paddingTop: 48, paddingBottom: 48 }}>
                  <div style={{ fontSize: 12, color: "rgba(239,228,220,0.65)", marginBottom: orders.length === 0 ? 20 : 0 }}>
                    {orders.length === 0 ? "Belum ada pesanan." : "Tidak ada pesanan di kategori ini."}
                  </div>
                  {orders.length === 0 && (
                    <Link href="/koleksi" style={{ fontSize: 9, letterSpacing: "0.26em", textTransform: "uppercase", color: "var(--color-accent)", border: "1px solid rgba(203,180,167,0.28)", padding: "10px 24px" }}>
                      Mulai Belanja
                    </Link>
                  )}
                </div>
              ) : (
                grouped[tab].map((order) => <OrderCard key={order.id} order={order} />)
              )}
            </>
          )}

        </div>
      </main>
      <Footer />
    </>
  );
}
