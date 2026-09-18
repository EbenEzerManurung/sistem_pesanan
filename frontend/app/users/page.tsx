"use client";
import { useEffect, useState, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { api, fileUrl } from "@/lib/api";
import { tanggal } from "@/lib/format";
import { useToast } from "@/components/ui/Toast"; // 🆕 IMPORT WAJIB
import type { User, Role, PaginationMeta } from "@/types";
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import EmptyState from "@/components/ui/EmptyState";
import { Plus, Pencil, Trash2, RefreshCw } from "lucide-react";
import UserFormModal from "./UserFormModal";

export default function UsersPage() {
  const toast = useToast(); // 🆕 Hook

  const [list, setList] = useState<User[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    total_page: 1,
  });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [editing, setEditing] = useState<User | null>(null);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/users", {
        params: { search, page, limit: 10 },
      });
      setList(data.data);
      setMeta(data.meta);
    } catch (e: any) {
      const msg =
        e.response?.data?.message ?? e.message ?? "Gagal memuat data user";
      toast.error("Gagal memuat data", msg);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/users/roles");
        setRoles(data.data);
      } catch (e: any) {
        const msg = e.response?.data?.message ?? "Gagal memuat roles";
        toast.error("Gagal memuat roles", msg);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load();
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const remove = async (id: number, name: string) => {
    if (!confirm(`Hapus user "${name}"?`)) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success("User dihapus", `User "${name}" berhasil dihapus`);
      await load();
    } catch (e: any) {
      const msg = e.response?.data?.message ?? "Gagal hapus user";
      toast.error("Gagal hapus user", msg);
    }
  };

  return (
    <AppShell>
      <div className="space-y-4">
        <PageHeader
          title="Kelola User"
          subtitle="Manajemen user dan role"
          actions={
            <>
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
                <Plus size={14} /> Tambah User
              </button>
            </>
          }
        />

        <div className="card card-pad">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Cari nama / email / telepon..."
          />
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left py-3 px-4 font-medium">Nama</th>
                  <th className="text-left py-3 px-4 font-medium">Email</th>
                  <th className="text-left py-3 px-4 font-medium">Role</th>
                  <th className="text-left py-3 px-4 font-medium">Telepon</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Dibuat</th>
                  <th className="text-right py-3 px-4 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading && list.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      Memuat data…
                    </td>
                  </tr>
                ) : list.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState message="Belum ada user" />
                    </td>
                  </tr>
                ) : (
                  list.map((u) => (
                    <tr
                      key={u.id}
                      className="border-t border-slate-100 hover:bg-brand-50/40 transition"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-100 to-accent-100 flex items-center justify-center text-brand-700 font-bold text-xs">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-800">
                            {u.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{u.email}</td>
                      <td className="py-3 px-4">
                        <span className="badge bg-brand-100 text-brand-700 uppercase">
                          {u.role.name}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {u.phone || "-"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`badge ${
                            u.is_active
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {u.is_active ? "Aktif" : "Nonaktif"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {tanggal(u.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditing(u);
                              setShowForm(true);
                            }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => remove(u.id, u.name)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 pb-4">
            <Pagination
              page={meta.page}
              totalPage={meta.total_page}
              total={meta.total}
              onChange={setPage}
            />
          </div>
        </div>

        {showForm && (
          <UserFormModal
            user={editing}
            roles={roles}
            onClose={() => setShowForm(false)}
            onSuccess={() => {
              setShowForm(false);
              toast.success(
                editing ? "User berhasil diperbarui" : "User berhasil ditambahkan",
                editing
                  ? `Data "${editing.name}" sudah diperbarui`
                  : "User baru sudah disimpan"
              );
              load();
            }}
          />
        )}
      </div>
    </AppShell>
  );
}