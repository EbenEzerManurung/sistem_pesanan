"use client";
import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/auth";
import { X, LogIn, Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function LoginModal({ onClose }: { onClose: () => void }) {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("superadmin@mail.com");
  const [password, setPassword] = useState("password");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // Close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const user = await login(email, password);
      onClose();
      if (user.role.name === "user") {
        router.refresh();
      } else {
        router.push("/orders");
      }
    } catch (e: any) {
      setErr(e.response?.data?.message ?? "Login gagal");
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (e: string) => {
    setEmail(e);
    setPassword("password");
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white shadow-sm">
              <LogIn size={14} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 leading-tight">Login</h2>
              <p className="text-[10px] text-slate-500">Akses panel admin</p>
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
        <div className="p-4 space-y-3">
          {err && (
            <div className="bg-red-50 text-red-600 p-2.5 rounded-lg text-xs border border-red-100 flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
              {err}
            </div>
          )}

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              autoComplete="email"
            />
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                className="input pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {show ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? (
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <>
                <LogIn size={14} /> Masuk
              </>
            )}
          </button>

          <div className="pt-3 border-t border-slate-100">
            <p className="text-[11px] text-slate-500 mb-2 flex items-center gap-1">
              <ShieldCheck size={11} /> Demo (password: password)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                ["superadmin@mail.com", "Super Admin"],
                ["admin@mail.com", "Admin"],
                ["cashier@mail.com", "Kasir"],
              ].map(([e, label]) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => quickLogin(e)}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 hover:bg-brand-100 text-slate-600 hover:text-brand-700 transition"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}