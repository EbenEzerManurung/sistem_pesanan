"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import type { Category } from "@/types";
import { X, Tag, Plus, Pencil, Trash2, Check, AlertCircle } from "lucide-react";

export default function CategoryModal({
  categories,
  onClose,
  onRefresh,
}: {
  categories: Category[];
  onClose: () => void;
  onRefresh: () => void;
}) {
  const toast = useToast();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);

  // Close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setEditing(null);
  };

  const startEdit = (cat: Category) => {
    setEditing(cat);
    setName(cat.name);
    setDescription(cat.description ?? "");
  };

  const submit = async () => {
    if (!name.trim()) {
      toast.warning("Nama kategori wajib", "Isi nama kategori dulu");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
      };

      if (editing) {
        await api.put(`/categories/${editing.id}`, payload);
        toast.success("Kategori diperbarui", `"${editing.name}" telah diubah`);
      } else {
        await api.post("/categories", payload);
        toast.success("Kategori ditambahkan", `"${name.trim()}" berhasil dibuat`);
      }
      resetForm();
      onRefresh();
    } catch (e: any) {
      const msg = e.response?.data?.message ?? "Gagal menyimpan kategori";
      toast.error("Gagal menyimpan", msg);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (cat: Category) => {
    if (!confirm(`Hapus kategori "${cat.name}"?`)) return;
    try {
      await api.delete(`/categories/${cat.id}`);
      toast.success("Kategori dihapus", `"${cat.name}" telah dihapus`);
      if (editing?.id === cat.id) resetForm();
      onRefresh();
    } catch (e: any) {
      const msg =
        e.response?.data?.message ??
        "Kategori tidak bisa dihapus (mungkin masih dipakai menu)";
      toast.error("Gagal menghapus", msg);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white">
              <Tag size={16} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 leading-tight">
                Kelola Kategori
              </h2>
              <p className="text-[11px] text-slate-500">
                Tambah, edit, atau hapus kategori menu
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
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Form tambah/edit */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-2">
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wide">
              {editing ? `Edit: ${editing.name}` : "Tambah Kategori Baru"}
            </div>

            <input
              className="input"
              placeholder="Nama kategori *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
            <input
              className="input"
              placeholder="Deskripsi (opsional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />

            <div className="flex gap-2">
              {editing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-ghost flex-1"
                >
                  Batal Edit
                </button>
              )}
              <button
                type="button"
                onClick={submit}
                disabled={saving}
                className="btn-primary flex-1"
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Menyimpan…
                  </>
                ) : editing ? (
                  <>
                    <Check size={14} /> Update
                  </>
                ) : (
                  <>
                    <Plus size={14} /> Tambah
                  </>
                )}
              </button>
            </div>
          </div>

          {/* List kategori */}
          <div>
            <div className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
              Daftar Kategori ({categories.length})
            </div>

            {categories.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-slate-400 py-6 justify-center">
                <AlertCircle size={16} />
                Belum ada kategori
              </div>
            ) : (
              <div className="space-y-1.5">
                {categories.map((c) => (
                  <div
                    key={c.id}
                    className={`flex items-center justify-between gap-2 p-2.5 rounded-lg border transition ${
                      editing?.id === c.id
                        ? "bg-brand-50 border-brand-300"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-slate-800 truncate">
                        {c.name}
                      </div>
                      {c.description && (
                        <div className="text-[11px] text-slate-500 truncate">
                          {c.description}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(c)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                        title="Edit"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => remove(c)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
                        title="Hapus"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 flex justify-end">
          <button onClick={onClose} className="btn-ghost">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}