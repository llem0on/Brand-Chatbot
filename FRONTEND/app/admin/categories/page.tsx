"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { ProductCategory } from "@/lib/types";
import DataTable from "@/components/admin/DataTable";
import Modal from "@/components/admin/Modal";

const EMPTY_FORM = { name: "", description: "" };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  function load() {
    apiFetch<ProductCategory[]>("/admin/categories")
      .then(setCategories)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(cat: ProductCategory) {
    setEditingId(cat.id);
    setForm({ name: cat.name, description: cat.description || "" });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const path = editingId ? `/admin/categories/${editingId}` : "/admin/categories";
    const method = editingId ? "PUT" : "POST";
    await apiFetch(path, { method, body: JSON.stringify(form) });
    setModalOpen(false);
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm("Hapus kategori ini?")) return;
    await apiFetch(`/admin/categories/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl text-ink">Kategori</h1>
        <button className="admin-btn" onClick={openCreate}>
          + Tambah Kategori
        </button>
      </div>

      <DataTable headers={["Nama", "Deskripsi", "Aksi"]} loading={loading} empty={!loading && categories.length === 0}>
        {categories.map((cat) => (
          <tr key={cat.id}>
            <td className="px-5 py-3.5 text-ink">{cat.name}</td>
            <td className="px-5 py-3.5 text-ink/60">{cat.description}</td>
            <td className="px-5 py-3.5">
              <div className="flex gap-2">
                <button className="admin-btn-outline" onClick={() => openEdit(cat)}>
                  Edit
                </button>
                <button className="admin-btn-outline admin-btn-danger" onClick={() => handleDelete(cat.id)}>
                  Hapus
                </button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit Kategori" : "Tambah Kategori"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="admin-label">Nama</label>
            <input className="admin-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="admin-label">Deskripsi</label>
            <textarea
              className="admin-input min-h-20"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
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
