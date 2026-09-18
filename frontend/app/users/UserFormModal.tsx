"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { User, Role } from "@/types";
import { X, Eye, EyeOff } from "lucide-react";

export default function UserFormModal({
  user,
  roles,
  onClose,
  onSuccess,
}: {
  user: User | null;
  roles: Role[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [roleId, setRoleId] = useState<number>(roles[0]?.id ?? 0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // 🆕 toggle eye
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (user) {
      setRoleId(user.role_id);
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone ?? "");
      setIsActive(user.is_active);
    } else if (roles[0]) {
      setRoleId(roles[0].id);
    }
  }, [user, roles]);

  const submit = async () => {
    setErr("");
    if (!name || !email || !roleId) return setErr("Lengkapi field wajib");
    if (!user && password.length < 6)
      return setErr("Password minimal 6 karakter");
    setSaving(true);
    try {
      const payload: any = {
        role_id: roleId,
        name,
        email,
        phone,
        is_active: isActive,
      };
      if (password) payload.password = password;
      if (user) await api.put(`/users/${user.id}`, payload);
      else await api.post("/users", payload);
      onSuccess();
    } catch (e: any) {
      setErr(e.response?.data?.message ?? "Gagal menyimpan user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-800">
            {user ? "Edit User" : "Tambah User"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div>
            <label className="label">Nama *</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Email *</label>
            <input
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Role *</label>
            <select
              className="input"
              value={roleId}
              onChange={(e) => setRoleId(Number(e.target.value))}
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Telepon</label>
            <input
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {/* ═══════════ PASSWORD dengan EYE TOGGLE ═══════════ */}
          <div>
            <label className="label">
              Password {user ? "(kosongkan jika tidak diubah)" : "*"}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="input pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                tabIndex={-1}
                aria-label={
                  showPassword ? "Sembunyikan password" : "Tampilkan password"
                }
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 accent-brand-500"
            />
            Aktif
          </label>

          {err && (
            <div className="text-xs text-red-600 bg-red-50 rounded-lg p-2">
              {err}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-100 flex justify-end gap-2">
          <button onClick={onClose} className="btn-ghost">
            Batal
          </button>
          <button onClick={submit} disabled={saving} className="btn-primary">
            {saving ? "Menyimpan…" : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}