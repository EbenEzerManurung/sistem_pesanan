"use client";
import { X, Printer } from "lucide-react";
import type { Order } from "@/types";
import { rupiah, tanggalJam } from "@/lib/format";
import StatusBadge from "@/components/ui/StatusBadge";

export default function OrderDetailModal({
  order,
  onClose,
  onPrint,
}: {
  order: Order;
  onClose: () => void;
  onPrint: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <div className="font-mono text-xs text-slate-500">{order.order_code}</div>
            <h2 className="font-bold text-slate-800">{order.customer_name}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs text-slate-500">Meja</div>
              <div className="font-medium">{order.table_number || "-"}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Status</div>
              <StatusBadge status={order.status} />
            </div>
            <div>
              <div className="text-xs text-slate-500">Kasir</div>
              <div className="font-medium">{order.cashier?.name || "-"}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Dibuat</div>
              <div className="font-medium">{tanggalJam(order.created_at)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Paid At</div>
              <div className="font-medium">{order.paid_at ? tanggalJam(order.paid_at) : "-"}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Done At</div>
              <div className="font-medium">{order.done_at ? tanggalJam(order.done_at) : "-"}</div>
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500 mb-2">Item</div>
            <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
              {order.items.map((it) => (
                <div key={it.id} className="p-3 flex justify-between text-sm">
                  <div>
                    <div className="font-medium">{it.menu_name || it.menu?.name}</div>
                    <div className="text-xs text-slate-500">{it.qty} × {rupiah(it.price)}</div>
                  </div>
                  <div className="font-semibold">{rupiah(it.subtotal)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span>{rupiah(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Diskon</span>
                <span>- {rupiah(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-2 border-t border-slate-200">
              <span>Total</span>
              <span className="text-brand-700">{rupiah(order.total)}</span>
            </div>
          </div>

          {order.notes && (
            <div className="text-sm">
              <div className="text-xs text-slate-500 mb-1">Catatan</div>
              <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-amber-800">{order.notes}</div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">Tutup</button>
          <button onClick={onPrint} className="btn-primary">
            <Printer size={14} /> Cetak PDF
          </button>
        </div>
      </div>
    </div>
  );
}