"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import AppShell from "@/components/AppShell";
import { api, fileUrl } from "@/lib/api";
import { rupiah } from "@/lib/format";
import PageHeader from "@/components/ui/PageHeader";
import {
  FileSpreadsheet,
  FileText,
  Calendar,
  Filter,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Package,
  RefreshCw,
  Clock,
  ChefHat,
  CheckCircle2,
  XCircle,
  X,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════
interface StatusRow {
  status: string;
  total: number;
  sum: number;
}
interface DailyRow {
  date: string;
  total: number;
  count: number;
}
interface Summary {
  total_order: number;
  total_revenue: number;
  avg_order: number;
  total_items: number;
  by_status: StatusRow[];
  daily: DailyRow[];
}

export default function ReportsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/reports/orders/summary", {
        params: { from, to, status, search },
      });
      setSummary(data.data);
    } catch (e: any) {
      const msg =
        e.response?.data?.message ?? e.message ?? "Gagal memuat data laporan";
      console.error("❌ Summary error:", e.response?.status, msg);
      setError(`[${e.response?.status ?? "ERR"}] ${msg}`);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [from, to, status, search]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const download = (path: string) => {
    window.open(fileUrl(path, { from, to, status, search }), "_blank");
  };

  // ─── Chart data ───
  const statusChartData = (summary?.by_status ?? []).map((s) => ({
    name:
      s.status === "waiting"
        ? "Waiting"
        : s.status === "processing"
        ? "Processing"
        : s.status === "done"
        ? "Done"
        : "Cancelled",
    value: s.total,
    revenue: s.sum,
    status: s.status,
  }));

  const dailyChartData = (summary?.daily ?? []).map((d) => ({
    date: new Date(d.date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
    }),
    total: d.total,
    count: d.count,
  }));

  const STATUS_COLORS: Record<string, string> = {
    waiting: "#f59e0b",
    processing: "#0ea5e9",
    done: "#10b981",
    cancelled: "#ef4444",
  };

  const STATUS_ICONS: Record<string, React.ReactNode> = {
    waiting: <Clock size={20} />,
    processing: <ChefHat size={20} />,
    done: <CheckCircle2 size={20} />,
    cancelled: <XCircle size={20} />,
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Laporan"
          subtitle="Analisa & export laporan order"
          actions={
            <button
              onClick={loadSummary}
              className="btn-ghost"
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />{" "}
              Refresh
            </button>
          }
        />

        {/* ═══════════ ERROR ═══════════ */}
        {error && (
          <div className="card card-pad bg-red-50 border-red-200/60 flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0" />
            <div className="flex-1">
              <div className="font-semibold text-red-700 text-sm">
                Gagal memuat summary
              </div>
              <div className="text-xs text-red-600 mt-1">{error}</div>
              <button onClick={loadSummary} className="btn-ghost btn-sm mt-2">
                Coba Lagi
              </button>
            </div>
          </div>
        )}

        {/* ═══════════ FILTER ═══════════ */}
        <div className="card card-pad">
          <div className="flex items-center gap-2 mb-4 text-slate-700">
            <Filter size={16} className="text-brand-500" />
            <span className="font-semibold text-sm">Filter Laporan</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <DateInput label="Dari Tanggal" value={from} onChange={setFrom} />
            <DateInput label="Sampai Tanggal" value={to} onChange={setTo} />

            <div>
              <label className="label">Status</label>
              <select
                className="input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">Semua Status</option>
                <option value="waiting">Waiting</option>
                <option value="processing">Processing</option>
                <option value="done">Done</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="label">Cari</label>
              <input
                className="input"
                placeholder="Kode / pelanggan"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ═══════════ SUMMARY CARDS ═══════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <SummaryCard
            icon={<ShoppingCart size={22} />}
            label="Total Order"
            value={(summary?.total_order ?? 0).toLocaleString("id-ID")}
            color="from-brand-500 to-sky-600"
            variant="number"
          />
          <SummaryCard
            icon={<DollarSign size={22} />}
            label="Total Revenue"
            value={rupiah(summary?.total_revenue ?? 0)}
            color="from-accent-500 to-emerald-600"
            variant="currency"
          />
          <SummaryCard
            icon={<TrendingUp size={22} />}
            label="Rata-rata Order"
            value={rupiah(summary?.avg_order ?? 0)}
            color="from-violet-500 to-purple-600"
            variant="currency"
          />
          <SummaryCard
            icon={<Package size={22} />}
            label="Total Item Terjual"
            value={(summary?.total_items ?? 0).toLocaleString("id-ID")}
            color="from-amber-400 to-orange-500"
            variant="number"
          />
        </div>

        {/* ═══════════ CHARTS ═══════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="card card-pad lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold text-slate-800">
                  Penjualan Harian
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {from || to
                    ? `Periode ${formatTanggal(from) || "awal"} s/d ${
                        formatTanggal(to) || "sekarang"
                      }`
                    : "30 hari terakhir"}
                </p>
              </div>
            </div>

            {dailyChartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
                Belum ada data
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "#64748b" }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#64748b" }}
                      tickFormatter={(v: number) =>
                        v >= 1000000
                          ? `${(v / 1000000).toFixed(1)}jt`
                          : v >= 1000
                          ? `${(v / 1000).toFixed(0)}rb`
                          : `${v}`
                      }
                    />
                    {/* ✅ FIX: pakai (value: any, name: any) */}
                    <Tooltip
                      formatter={(value: any, name: any) =>
                        name === "total"
                          ? [rupiah(Number(value)), "Pendapatan"]
                          : [value, "Order"]
                      }
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                      }}
                    />
                    <Bar
                      dataKey="total"
                      fill="url(#barGradient)"
                      radius={[8, 8, 0, 0]}
                    />
                    <defs>
                      <linearGradient
                        id="barGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor="#0ea5e9" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="card card-pad">
            <h2 className="font-semibold text-slate-800 mb-4">
              Distribusi Status
            </h2>
            {statusChartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-400 text-sm">
                Belum ada data
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={75}
                      innerRadius={45}
                      paddingAngle={3}
                    >
                      {statusChartData.map((entry) => (
                        <Cell
                          key={entry.status}
                          fill={STATUS_COLORS[entry.status] ?? "#94a3b8"}
                        />
                      ))}
                    </Pie>
                    {/* ✅ FIX: pakai (value: any) */}
                    <Tooltip
                      formatter={(value: any) => [`${value} order`, ""]}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      wrapperStyle={{ fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════ STATUS BREAKDOWN ═══════════ */}
        {statusChartData.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {statusChartData.map((s) => {
              const color = STATUS_COLORS[s.status];
              return (
                <div
                  key={s.status}
                  className="card card-pad relative overflow-hidden"
                >
                  <div
                    className="absolute inset-x-0 top-0 h-1"
                    style={{ backgroundColor: color }}
                  />
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">
                      {s.name}
                    </span>
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: color }}
                    >
                      {STATUS_ICONS[s.status]}
                    </div>
                  </div>
                  <div className="text-3xl font-black text-slate-800 tabular-nums">
                    {s.value}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {rupiah(s.revenue)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ═══════════ EXPORT ═══════════ */}
        <div>
          <h2 className="font-semibold text-slate-800 mb-3">Export Laporan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ReportCard
              icon={<FileSpreadsheet size={26} />}
              title="Laporan Order (Excel)"
              desc="Format .xlsx dengan detail semua order, total, dan status"
              color="from-emerald-500 to-accent-500"
              onClick={() => download("/reports/orders/excel")}
              btnLabel="Download Excel"
            />
            <ReportCard
              icon={<FileText size={26} />}
              title="Laporan Order (PDF)"
              desc="Format PDF landscape, ringkas dan siap cetak"
              color="from-brand-500 to-sky-600"
              onClick={() => download("/reports/orders/pdf")}
              btnLabel="Download PDF"
            />
          </div>
        </div>

        {/* ═══════════ TIPS ═══════════ */}
        <div className="card card-pad bg-amber-50/50 border-amber-200/60">
          <div className="text-sm text-amber-800">
            <b>Tips:</b> Kosongkan filter tanggal untuk default 30 hari
            terakhir. Pilih rentang tanggal dan/atau status untuk hasil
            spesifik. Klik <b>Refresh</b> untuk memuat ulang summary.
          </div>
        </div>
      </div>
    </AppShell>
  );
}

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════

function formatTanggal(iso: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

// ═══════════════════════════════════════════════════════════
// SUB COMPONENTS
// ═══════════════════════════════════════════════════════════

function DateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    const el = inputRef.current;
    if (!el) return;
    if ("showPicker" in el && typeof el.showPicker === "function") {
      try {
        el.showPicker();
        return;
      } catch {
        /* fallback di bawah */
      }
    }
    el.focus();
    el.click();
  };

  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={openPicker}
          className="input text-left flex items-center gap-2 cursor-pointer hover:border-brand-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-400/70"
        >
          <Calendar size={14} className="text-slate-400 shrink-0" />
          <span className={value ? "text-slate-800" : "text-slate-400"}>
            {value ? formatTanggal(value) : "Pilih tanggal"}
          </span>
        </button>

        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition"
            title="Hapus tanggal"
          >
            <X size={14} />
          </button>
        )}

        <input
          ref={inputRef}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 pointer-events-none"
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  color,
  variant = "number",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  variant?: "number" | "currency";
}) {
  const valueClass =
    variant === "currency"
      ? "text-xl sm:text-2xl lg:text-[26px] leading-tight font-black text-slate-800 tabular-nums break-all"
      : "text-3xl md:text-4xl font-black text-slate-800 tabular-nums";

  return (
    <div className="card relative overflow-hidden">
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${color}`}
      />
      <div className="p-4 md:p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
            {label}
          </span>
          <div
            className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} text-white flex items-center justify-center shadow-sm shrink-0`}
          >
            {icon}
          </div>
        </div>

        <div className={valueClass} title={value}>
          {value}
        </div>
      </div>
    </div>
  );
}

function ReportCard({
  icon,
  title,
  desc,
  color,
  onClick,
  btnLabel,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: string;
  onClick: () => void;
  btnLabel: string;
}) {
  return (
    <div className="card card-pad flex flex-col">
      <div
        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} text-white flex items-center justify-center shadow-md mb-4`}
      >
        {icon}
      </div>
      <div className="font-semibold text-slate-800 mb-1 text-lg">{title}</div>
      <div className="text-sm text-slate-500 mb-4">{desc}</div>
      <button onClick={onClick} className="btn-primary mt-auto">
        {btnLabel}
      </button>
    </div>
  );
}