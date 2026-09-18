"use client";
import { useEffect, useState, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { api, fileUrl } from "@/lib/api";
import { rupiah, tanggalJam } from "@/lib/format";
import { useAuth } from "@/store/auth";
import { useToast } from "@/components/ui/Toast";
import type { Order, OrderStatus, PaginationMeta } from "@/types";
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import SearchInput from "@/components/ui/SearchInput";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import { FileSpreadsheet, Printer, Plus, Eye, RefreshCw } from "lucide-react";
import OrderFormModal from "./OrderFormModal";
import OrderDetailModal from "./OrderDetailModal";

export default function OrdersPage() {
  const { user } = useAuth();
  const toast = useToast();

  const [list, setList] = useState<Order[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    total: 0,
    total_page: 1,
  });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [detail, setDetail] = useState<Order | null>(null);

  const role = user?.role.name ?? "";
  const canCreate = ["cashier", "superadmin"].includes(role);
  const canUpdate = ["admin", "superadmin"].includes(role);
  const canPay = ["cashier", "admin", "superadmin"].includes(role);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/orders", {
        params: { search, status, from, to, page, limit: 10 },
      });
      setList(data.data);
      setMeta(data.meta);
    } catch (e: any) {
      toast.error(
        "Gagal memuat data",
        e.response?.data?.message ?? e.message ?? "Terjadi kesalahan"
      );
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, from, to, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      load();
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const updateStatus = async (id: number, s: OrderStatus) => {
    try {
      const { data } = await api.patch(`/orders/${id}/status`, { status: s });
      toast.success(
        "Status berhasil diubah",
        `Order ${data.data.order_code} → ${s}`
      );
      await load();
    } catch (e: any) {
      const msg =
        e.response?.data?.message ?? e.message ?? "Gagal mengubah status";
      toast.error("Gagal mengubah status", msg);
      await load();
    }
  };

  const payOrder = async (id: number) => {
    if (!confirm("Konfirmasi pembayaran order ini?")) return;
    try {
      const { data } = await api.post(`/orders/${id}/pay`);
      toast.success(
        "Pembayaran berhasil",
        `Order ${data.data.order_code} sudah dibayar`
      );
      await load();
    } catch (e: any) {
      const msg =
        e.response?.data?.message ?? e.message ?? "Gagal konfirmasi pembayaran";
      toast.error("Gagal konfirmasi pembayaran", msg);
      await load();
    }
  };

  const printPDF = (id: number) => {
    toast.info("Membuka PDF...", "Struk sedang dibuka di tab baru");
    window.open(fileUrl(`/orders/${id}/pdf`), "_blank");
  };

  const exportExcel = () => {
    toast.info("Menyiapkan Excel...", "File akan otomatis terunduh");
    window.open(
      fileUrl("/reports/orders/excel", { search, status, from, to }),
      "_blank"
    );
  };

  return (
    <AppShell>
      <div className="space-y-4">
        <PageHeader
          title="Order"
          subtitle="Kelola semua order masuk dan statusnya"
          actions={
            <>
              <button onClick={load} className="btn-ghost" disabled={loading}>
                <RefreshCw
                  size={14}
                  className={loading ? "animate-spin" : ""}
                />{" "}
                Refresh
              </button>
              {["admin", "superadmin"].includes(role) && (
                <button onClick={exportExcel} className="btn-ghost">
                  <FileSpreadsheet size={14} /> Excel
                </button>
              )}
              {canCreate && (
                <button
                  onClick={() => setShowForm(true)}
                  className="btn-primary"
                >
                  <Plus size={14} /> Buat Order
                </button>
              )}
            </>
          }
        />

        <div className="card card-pad">
          <div className="flex flex-wrap gap-3 items-center">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Cari kode / pelanggan / meja..."
            />
            <select
              className="input w-40"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Semua Status</option>
              <option value="waiting">Waiting</option>
              <option value="processing">Processing</option>
              <option value="done">Done</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <input
              type="date"
              className="input w-40"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
            />
            <input
              type="date"
              className="input w-40"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left py-3 px-4 font-medium">Kode</th>
                  <th className="text-left py-3 px-4 font-medium">
                    Pelanggan
                  </th>
                  <th className="text-left py-3 px-4 font-medium">Meja</th>
                  <th className="text-left py-3 px-4 font-medium">Total</th>
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
                      <EmptyState message="Belum ada order" />
                    </td>
                  </tr>
                ) : (
                  list.map((o) => (
                    <tr
                      key={o.id}
                      className="border-t border-slate-100 hover:bg-brand-50/40 transition"
                    >
                      <td className="py-3 px-4 font-mono text-xs text-slate-700">
                        {o.order_code}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">
                          {o.customer_name}
                        </div>
                        <div className="text-xs text-slate-400">
                          {o.items?.length ?? 0} item
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {o.table_number || "-"}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {rupiah(o.total)}
                      </td>
                      <td className="py-3 px-4">
                        {canUpdate ? (
                          <select
                            className="input py-1 px-2 text-xs w-32"
                            value={o.status}
                            onChange={(e) =>
                              updateStatus(o.id, e.target.value as OrderStatus)
                            }
                          >
                            <option value="waiting">waiting</option>
                            <option value="processing">processing</option>
                            <option value="done">done</option>
                            <option value="cancelled">cancelled</option>
                          </select>
                        ) : (
                          <StatusBadge status={o.status} />
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500">
                        {tanggalJam(o.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => setDetail(o)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                            title="Detail"
                          >
                            <Eye size={14} />
                          </button>
                          {!o.paid_at && canPay && (
                            <button
                              onClick={() => payOrder(o.id)}
                              className="px-2 py-1 text-xs rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            >
                              Bayar
                            </button>
                          )}
                          <button
                            onClick={() => printPDF(o.id)}
                            className="p-1.5 rounded-lg hover:bg-brand-50 text-brand-600"
                            title="Cetak PDF"
                          >
                            <Printer size={14} />
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
          <OrderFormModal
            onClose={() => setShowForm(false)}
            onSuccess={() => {
              setShowForm(false);
              toast.success(
                "Order berhasil dibuat",
                "Order baru sudah masuk antrian"
              );
              load();
            }}
          />
        )}
        {detail && (
          <OrderDetailModal
            order={detail}
            onClose={() => setDetail(null)}
            onPrint={() => printPDF(detail.id)}
          />
        )}
      </div>
    </AppShell>
  );
}