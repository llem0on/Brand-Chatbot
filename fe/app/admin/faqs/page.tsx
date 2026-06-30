"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { FAQ } from "@/lib/types";
import DataTable from "@/components/admin/DataTable";
import Modal from "@/components/admin/Modal";

const EMPTY_FORM = { question: "", answer: "", keywords: "", category: "general", display_order: 0, active: true };

export default function FAQsPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  function load() {
    apiFetch<FAQ[]>("/admin/faqs")
      .then(setFaqs)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(faq: FAQ) {
    setEditingId(faq.id);
    setForm({
      question: faq.question,
      answer: faq.answer,
      keywords: faq.keywords,
      category: faq.category,
      display_order: faq.display_order,
      active: faq.active,
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const path = editingId ? `/admin/faqs/${editingId}` : "/admin/faqs";
    const method = editingId ? "PUT" : "POST";
    await apiFetch(path, { method, body: JSON.stringify(form) });
    setModalOpen(false);
    load();
  }

  async function handleDelete(id: number) {
    if (!confirm("Hapus FAQ ini?")) return;
    await apiFetch(`/admin/faqs/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl text-ink">FAQ</h1>
        <button className="admin-btn" onClick={openCreate}>
          + Tambah FAQ
        </button>
      </div>

      <DataTable headers={["Pertanyaan", "Kategori", "Status", "Aksi"]} loading={loading} empty={!loading && faqs.length === 0}>
        {faqs.map((faq) => (
          <tr key={faq.id}>
            <td className="px-5 py-3.5 max-w-md">
              <p className="text-ink">{faq.question}</p>
              <p className="text-ink/40 text-xs mt-1 line-clamp-1">{faq.answer}</p>
            </td>
            <td className="px-5 py-3.5 text-ink/70">{faq.category}</td>
            <td className="px-5 py-3.5">
              <span className={faq.active ? "text-accent" : "text-ink/40"}>
                {faq.active ? "Aktif" : "Nonaktif"}
              </span>
            </td>
            <td className="px-5 py-3.5">
              <div className="flex gap-2">
                <button className="admin-btn-outline" onClick={() => openEdit(faq)}>
                  Edit
                </button>
                <button className="admin-btn-outline admin-btn-danger" onClick={() => handleDelete(faq.id)}>
                  Hapus
                </button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit FAQ" : "Tambah FAQ"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="admin-label">Pertanyaan</label>
            <input
              className="admin-input"
              value={form.question}
              onChange={(e) => setForm({ ...form, question: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="admin-label">Jawaban</label>
            <textarea
              className="admin-input min-h-24"
              value={form.answer}
              onChange={(e) => setForm({ ...form, answer: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="admin-label">Kata Kunci (pisahkan koma)</label>
            <input
              className="admin-input"
              value={form.keywords}
              onChange={(e) => setForm({ ...form, keywords: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="admin-label">Kategori</label>
              <input
                className="admin-input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>
            <div>
              <label className="admin-label">Urutan</label>
              <input
                type="number"
                className="admin-input"
                value={form.display_order}
                onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink/70">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
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
