import type { OrderStatus } from "@/types";

const MAP: Record<OrderStatus, { label: string; cls: string; dot: string }> = {
  waiting: { label: "Waiting", cls: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  processing: { label: "Processing", cls: "bg-sky-100 text-sky-700", dot: "bg-sky-500" },
  done: { label: "Done", cls: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  cancelled: { label: "Cancelled", cls: "bg-red-100 text-red-700", dot: "bg-red-500" },
};

export default function StatusBadge({ status }: { status: OrderStatus }) {
  const m = MAP[status] ?? MAP.waiting;
  return (
    <span className={`badge ${m.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}