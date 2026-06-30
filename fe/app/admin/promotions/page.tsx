"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Promotion } from "@/lib/types";
import DataTable from "@/components/admin/DataTable";
import Modal from "@/components/admin/Modal";

const EMPTY_FORM = {
  title: "",
  description: "",
  type: "promo" as "promo" | "event",
  start_date: "",
  end_date: "",
  active: true,
};

function toDateInput(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  function load() {
    apiFetch<Promotion[]>("/admin/promotions")
      .then(setPromotions)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(promo: Promotion) {
    setEditingId(promo.id);
    setForm({
      title: promo.title,
      description: promo.description || "",
      type: promo.type,
      start_date: toDateInput(promo.start_date),
      end_date: toDateInput(promo.end_date),
      active: promo.active,
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      ...form,
      start_date: form.start_date ? new Date(form.start_date).toISOString() : null,
      end_date: form.end_date ? new Date(form.end_date).toISOString() : null,
    };
    const path = editingId ? `/admin/promotions/${editingId}` : "/admin/promotions";
    const method = editingId ? "PUT" : "POST";
    await apiFetch(path, { method, body: JSON.stringify(payload) });
    setModalOpen(false);
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm("Hapus promosi ini?")) return;
    await apiFetch(`/admin/promotions/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl text-ink">Promosi</h1>
        <button className="admin-btn" onClick={openCreate}>
          + Tambah Promosi
        </button>
      </div>

      <DataTable headers={["Judul", "Tipe", "Periode", "Status", "Aksi"]} loading={loading} empty={!loading && promotions.length === 0}>
        {promotions.map((promo) => (
          <tr key={promo.id}>
            <td className="px-5 py-3.5 text-ink">{promo.title}</td>
            <td className="px-5 py-3.5 text-ink/70 capitalize">{promo.type}</td>
            <td className="px-5 py-3.5 text-ink/60 text-xs">
              {toDateInput(promo.start_date) || "—"} &rarr; {toDateInput(promo.end_date) || "—"}
            </td>
            <td className="px-5 py-3.5">
              <span className={promo.active ? "text-accent" : "text-ink/40"}>
                {promo.active ? "Aktif" : "Nonaktif"}
              </span>
            </td>
            <td className="px-5 py-3.5">
              <div className="flex gap-2">
                <button className="admin-btn-outline" onClick={() => openEdit(promo)}>
                  Edit
                </button>
                <button className="admin-btn-outline admin-btn-danger" onClick={() => handleDelete(promo.id)}>
                  Hapus
                </button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit Promosi" : "Tambah Promosi"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="admin-label">Judul</label>
            <input className="admin-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <label className="admin-label">Deskripsi</label>
            <textarea
              className="admin-input min-h-20"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <label className="admin-label">Tipe</label>
            <select
              className="admin-input"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as "promo" | "event" })}
            >
              <option value="promo">Promo</option>
              <option value="event">Event</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="admin-label">Mulai</label>
              <input
                type="date"
                className="admin-input"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              />
            </div>
            <div>
              <label className="admin-label">Selesai</label>
              <input
                type="date"
                className="admin-input"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink/70">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Aktif
          </label>
          <button type="submit" className="admin-btn w-full">
            Simpan
          </button>
        </form>
      </Modal>
    </div>
  );
}
