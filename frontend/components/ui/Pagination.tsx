"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  page, totalPage, total, onChange,
}: {
  page: number; totalPage: number; total: number; onChange: (p: number) => void;
}) {
  if (totalPage <= 1) return null;

  const pages: (number | "...")[] = [];
  const range = 1;
  for (let i = 1; i <= totalPage; i++) {
    if (i === 1 || i === totalPage || (i >= page - range && i <= page + range)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-2 border-t border-slate-100">
      <div className="text-xs text-slate-500">
        Menampilkan halaman <b>{page}</b> dari <b>{totalPage}</b> · total <b>{total}</b> data
      </div>
      <div className="flex items-center gap-1">
        <button className="btn-ghost btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          <ChevronLeft size={14} />
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`e${i}`} className="px-2 text-slate-400 text-xs">…</span>
          ) : (
            <button
              key={p}
              className={`w-8 h-8 rounded-lg text-xs font-medium transition ${
                p === page
                  ? "bg-gradient-to-r from-brand-500 to-accent-500 text-white shadow-sm"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-brand-300"
              }`}
              onClick={() => onChange(p)}
            >
              {p}
            </button>
          )
        )}
        <button className="btn-ghost btn-sm" disabled={page >= totalPage} onClick={() => onChange(page + 1)}>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}