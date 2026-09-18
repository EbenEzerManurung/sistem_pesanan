"use client";
import { useEffect, useState, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { api, fileUrl } from "@/lib/api";
import { rupiah } from "@/lib/format";
import { useToast } from "@/components/ui/Toast";
import type { Menu, Category, PaginationMeta } from "@/types";
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import EmptyState from "@/components/ui/EmptyState";
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Tag,
  UtensilsCrossed,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
} from "lucide-react";
import MenuFormModal from "./MenuFormModal";
import CategoryModal from "./CategoryModal";

export default function MenusPage() {
  const toast = useToast();

  const [list, setList] = useState<Menu[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    limit: 12,
    total: 0,
    total_page: 1,
  });
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<number | "">("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Menu | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showCategory, setShowCategory] = useState(false);

  // ─── Load menus ───
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/menus", {
        params: {
          search,
          category_id: categoryFilter || undefined,
          page,
          limit: 12,
        },
      });
      setList(data.data);
      setMeta(data.meta);
    } catch (e: any) {
      const msg = e.response?.data?.message ?? "Gagal memuat menu";
      toast.error("Gagal memuat menu", msg);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, categoryFilter, page]);

  // ─── Load categories ───
  const loadCategories = useCallback(async () => {
    try {
      const { data } = await api.get("/categories");
      setCategories(data.data);
    } catch {}
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load();
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // ─── Delete menu ───
  const remove = async (id: number, name: string) => {
    if (!confirm(`Hapus menu "${name}"?`)) return;
    try {
      await api.delete(`/menus/${id}`);
      toast.success("Menu dihapus", `Menu "${name}" berhasil dihapus`);
      await load();
    } catch (e: any) {
      const msg = e.response?.data?.message ?? "Gagal menghapus menu";
      toast.error("Gagal menghapus", msg);
    }
  };

  // ─── Export Excel ───
  const exportExcel = () => {
    toast.info("Menyiapkan Excel...", "File akan otomatis terunduh");
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (categoryFilter) params.category_id = String(categoryFilter);
    window.open(fileUrl("/menus/export/excel", params), "_blank");
  };

  return (
    <AppShell>
      <div className="space-y-4">
        <PageHeader
          title="Kelola Menu"
          subtitle="Manajemen menu & kategori makanan"
          actions={
            <>
              <button
                onClick={() => setShowCategory(true)}
                className="btn-ghost"
              >
                <Tag size={14} /> Kelola Kategori
              </button>
              <button
                onClick={exportExcel}
                className="btn-ghost"
                title="Export daftar menu ke Excel"
              >
                <FileSpreadsheet size={14} /> Excel
              </button>
              <button onClick={load} className="btn-ghost" disabled={loading}>
                <RefreshCw
                  size={14}
                  className={loading ? "animate-spin" : ""}
                />{" "}
                Refresh
              </button>
              <button
                onClick={() => {
                  setEditing(null);
                  setShowForm(true);
                }}
                className="btn-primary"
              >
                <Plus size={14} /> Tambah Menu
              </button>
            </>
          }
        />

        {/* ─── FILTER BAR ─── */}
        <div className="card card-pad">
          <div className="flex flex-wrap gap-3 items-center">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Cari nama / deskripsi menu..."
            />
            <select
              className="input w-48"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(
                  e.target.value === "" ? "" : Number(e.target.value)
                );
                setPage(1);
              }}
            >
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ─── GRID MENU ─── */}
        {loading && list.length === 0 ? (
          <div className="card card-pad">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200 p-4 animate-pulse"
                >
                  <div className="h-32 bg-slate-100 rounded-lg mb-3" />
                  <div className="h-4 bg-slate-100 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          </div>
        ) : list.length === 0 ? (
          <div className="card card-pad">
            <EmptyState message="Belum ada menu. Klik 'Tambah Menu' untuk mulai." />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {list.map((m) => (
              <MenuCard
                key={m.id}
                menu={m}
                onEdit={() => {
                  setEditing(m);
                  setShowForm(true);
                }}
                onDelete={() => remove(m.id, m.name)}
              />
            ))}
          </div>
        )}

        {meta.total_page > 1 && (
          <div className="card card-pad">
            <Pagination
              page={meta.page}
              totalPage={meta.total_page}
              total={meta.total}
              onChange={setPage}
            />
          </div>
        )}

        {/* ─── MODALS ─── */}
        {showForm && (
          <MenuFormModal
            menu={editing}
            categories={categories}
            onClose={() => setShowForm(false)}
            onSuccess={() => {
              setShowForm(false);
              toast.success(
                editing ? "Menu diperbarui" : "Menu ditambahkan",
                editing
                  ? `Menu "${editing.name}" berhasil diupdate`
                  : "Menu baru berhasil disimpan"
              );
              load();
            }}
          />
        )}

        {showCategory && (
          <CategoryModal
            categories={categories}
            onClose={() => setShowCategory(false)}
            onRefresh={() => {
              loadCategories();
              load();
            }}
          />
        )}
      </div>
    </AppShell>
  );
}

// ═══════════════════════════════════════════════════════════
// MENU CARD
// ═══════════════════════════════════════════════════════════
function MenuCard({
  menu,
  onEdit,
  onDelete,
}: {
  menu: Menu;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group card rounded-2xl overflow-hidden hover:shadow-lg transition-all flex flex-col">
      {/* Image / Placeholder */}
      <div className="relative aspect-video bg-gradient-to-br from-brand-100 to-accent-100 flex items-center justify-center overflow-hidden">
        {menu.image ? (
          <img
            src={menu.image}
            alt={menu.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <UtensilsCrossed size={48} className="text-brand-400 opacity-60" />
        )}

        {/* Status badge */}
        <div className="absolute top-2 right-2">
          {menu.is_available ? (
            <span className="badge bg-emerald-100 text-emerald-700 border border-emerald-200">
              <CheckCircle2 size={10} /> Tersedia
            </span>
          ) : (
            <span className="badge bg-red-100 text-red-700 border border-red-200">
              <XCircle size={10} /> Habis
            </span>
          )}
        </div>

        {/* Category badge */}
        {menu.category && (
          <div className="absolute top-2 left-2">
            <span className="badge bg-white/90 text-slate-700 border border-slate-200 backdrop-blur">
              {menu.category.name}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-bold text-slate-800 truncate">{menu.name}</h3>
        <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[2rem]">
          {menu.description || "Tidak ada deskripsi"}
        </p>

        <div className="mt-auto pt-3 flex items-center justify-between">
          <span className="text-lg font-black text-brand-700 tabular-nums">
            {rupiah(menu.price)}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={onEdit}
              className="p-2 rounded-lg hover:bg-brand-50 text-brand-600 transition"
              title="Edit"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={onDelete}
              className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition"
              title="Hapus"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}