"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════
export type ToastVariant = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: number;
  variant: ToastVariant;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (
    variant: ToastVariant,
    title: string,
    message?: string,
    duration?: number
  ) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// ═══════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error(
      "useToast harus dipakai di dalam <ToastProvider>. " +
        "Pastikan app/layout.tsx sudah membungkus children dengan <ToastProvider>."
    );
  }
  return ctx;
}

// ═══════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ═══════════════════════════════════════════════════════════
  // ✅ FIX: Defer setState pakai queueMicrotask
  //
  // Kalau toast dipanggil di dalam render phase komponen lain
  // (mis. di dalam setState updater), maka setToasts akan
  // dieksekusi SETELAH render phase selesai — sehingga tidak
  // memicu error "Cannot update a component while rendering".
  // ═══════════════════════════════════════════════════════════
  const toast = useCallback(
    (
      variant: ToastVariant,
      title: string,
      message?: string,
      duration: number = 4000
    ) => {
      const id = Date.now() + Math.random();

      // Defer ke microtask → aman dipanggil dari mana saja
      queueMicrotask(() => {
        setToasts((prev) => [
          ...prev,
          { id, variant, title, message, duration },
        ]);

        if (duration > 0) {
          setTimeout(() => remove(id), duration);
        }
      });
    },
    [remove]
  );

  const success = useCallback(
    (title: string, message?: string) => toast("success", title, message, 4000),
    [toast]
  );
  const error = useCallback(
    (title: string, message?: string) => toast("error", title, message, 6000),
    [toast]
  );
  const warning = useCallback(
    (title: string, message?: string) => toast("warning", title, message, 5000),
    [toast]
  );
  const info = useCallback(
    (title: string, message?: string) => toast("info", title, message, 4000),
    [toast]
  );

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onClose={remove} />
    </ToastContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════
// CONTAINER
// ═══════════════════════════════════════════════════════════
function ToastContainer({
  toasts,
  onClose,
}: {
  toasts: ToastItem[];
  onClose: (id: number) => void;
}) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-[calc(100%-2rem)] sm:w-96 max-w-md pointer-events-none">
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onClose={() => onClose(t.id)} />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// VARIANTS CONFIG
// ═══════════════════════════════════════════════════════════
const VARIANTS: Record<
  ToastVariant,
  {
    icon: ReactNode;
    border: string;
    iconBg: string;
    iconColor: string;
    titleColor: string;
    bar: string;
  }
> = {
  success: {
    icon: <CheckCircle2 size={20} />,
    border: "border-emerald-200",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    titleColor: "text-emerald-800",
    bar: "bg-emerald-500",
  },
  error: {
    icon: <XCircle size={20} />,
    border: "border-red-200",
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    titleColor: "text-red-800",
    bar: "bg-red-500",
  },
  warning: {
    icon: <AlertTriangle size={20} />,
    border: "border-amber-200",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    titleColor: "text-amber-800",
    bar: "bg-amber-500",
  },
  info: {
    icon: <Info size={20} />,
    border: "border-sky-200",
    iconBg: "bg-sky-100",
    iconColor: "text-sky-600",
    titleColor: "text-sky-800",
    bar: "bg-sky-500",
  },
};

// ═══════════════════════════════════════════════════════════
// TOAST CARD
// ═══════════════════════════════════════════════════════════
function ToastCard({
  toast,
  onClose,
}: {
  toast: ToastItem;
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const v = VARIANTS[toast.variant];

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setLeaving(true);
    setTimeout(onClose, 250);
  };

  return (
    <div
      className={`
        pointer-events-auto relative overflow-hidden
        bg-white ${v.border} border-2 rounded-xl shadow-lg
        transition-all duration-300 ease-out
        ${
          visible && !leaving
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0"
        }
      `}
    >
      {toast.duration && toast.duration > 0 && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-slate-100">
          <div
            className={`h-full ${v.bar}`}
            style={{
              animation: `toast-progress ${toast.duration}ms linear forwards`,
            }}
          />
        </div>
      )}

      <div className="p-3 md:p-4 flex items-start gap-3">
        <div
          className={`shrink-0 w-9 h-9 rounded-full ${v.iconBg} ${v.iconColor} flex items-center justify-center`}
        >
          {v.icon}
        </div>

        <div className="flex-1 min-w-0 pt-0.5">
          <div className={`font-bold text-sm ${v.titleColor}`}>
            {toast.title}
          </div>
          {toast.message && (
            <div className="text-xs text-slate-600 mt-0.5 break-words">
              {toast.message}
            </div>
          )}
        </div>

        <button
          onClick={handleClose}
          className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          aria-label="Tutup"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}