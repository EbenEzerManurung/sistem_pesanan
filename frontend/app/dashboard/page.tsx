"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { api, API_BASE } from "@/lib/api";
import type { Order, DashboardStats } from "@/types";
import PublicHeader from "@/components/PublicHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  Clock,
  ChefHat,
  CheckCircle2,
  Wifi,
  WifiOff,
  Activity,
  CalendarDays,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════
export default function DashboardPage() {
  const [waiting, setWaiting] = useState<Order[]>([]);
  const [processing, setProcessing] = useState<Order[]>([]);
  const [done, setDone] = useState<Order[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadStats = useCallback(async () => {
    try {
      const { data } = await api.get("/dashboard/stats");
      setStats(data.data);
    } catch {}
  }, []);

  const loadWaiting = useCallback(async () => {
    try {
      const { data } = await api.get("/dashboard/waiting");
      setWaiting(data.data);
      setLastUpdate(new Date());
    } catch {}
  }, []);

  const loadProcessing = useCallback(async () => {
    try {
      const { data } = await api.get("/dashboard/processing");
      setProcessing(data.data);
      setLastUpdate(new Date());
    } catch {}
  }, []);

  const loadDone = useCallback(async () => {
    try {
      const { data } = await api.get("/dashboard/done");
      setDone(data.data);
      setLastUpdate(new Date());
    } catch {}
  }, []);

  const loadAll = useCallback(async () => {
    await Promise.all([loadWaiting(), loadProcessing(), loadDone(), loadStats()]);
  }, [loadWaiting, loadProcessing, loadDone, loadStats]);

  useEffect(() => {
    let isMounted = true;
    loadAll();

    const connect = () => {
      if (!isMounted) return;
      const token = localStorage.getItem("token") ?? "";
      const url = token
        ? `${API_BASE}/stream/orders?token=${token}`
        : `${API_BASE}/stream/orders`;
      const es = new EventSource(url);
      esRef.current = es;

      es.onopen = () => setConnected(true);
      es.onerror = () => {
        setConnected(false);
        es.close();
        if (retryRef.current) clearTimeout(retryRef.current);
        retryRef.current = setTimeout(connect, 5000);
      };
      es.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          switch (msg.type) {
            case "waiting.init":
            case "waiting.update":
              setWaiting(msg.data);
              setLastUpdate(new Date());
              break;
            case "processing.init":
            case "processing.update":
              setProcessing(msg.data);
              setLastUpdate(new Date());
              break;
            case "done.init":
            case "done.update":
              setDone(msg.data);
              setLastUpdate(new Date());
              break;
            case "order.created":
            case "order.paid":
            case "order.updated":
              loadStats();
              break;
          }
        } catch {}
      };
    };

    connect();

    const poll = setInterval(() => {
      if (!esRef.current || esRef.current.readyState !== EventSource.OPEN) {
        loadAll();
      }
    }, 15000);

    return () => {
      isMounted = false;
      if (retryRef.current) clearTimeout(retryRef.current);
      if (esRef.current) esRef.current.close();
      clearInterval(poll);
    };
  }, [loadAll, loadStats]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <PublicHeader />

      <main className="flex-1 min-h-0 flex flex-col gap-2 p-2 md:p-3">
        {/* ═══════════ HEADER BAR ═══════════ */}
        <div className="flex items-center justify-between gap-3 flex-wrap shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white shadow-md">
              <Activity className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black text-slate-900 leading-tight">
                Monitoring Order
              </h1>
              <p className="text-[11px] text-slate-500 leading-tight">
                Realtime · data hari ini
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                connected
                  ? "bg-emerald-50 text-emerald-700 border-2 border-emerald-300"
                  : "bg-red-50 text-red-600 border-2 border-red-300"
              }`}
            >
              <span className="relative flex w-2 h-2">
                <span
                  className={`absolute inset-0 rounded-full ${
                    connected ? "bg-emerald-500 animate-ping" : "bg-red-500"
                  }`}
                />
                <span
                  className={`relative w-2 h-2 rounded-full ${
                    connected ? "bg-emerald-500" : "bg-red-500"
                  }`}
                />
              </span>
              {connected ? (
                <>
                  <Wifi size={12} /> Live
                </>
              ) : (
                <>
                  <WifiOff size={12} /> Offline
                </>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <CalendarDays size={12} />
              {new Date().toLocaleDateString("id-ID", {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
              {lastUpdate && (
                <span className="text-slate-400 hidden md:inline">
                  · {lastUpdate.toLocaleTimeString("id-ID")}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ═══════════ STAT CARDS ═══════════ */}
        <div className="grid grid-cols-3 gap-2 md:gap-3 shrink-0">
          <StatCard
            label="Waiting"
            value={stats?.waiting ?? 0}
            icon={<Clock className="w-4 h-4" />}
            color="from-amber-400 to-orange-500"
          />
          <StatCard
            label="Processing"
            value={stats?.processing ?? 0}
            icon={<ChefHat className="w-4 h-4" />}
            color="from-brand-500 to-sky-600"
          />
          <StatCard
            label="Done"
            value={stats?.done ?? 0}
            icon={<CheckCircle2 className="w-4 h-4" />}
            color="from-accent-500 to-emerald-600"
          />
        </div>

        {/* ═══════════ 3 KOLOM: WAITING / PROCESSING / DONE ═══════════ */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
          <SectionColumn
            icon={<Clock size={16} />}
            iconBg="from-amber-400 to-orange-500"
            iconColor="text-amber-700"
            title="Waiting"
            subtitle={
              <>
                <b className="text-amber-700">paid_at ASC</b> · 5 teratas
              </>
            }
            count={waiting.length}
            emptyIcon={<Clock size={36} />}
            emptyMessage="Belum ada order waiting"
            tone="amber"
            timeKey="paid_at"
          >
            {waiting.map((o, i) => (
              <OrderRow key={o.id} order={o} index={i} tone="amber" timeKey="paid_at" />
            ))}
          </SectionColumn>

          <SectionColumn
            icon={<ChefHat size={16} />}
            iconBg="from-brand-500 to-sky-600"
            iconColor="text-brand-700"
            title="Processing"
            subtitle={
              <>
                <b className="text-brand-700">paid_at ASC</b> · 5 teratas
              </>
            }
            count={processing.length}
            emptyIcon={<ChefHat size={36} />}
            emptyMessage="Belum ada order processing"
            tone="brand"
            timeKey="paid_at"
          >
            {processing.map((o, i) => (
              <OrderRow key={o.id} order={o} index={i} tone="brand" timeKey="paid_at" />
            ))}
          </SectionColumn>

          <SectionColumn
            icon={<CheckCircle2 size={16} />}
            iconBg="from-accent-500 to-emerald-600"
            iconColor="text-emerald-700"
            title="Done"
            subtitle={
              <>
                <b className="text-emerald-700">done_at ASC</b> · 5 teratas
              </>
            }
            count={done.length}
            emptyIcon={<CheckCircle2 size={36} />}
            emptyMessage="Belum ada order done"
            tone="emerald"
            timeKey="done_at"
          >
            {done.map((o, i) => (
              <OrderRow key={o.id} order={o} index={i} tone="emerald" timeKey="done_at" />
            ))}
          </SectionColumn>
        </div>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════════════════════════
function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="relative rounded-xl bg-white shadow-sm border border-slate-200/60 overflow-hidden">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${color}`} />
      <div className="px-3 py-2 md:px-4 md:py-2.5 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider truncate">
            {label}
          </div>
          <div className="text-2xl md:text-3xl font-black text-slate-900 tabular-nums leading-none mt-0.5">
            {value}
          </div>
        </div>
        <div
          className={`shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br ${color} text-white flex items-center justify-center shadow-sm`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// SECTION COLUMN
// ═══════════════════════════════════════════════════════════
type Tone = "amber" | "brand" | "emerald";

const TONE_MAP: Record<
  Tone,
  {
    border: string;
    bg: string;
    hoverBorder: string;
    numBg: string;
    qtyColor: string;
  }
> = {
  amber: {
    border: "border-amber-200",
    bg: "from-amber-50/70 to-white",
    hoverBorder: "hover:border-amber-400",
    numBg: "from-amber-400 to-orange-500",
    qtyColor: "text-amber-600",
  },
  brand: {
    border: "border-brand-200",
    bg: "from-brand-50/70 to-white",
    hoverBorder: "hover:border-brand-400",
    numBg: "from-brand-500 to-sky-600",
    qtyColor: "text-brand-600",
  },
  emerald: {
    border: "border-emerald-200",
    bg: "from-emerald-50/70 to-white",
    hoverBorder: "hover:border-emerald-400",
    numBg: "from-accent-500 to-emerald-600",
    qtyColor: "text-emerald-600",
  },
};

function SectionColumn({
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  count,
  emptyIcon,
  emptyMessage,
  tone,
  timeKey,
  children,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: React.ReactNode;
  count: number;
  emptyIcon: React.ReactNode;
  emptyMessage: string;
  tone: Tone;
  timeKey: "paid_at" | "done_at";
  children: React.ReactNode;
}) {
  const isEmpty = count === 0;
  return (
    <div className="flex flex-col min-h-0 rounded-xl bg-white shadow-sm border border-slate-200/60 overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-3 py-2 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-7 h-7 rounded-lg bg-gradient-to-br ${iconBg} text-white flex items-center justify-center shadow-sm shrink-0`}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <h2 className={`text-base md:text-lg font-bold ${iconColor} truncate leading-tight`}>
              {title}
            </h2>
            <p className="text-[10px] md:text-xs text-slate-500 truncate leading-tight">
              {subtitle}
            </p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
          <span className="text-[9px] font-bold text-slate-500 uppercase">
            Total
          </span>
          <span className="text-base md:text-lg font-black text-slate-800 tabular-nums leading-none">
            {count}
          </span>
        </div>
      </div>

      {/* List area */}
      <div className="flex-1 min-h-0 flex flex-col gap-1.5 p-1.5 md:p-2 overflow-hidden">
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center mb-2 ${
                tone === "emerald"
                  ? "bg-emerald-50"
                  : tone === "brand"
                  ? "bg-brand-50"
                  : "bg-amber-50"
              }`}
            >
              {emptyIcon}
            </div>
            <p className="text-sm font-medium text-center px-4">
              {emptyMessage}
            </p>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// ORDER ROW — universal, dengan tone warna
// ═══════════════════════════════════════════════════════════
function OrderRow({
  order,
  index,
  tone,
  timeKey,
}: {
  order: Order;
  index: number;
  tone: Tone;
  timeKey: "paid_at" | "done_at";
}) {
  const t = TONE_MAP[tone];
  const timeValue = timeKey === "done_at" ? order.done_at : order.paid_at;

  return (
    <div
      className={`relative flex-1 min-h-0 rounded-lg bg-gradient-to-r ${t.bg} border ${t.border} ${t.hoverBorder} hover:shadow transition-all px-2.5 md:px-3 py-2 pl-9 md:pl-10 flex flex-col justify-center gap-1`}
    >
      {/* Nomor urut */}
      <div
        className={`absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gradient-to-br ${t.numBg} text-white text-xs font-black flex items-center justify-center shadow border-2 border-white`}
      >
        {index + 1}
      </div>

      {/* Baris 1: order_code + status */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <span className="text-[10px] md:text-xs font-mono font-semibold text-slate-500 truncate">
          {order.order_code}
        </span>
        <StatusBadge status={order.status} />
      </div>

      {/* Baris 2: nama + meja + waktu */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <span className="text-base md:text-lg font-bold text-slate-900 truncate leading-tight">
          {order.customer_name}
        </span>
        <span className="shrink-0 flex items-center gap-1 text-[10px] md:text-xs font-semibold whitespace-nowrap">
          <span className="px-1.5 py-0.5 rounded bg-white/80 border border-slate-200 text-slate-600">
            Meja {order.table_number || "-"}
          </span>
          <span className="text-slate-400 tabular-nums">
            {timeValue &&
              new Date(timeValue).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              })}
          </span>
        </span>
      </div>
    </div>
  );
}