"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { FilterValue } from "@/lib/types";
import DataTable from "@/components/admin/DataTable";
import Modal from "@/components/admin/Modal";

const TYPES = ["color", "gender", "category", "material", "size"] as const;
type FilterType = (typeof TYPES)[number];

const TYPE_LABELS: Record<FilterType, string> = {
  color: "Warna",
  gender: "Gender",
  category: "Kategori",
  material: "Material",
  size: "Ukuran",
};

const EMPTY_FORM = { type: "color" as FilterType, value_en: "" };

function parseValue(raw: string): [string, string, string] {
  const parts = raw.split(",");
  return [parts[0] ?? "", parts[1] ?? "", parts[2] ?? ""];
}

export default function FilterValuesPage() {
  const [values, setValues] = useState<FilterValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [translating, setTranslating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [activeTab, setActiveTab] = useState<FilterType>("color");

  function load() {
    apiFetch<FilterValue[]>("/admin/filter-values")
      .then(setValues)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, type: activeTab });
    setModalOpen(true);
  }

  function openEdit(fv: FilterValue) {
    const [en] = parseValue(fv.value);
    setEditingId(fv.id);
    setForm({ type: fv.type as FilterType, value_en: en });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTranslating(true);
    try {
      const path = editingId ? `/admin/filter-values/${editingId}` : "/admin/filter-values";
      const method = editingId ? "PUT" : "POST";
      await apiFetch(path, { method, body: JSON.stringify(form) });
      setModalOpen(false);
      load();
    } finally {
      setTranslating(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Hapus filter value ini?")) return;
    await apiFetch(`/admin/filter-values/${id}`, { method: "DELETE" });
    load();
  }

  const filtered = values.filter((v) => v.type === activeTab);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-3xl text-ink">Filter Values</h1>
        <button className="admin-btn" onClick={openCreate}>
          + Tambah {TYPE_LABELS[activeTab]}
        </button>
      </div>

      <p className="text-sm text-ink/50 mb-6">
        Admin input dalam bahasa Inggris — terjemahan Indonesia & Mandarin di-generate otomatis via AI.
        Format tersimpan: <code className="text-xs bg-surface px-1 py-0.5 rounded">English,Indonesia,中文</code>
      </p>

      {/* Tabs */}
      <div className="flex gap-0 mb-6 border-b" style={{ borderColor: "rgba(200,183,158,0.12)" }}>
        {TYPES.map((t) => {
          const count = values.filter((v) => v.type === t).length;
          return (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className="px-4 py-2.5 text-sm transition-colors"
              style={{
                borderBottom: activeTab === t ? "2px solid #C8B79E" : "2px solid transparent",
                color: activeTab === t ? "#FCFAF6" : "#A89A8C",
                background: "transparent",
                cursor: "pointer",
                marginBottom: -1,
              }}
            >
              {TYPE_LABELS[t]}
              {count > 0 && (
                <span className="ml-1.5 text-xs opacity-60">({count})</span>
              )}
            </button>
          );
        })}
      </div>

      <DataTable
        headers={["English", "Indonesia", "中文", "Aksi"]}
        loading={loading}
        empty={!loading && filtered.length === 0}
      >
        {filtered.map((fv) => {
          const [en, id, zh] = parseValue(fv.value);
          return (
            <tr key={fv.id}>
              <td className="px-5 py-3.5 text-ink">{en}</td>
              <td className="px-5 py-3.5 text-ink/70">{id}</td>
              <td className="px-5 py-3.5 text-ink/70">{zh}</td>
              <td className="px-5 py-3.5">
                <div className="flex gap-2">
                  <button className="admin-btn-outline" onClick={() => openEdit(fv)}>
                    Edit
                  </button>
                  <button className="admin-btn-outline admin-btn-danger" onClick={() => handleDelete(fv.id)}>
                    Hapus
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </DataTable>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? `Edit ${TYPE_LABELS[form.type]}` : `Tambah ${TYPE_LABELS[form.type]}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="admin-label">Tipe</label>
            <select
              className="admin-input"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as FilterType })}
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>{TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="admin-label">Nilai (English)</label>
            <input
              className="admin-input"
              placeholder="e.g. Purple, Cotton Blend, Extra Large..."
              value={form.value_en}
              onChange={(e) => setForm({ ...form, value_en: e.target.value })}
              required
            />
            <p className="text-xs mt-1" style={{ color: "#A89A8C" }}>
              Indonesia & Mandarin akan di-generate otomatis oleh AI
            </p>
          </div>
          <button type="submit" className="admin-btn w-full" disabled={translating}>
            {translating ? "Generating translation..." : "Simpan"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
