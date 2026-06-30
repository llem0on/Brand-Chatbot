"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { Product, ProductVariant } from "@/lib/types";
import DataTable from "@/components/admin/DataTable";
import Modal from "@/components/admin/Modal";

const EMPTY_FORM = { size: "", color: "", stock: 0 };

export default function ProductVariantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  function load() {
    Promise.all([
      apiFetch<Product[]>("/admin/products"),
      apiFetch<ProductVariant[]>(`/admin/products/${id}/variants`),
    ])
      .then(([products, v]) => {
        setProduct(products.find((p) => p.id === parseInt(id)) || null);
        setVariants(v);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, [id]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(variant: ProductVariant) {
    setEditingId(variant.id);
    setForm({ size: variant.size, color: variant.color, stock: variant.stock });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const path = editingId ? `/admin/variants/${editingId}` : `/admin/products/${id}/variants`;
    const method = editingId ? "PUT" : "POST";
    await apiFetch(path, { method, body: JSON.stringify(form) });
    setModalOpen(false);
    load();
  }

  async function handleDelete(variantId: number) {
    if (!confirm("Hapus varian ini?")) return;
    await apiFetch(`/admin/variants/${variantId}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <Link href="/admin/products" className="text-sm text-ink/50 hover:text-accent mb-4 inline-block">
        &larr; Kembali ke Produk
      </Link>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl text-ink">
          Varian {product ? `— ${product.name}` : ""}
        </h1>
        <button className="admin-btn" onClick={openCreate}>
          + Tambah Varian
        </button>
      </div>

      <DataTable headers={["Ukuran", "Warna", "Stok", "Aksi"]} loading={loading} empty={!loading && variants.length === 0}>
        {variants.map((v) => (
          <tr key={v.id}>
            <td className="px-5 py-3.5 text-ink">{v.size}</td>
            <td className="px-5 py-3.5 text-ink/70">{v.color}</td>
            <td className="px-5 py-3.5 text-ink/70">{v.stock}</td>
            <td className="px-5 py-3.5">
              <div className="flex gap-2">
                <button className="admin-btn-outline" onClick={() => openEdit(v)}>
                  Edit
                </button>
                <button className="admin-btn-outline admin-btn-danger" onClick={() => handleDelete(v.id)}>
                  Hapus
                </button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit Varian" : "Tambah Varian"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="admin-label">Ukuran</label>
              <input className="admin-input" value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} required />
            </div>
            <div>
              <label className="admin-label">Warna</label>
              <input className="admin-input" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} required />
            </div>
          </div>
          <div>
            <label className="admin-label">Stok</label>
            <input
              type="number"
              className="admin-input"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
            />
          </div>
          <button type="submit" className="admin-btn w-full">
            Simpan
          </button>
        </form>
      </Modal>
    </div>
  );
}
