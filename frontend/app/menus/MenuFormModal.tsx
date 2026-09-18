"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Menu, Category } from "@/types";
import { X, Image as ImageIcon, DollarSign, Tag } from "lucide-react";

export default function MenuFormModal({
  menu,
  categories,
  onClose,
  onSuccess,
}: {
  menu: Menu | null;
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [categoryId, setCategoryId] = useState<number>(
    menu?.category_id ?? categories[0]?.id ?? 0
  );
  const [name, setName] = useState(menu?.name ?? "");
  const [description, setDescription] = useState(menu?.description ?? "");
  const [price, setPrice] = useState<number>(menu?.price ?? 0);
  const [image, setImage] = useState(menu?.image ?? "");
  const [isAvailable, setIsAvailable] = useState(menu?.is_available ?? true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // Close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = async () => {
    setErr("");
    if (!name.trim()) return setErr("Nama menu wajib diisi");
    if (!categoryId) return setErr("Pilih kategori");
    if (price <= 0) return setErr("Harga harus lebih dari 0");

    setSaving(true);
    try {
      const payload: any = {
        category_id: categoryId,
        name: name.trim(),
        description: description.trim(),
        price,
        image: image.trim(),
        is_available: isAvailable,
      };

      if (menu) {
        await api.put(`/menus/${menu.id}`, payload);
      } else {
        await api.post("/menus", payload);
      }
      onSuccess();
    } catch (e: any) {
      setErr(e.response?.data?.message ?? "Gagal menyimpan menu");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white">
              <Tag size={16} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 leading-tight">
                {menu ? "Edit Menu" : "Tambah Menu"}
              </h2>
              <p className="text-[11px] text-slate-500">
                {menu ? "Perbarui data menu" : "Buat menu baru"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {err && (
            <div className="bg-red-50 text-red-600 px-3 py-2.5 rounded-lg text-xs border border-red-100 flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
              {err}
            </div>
          )}

          {/* Nama */}
          <div>
            <label className="label">Nama Menu *</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Nasi Goreng Spesial"
              autoFocus
            />
          </div>

          {/* Kategori */}
          <div>
            <label className="label">Kategori *</label>
            <select
              className="input"
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
            >
              {categories.length === 0 ? (
                <option value={0}>Belum ada kategori</option>
              ) : (
                categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Deskripsi */}
          <div>
            <label className="label">Deskripsi</label>
            <textarea
              className="input min-h-[72px] resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsi singkat menu (opsional)"
              rows={3}
            />
          </div>

          {/* Harga */}
          <div>
            <label className="label">Harga *</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 font-semibold text-sm pointer-events-none">
                Rp
              </span>
              <input
                type="number"
                className="input pl-10"
                value={price || ""}
                onChange={(e) => setPrice(Number(e.target.value) || 0)}
                placeholder="0"
                min={0}
                inputMode="numeric"
              />
            </div>
            {price > 0 && (
              <div className="text-[11px] text-slate-500 mt-1">
                Preview:{" "}
                <span className="font-semibold text-brand-700">
                  Rp {price.toLocaleString("id-ID")}
                </span>
              </div>
            )}
          </div>

          {/* Image URL */}
          <div>
            <label className="label">URL Gambar</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
                <ImageIcon size={14} />
              </span>
              <input
                className="input pl-10"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://... (opsional)"
              />
            </div>
            {image && (
              <div className="mt-2 aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                <img
                  src={image}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}
          </div>

          {/* Available */}
          <label className="flex items-center gap-2 text-sm text-slate-700 pt-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              className="w-4 h-4 accent-brand-500 cursor-pointer"
            />
            <span>Tersedia untuk dipesan</span>
          </label>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn-ghost">
            Batal
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Menyimpan…
              </>
            ) : (
              "Simpan"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}