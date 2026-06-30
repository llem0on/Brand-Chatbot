"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch, uploadAdminImage } from "@/lib/api";
import type { Product, ProductCategory } from "@/lib/types";
import DataTable from "@/components/admin/DataTable";
import Modal from "@/components/admin/Modal";

const EMPTY_FORM = {
  code: "",
  name: "",
  category_id: 0,
  description: "",
  price: 0,
  sizes: "",
  colors: "",
  material: "",
  gender: "Unisex",
  stock: 0,
  image_url: "",
  active: true,
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  function load() {
    Promise.all([apiFetch<Product[]>("/admin/products"), apiFetch<ProductCategory[]>("/admin/categories")])
      .then(([p, c]) => {
        setProducts(p);
        setCategories(c);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, category_id: categories[0]?.id || 0 });
    setUploadError("");
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    setEditingId(product.id);
    setForm({
      code: product.code,
      name: product.name,
      category_id: product.category_id,
      description: product.description || "",
      price: product.price,
      sizes: product.sizes || "",
      colors: product.colors || "",
      material: product.material || "",
      gender: product.gender || "Unisex",
      stock: product.stock,
      image_url: product.image_url || "",
      active: product.active,
    });
    setUploadError("");
    setModalOpen(true);
  }

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    try {
      const path = editingId ? `/admin/products/${editingId}` : "/admin/products";
      const method = editingId ? "PUT" : "POST";
      await apiFetch(path, { method, body: JSON.stringify(form) });
      setModalOpen(false);
      load();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Gagal menyimpan produk");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Hapus produk ini?")) return;
    await apiFetch(`/admin/products/${id}`, { method: "DELETE" });
    load();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      const { url } = await uploadAdminImage(file);
      setForm((f) => ({ ...f, image_url: url }));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload gagal");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl text-ink">Produk</h1>
        <button className="admin-btn" onClick={openCreate}>
          + Tambah Produk
        </button>
      </div>

      <DataTable headers={["Foto", "Kode", "Nama", "Harga", "Stok", "Status", "Aksi"]} loading={loading} empty={!loading && products.length === 0}>
        {products.map((product) => (
          <tr key={product.id}>
            <td className="px-5 py-3">
              {product.image_url ? (
                <div className="relative w-12 h-12 rounded-md overflow-hidden bg-bg">
                  <Image src={product.image_url} alt={product.name} fill className="object-cover" unoptimized />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-md bg-bg flex items-center justify-center text-[9px] text-ink/30 text-center leading-tight">
                  Tidak ada foto
                </div>
              )}
            </td>
            <td className="px-5 py-3.5 text-ink/70">{product.code}</td>
            <td className="px-5 py-3.5 text-ink">{product.name}</td>
            <td className="px-5 py-3.5 text-ink/70">Rp{product.price.toLocaleString("id-ID")}</td>
            <td className="px-5 py-3.5 text-ink/70">{product.stock}</td>
            <td className="px-5 py-3.5">
              <span className={product.active ? "text-accent" : "text-ink/40"}>
                {product.active ? "Aktif" : "Nonaktif"}
              </span>
            </td>
            <td className="px-5 py-3.5">
              <div className="flex gap-2">
                <button className="admin-btn-outline" onClick={() => openEdit(product)}>
                  Edit
                </button>
                <Link href={`/admin/products/${product.id}/variants`} className="admin-btn-outline">
                  Varian
                </Link>
                <button className="admin-btn-outline admin-btn-danger" onClick={() => handleDelete(product.id)}>
                  Hapus
                </button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit Produk" : "Tambah Produk"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="admin-label">Kode</label>
              <input className="admin-input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
            </div>
            <div>
              <label className="admin-label">Nama</label>
              <input className="admin-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
          </div>

          <div>
            <label className="admin-label">Kategori</label>
            <select
              className="admin-input"
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: parseInt(e.target.value) })}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="admin-label">Deskripsi</label>
            <textarea
              className="admin-input min-h-20"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="admin-label">Harga (Rp)</label>
              <input
                type="number"
                className="admin-input"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="admin-label">Stok Total</label>
              <input
                type="number"
                className="admin-input"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="admin-label">Ukuran (pisahkan koma)</label>
              <input className="admin-input" value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} placeholder="S,M,L,XL" />
            </div>
            <div>
              <label className="admin-label">Warna (pisahkan koma)</label>
              <input className="admin-input" value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} placeholder="Hitam,Putih" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="admin-label">Material</label>
              <input className="admin-input" value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} />
            </div>
            <div>
              <label className="admin-label">Gender</label>
              <select className="admin-input" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option value="Unisex">Unisex</option>
                <option value="Pria">Pria</option>
                <option value="Wanita">Wanita</option>
              </select>
            </div>
          </div>

          <div>
            <label className="admin-label">Foto Produk</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="admin-input"
              disabled={uploading}
            />
            {uploading && (
              <p className="text-xs text-ink/60 mt-2 flex items-center gap-1.5">
                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#A56A6C", animation: "pulse 1s ease infinite" }} />
                Mengupload ke Cloudinary...
              </p>
            )}
            {uploadError && (
              <p className="text-xs mt-2 font-medium" style={{ color: "#c0392b" }}>
                ⚠ Upload gagal: {uploadError}
              </p>
            )}
            {form.image_url && !uploading && (
              <div className="mt-3 space-y-1">
                <div className="relative w-20 h-20 rounded-md overflow-hidden bg-bg">
                  <Image src={form.image_url} alt="Preview" fill className="object-cover" unoptimized />
                </div>
                <p className="text-[10px] text-ink/40 break-all">{form.image_url}</p>
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-ink/70">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            Aktif
          </label>

          {saveError && (
            <p className="text-xs font-medium" style={{ color: "#c0392b" }}>
              ⚠ {saveError}
            </p>
          )}

          <button
            type="submit"
            className="admin-btn w-full"
            disabled={uploading || saving}
            style={{ opacity: uploading || saving ? 0.5 : 1 }}
          >
            {saving ? "Menyimpan..." : uploading ? "Tunggu upload selesai..." : "Simpan"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
