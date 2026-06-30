"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { PurchaseSettings } from "@/lib/types";

export default function SettingsPage() {
  const [form, setForm] = useState<PurchaseSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiFetch<PurchaseSettings>("/admin/settings").then(setForm);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setSaved(false);
    await apiFetch("/admin/settings", { method: "PUT", body: JSON.stringify(form) });
    setSaving(false);
    setSaved(true);
  }

  if (!form) return <div className="text-ink/40">Memuat...</div>;

  return (
    <div className="max-w-xl">
      <h1 className="font-serif text-3xl text-ink mb-8">Pengaturan</h1>

      <form onSubmit={handleSubmit} className="bg-surface border border-accent/10 rounded-lg p-7 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="admin-label">Nama Bank</label>
            <input
              className="admin-input"
              value={form.bank_name}
              onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
            />
          </div>
          <div>
            <label className="admin-label">No. Rekening</label>
            <input
              className="admin-input"
              value={form.bank_account_number}
              onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="admin-label">Atas Nama</label>
          <input
            className="admin-input"
            value={form.bank_account_holder}
            onChange={(e) => setForm({ ...form, bank_account_holder: e.target.value })}
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-ink/70">
          <input
            type="checkbox"
            checked={form.enable_bank_transfer}
            onChange={(e) => setForm({ ...form, enable_bank_transfer: e.target.checked })}
          />
          Aktifkan Transfer Bank
        </label>

        <div>
          <label className="admin-label">URL Gambar QRIS</label>
          <input
            className="admin-input"
            value={form.qris_image_url}
            onChange={(e) => setForm({ ...form, qris_image_url: e.target.value })}
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-ink/70">
          <input
            type="checkbox"
            checked={form.enable_qris}
            onChange={(e) => setForm({ ...form, enable_qris: e.target.checked })}
          />
          Aktifkan QRIS
        </label>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="admin-label">Ongkos Kirim (Rp)</label>
            <input
              type="number"
              className="admin-input"
              value={form.shipping_cost}
              onChange={(e) => setForm({ ...form, shipping_cost: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="admin-label">Batas Bayar (jam)</label>
            <input
              type="number"
              className="admin-input"
              value={form.payment_deadline_hours}
              onChange={(e) => setForm({ ...form, payment_deadline_hours: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div>
          <label className="admin-label">Pesan Penutup</label>
          <textarea
            className="admin-input min-h-24"
            value={form.closing_message}
            onChange={(e) => setForm({ ...form, closing_message: e.target.value })}
          />
        </div>

        <button type="submit" disabled={saving} className="admin-btn w-full disabled:opacity-50">
          {saving ? "Menyimpan..." : "Simpan Pengaturan"}
        </button>
        {saved && <p className="text-xs text-accent text-center">Tersimpan</p>}
      </form>
    </div>
  );
}
