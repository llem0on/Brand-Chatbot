"use client";

import { Fragment, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Order } from "@/lib/types";
import DataTable from "@/components/admin/DataTable";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

const STATUS_OPTIONS = [
  { value: "menunggu_pembayaran", label: "Menunggu Pembayaran" },
  { value: "sudah_bayar",        label: "Sudah Bayar" },
  { value: "dikirim",            label: "Dikirim" },
  { value: "selesai",            label: "Selesai" },
  { value: "dibatalkan",         label: "Dibatalkan" },
];

function RejectModal({ onConfirm, onCancel }: { onConfirm: (reason: string) => void; onCancel: () => void }) {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-md p-6 rounded-lg" style={{ background: "#F7F3EC", border: "1px solid #D8CFC4" }}>
        <h3 className="font-serif text-lg text-ink mb-4">Tolak Pembayaran</h3>
        <p className="text-sm text-ink/60 mb-3">Alasan penolakan (akan dilihat oleh customer):</p>
        <textarea
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Contoh: Foto tidak jelas, nominal tidak sesuai, dll."
          className="admin-input w-full resize-none mb-4"
        />
        <div className="flex gap-3 justify-end">
          <button className="admin-btn-outline" onClick={onCancel}>Batal</button>
          <button
            className="admin-btn"
            style={{ background: "rgba(210,60,60,0.85)", borderColor: "rgba(210,60,60,0.6)" }}
            disabled={!reason.trim()}
            onClick={() => reason.trim() && onConfirm(reason.trim())}
          >
            Tolak
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders]         = useState<Order[]>([]);
  const [loading, setLoading]       = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [tab, setTab]               = useState<"all" | "needs_verify">("needs_verify");

  function load() {
    apiFetch<Order[]>("/admin/orders")
      .then(setOrders)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleStatusChange(orderId: number, status: string) {
    await apiFetch(`/admin/orders/${orderId}/status`, { method: "PUT", body: JSON.stringify({ status }) });
    load();
  }

  async function handleVerify(orderId: number, action: "approve" | "reject", reason = "") {
    await apiFetch(`/admin/orders/${orderId}/verify-payment`, {
      method: "POST",
      body: JSON.stringify({ action, reason }),
    });
    setRejectingId(null);
    load();
  }

  const needsVerify = orders.filter((o) => o.status === "menunggu_pembayaran" && o.payment_proof_url);
  const shown = tab === "needs_verify" ? needsVerify : orders;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl text-ink">Pesanan</h1>
        {needsVerify.length > 0 && (
          <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: "rgba(75,29,36,0.1)", color: "#321318", border: "1px solid rgba(75,29,36,0.25)" }}>
            {needsVerify.length} menunggu verifikasi
          </span>
        )}
      </div>

      {/* tabs */}
      <div className="flex gap-1 mb-5" style={{ borderBottom: "1px solid var(--color-border)" }}>
        {([["needs_verify", "Perlu Verifikasi"], ["all", "Semua Pesanan"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="px-4 py-2 text-xs tracking-widest uppercase transition-colors"
            style={{
              paddingBottom: "10px",
              borderBottom: tab === key ? "2px solid #321318" : "2px solid transparent",
              color: tab === key ? "#321318" : "#A89A8C",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            {label}
            {key === "needs_verify" && needsVerify.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-[10px] rounded-full" style={{ background: "rgba(75,29,36,0.15)", color: "#321318" }}>
                {needsVerify.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <DataTable
        headers={["No. Pesanan", "Pelanggan", "Total", "Status", "Bukti Bayar", "Tanggal", ""]}
        loading={loading}
        empty={!loading && shown.length === 0}
      >
        {shown.map((order) => (
          <Fragment key={order.id}>
            <tr>
              <td className="px-5 py-3.5 text-ink">{order.order_number}</td>
              <td className="px-5 py-3.5 text-ink/70">{order.customer?.name || "—"}</td>
              <td className="px-5 py-3.5 text-ink/70">Rp{order.total_amount.toLocaleString("id-ID")}</td>
              <td className="px-5 py-3.5">
                <select
                  className="admin-input py-1.5 text-xs"
                  value={order.status}
                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </td>
              <td className="px-5 py-3.5">
                {order.payment_proof_url ? (
                  <div className="flex items-center gap-2">
                    <a href={order.payment_proof_url} target="_blank" rel="noreferrer"
                      className="text-xs underline" style={{ color: "var(--color-accent)" }}>
                      Lihat Bukti
                    </a>
                    {order.status === "menunggu_pembayaran" && (
                      <>
                        <button
                          onClick={() => handleVerify(order.id, "approve")}
                          className="text-xs px-2.5 py-1 rounded transition-colors"
                          style={{ background: "rgba(75,29,36,0.08)", color: "#321318", border: "1px solid rgba(75,29,36,0.25)" }}
                        >
                          ACC
                        </button>
                        <button
                          onClick={() => setRejectingId(order.id)}
                          className="text-xs px-2.5 py-1 rounded transition-colors"
                          style={{ background: "rgba(75,29,36,0.08)", color: "#321318", border: "1px solid rgba(75,29,36,0.3)" }}
                        >
                          Tolak
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-ink/30">
                    {order.rejection_reason ? "Ditolak" : "Belum ada"}
                  </span>
                )}
              </td>
              <td className="px-5 py-3.5 text-ink/50 text-xs">
                {new Date(order.created_at).toLocaleDateString("id-ID")}
              </td>
              <td className="px-5 py-3.5">
                <button
                  className="admin-btn-outline"
                  onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                >
                  {expandedId === order.id ? "Tutup" : "Detail"}
                </button>
              </td>
            </tr>

            {expandedId === order.id && (
              <tr>
                <td colSpan={7} className="px-5 py-4 bg-bg/40">
                  <p className="text-xs text-ink/40 mb-2 tracking-wide uppercase">Item Pesanan</p>
                  <ul className="space-y-1 mb-3">
                    {order.items.map((item) => (
                      <li key={item.id} className="text-sm text-ink/80">
                        {item.product?.name || `Produk #${item.product_id}`}
                        {item.product_variant ? ` (${item.product_variant.size}/${item.product_variant.color})` : ""}
                        {" "}&times; {item.quantity} — Rp{item.subtotal.toLocaleString("id-ID")}
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-ink/60">Alamat: {order.address}</p>
                  <p className="text-xs text-ink/60">Pembayaran: {order.payment_method}</p>
                  <p className="text-xs text-ink/60">Ongkir: Rp{order.shipping_cost.toLocaleString("id-ID")}</p>
                  {order.rejection_reason && (
                    <p className="text-xs mt-2" style={{ color: "#321318" }}>
                      Alasan penolakan: {order.rejection_reason}
                    </p>
                  )}
                  {order.payment_proof_url && (
                    <div className="mt-3">
                      <p className="text-xs text-ink/40 mb-2 tracking-wide uppercase">Bukti Pembayaran</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={order.payment_proof_url}
                        alt="Bukti pembayaran"
                        style={{ maxWidth: 280, maxHeight: 320, border: "1px solid rgba(0,0,0,0.1)", objectFit: "contain", background: "#f5f5f5" }}
                      />
                    </div>
                  )}
                </td>
              </tr>
            )}
          </Fragment>
        ))}
      </DataTable>

      {rejectingId !== null && (
        <RejectModal
          onConfirm={(reason) => handleVerify(rejectingId, "reject", reason)}
          onCancel={() => setRejectingId(null)}
        />
      )}
    </div>
  );
}
