"use client";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { rupiah } from "@/lib/format";
import { useToast } from "@/components/ui/Toast";
import type { Menu, Category } from "@/types";
import {
  X,
  Plus,
  Minus,
  ShoppingCart,
  Search,
  Trash2,
  PackageCheck,
} from "lucide-react";

interface LineItem {
  menu_id: number;
  qty: number;
  menu?: Menu;
}

export default function OrderFormModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const toast = useToast();

  const [menus, setMenus] = useState<Menu[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCat, setActiveCat] = useState<number | "all">("all");
  const [search, setSearch] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [discount, setDiscount] = useState(0);
  const [paid, setPaid] = useState(true);
  const [lines, setLines] = useState<LineItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // ─── Load menus & categories ───
  useEffect(() => {
    (async () => {
      try {
        const [m, c] = await Promise.all([
          api.get("/menus", { params: { limit: 200 } }),
          api.get("/categories"),
        ]);
        setMenus(m.data.data);
        setCategories(c.data.data);
      } catch {
        toast.error("Gagal memuat data menu", "Coba refresh halaman");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Peta qty per menu untuk lookup cepat ───
  const qtyMap = useMemo(() => {
    const map: Record<number, number> = {};
    for (const l of lines) map[l.menu_id] = l.qty;
    return map;
  }, [lines]);

  // ─── Filter menu (tetap search di semua kategori) ───
  const filteredMenus = useMemo(() => {
    return menus.filter((m) => {
      if (activeCat !== "all" && m.category_id !== activeCat) return false;
      if (
        search &&
        !m.name.toLowerCase().includes(search.toLowerCase()) &&
        !(m.description ?? "").toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [menus, activeCat, search]);

  // ─── Total item ───
  const totalItem = lines.reduce((s, l) => s + l.qty, 0);

  // ═══════════════════════════════════════════════════════════
  // ✅ FIX: toast dipanggil DI LUAR updater function setLines
  // ═══════════════════════════════════════════════════════════
  const addItem = (menu: Menu) => {
    if (!menu.is_available) {
      toast.warning("Menu tidak tersedia", `${menu.name} sedang habis`);
      return;
    }

    // Hitung qty baru SEBELUM update state
    const existing = lines.find((l) => l.menu_id === menu.id);
    const newQty = existing ? existing.qty + 1 : 1;

    // Update state (pure function, tanpa side-effect)
    setLines((prev) => {
      const found = prev.find((l) => l.menu_id === menu.id);
      if (found) {
        return prev.map((l) =>
          l.menu_id === menu.id ? { ...l, qty: l.qty + 1 } : l
        );
      }
      return [...prev, { menu_id: menu.id, qty: 1, menu }];
    });

    // ✅ Toast dipanggil SETELAH setLines (di luar updater)
    toast.success("Ditambahkan", `${menu.name} × ${newQty}`);
  };

  // ─── Set qty ───
  const setQty = (id: number, qty: number) => {
    if (qty <= 0) {
      setLines((prev) => prev.filter((l) => l.menu_id !== id));
    } else {
      setLines((prev) =>
        prev.map((l) => (l.menu_id === id ? { ...l, qty } : l))
      );
    }
  };

  // ─── Remove ───
  const removeItem = (id: number) => {
    setLines((prev) => prev.filter((l) => l.menu_id !== id));
  };

  // ─── Hitung ───
  const subtotal = lines.reduce(
    (s, l) => s + (l.menu?.price ?? 0) * l.qty,
    0
  );
  const total = Math.max(subtotal - discount, 0);

  // ─── Submit ───
  const submit = async () => {
    setErr("");
    if (!customerName.trim()) return setErr("Nama pelanggan wajib diisi");
    if (lines.length === 0) return setErr("Pilih minimal 1 menu");

    setSaving(true);
    try {
      await api.post("/orders", {
        customer_name: customerName.trim(),
        table_number: tableNumber.trim(),
        notes: notes.trim(),
        discount,
        paid,
        items: lines.map((l) => ({ menu_id: l.menu_id, qty: l.qty })),
      });
      toast.success("Order dibuat", "Order berhasil disimpan");
      onSuccess();
    } catch (e: any) {
      const msg = e.response?.data?.message ?? "Gagal membuat order";
      setErr(msg);
      toast.error("Gagal membuat order", msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="bg-white w-full md:max-w-6xl h-[92vh] md:h-auto md:max-h-[90vh] rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white">
              <ShoppingCart size={16} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 leading-tight">
                Buat Order Baru
              </h2>
              <p className="text-xs text-slate-500">
                Bisa pilih menu dari kategori mana saja
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {totalItem > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-100 text-brand-700 text-xs font-bold">
                <PackageCheck size={13} />
                {totalItem} item
              </span>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"
              aria-label="Tutup"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* KIRI: MENU LIST */}
          <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-slate-100 overflow-hidden min-h-0">
            <div className="p-4 border-b border-slate-100 space-y-3 shrink-0">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  className="input pl-9"
                  placeholder="Cari menu (nama / deskripsi)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
                <CatPill
                  active={activeCat === "all"}
                  onClick={() => setActiveCat("all")}
                >
                  Semua ({menus.length})
                </CatPill>
                {categories.map((c) => {
                  const count = menus.filter(
                    (m) => m.category_id === c.id
                  ).length;
                  return (
                    <CatPill
                      key={c.id}
                      active={activeCat === c.id}
                      onClick={() => setActiveCat(c.id)}
                    >
                      {c.name} ({count})
                    </CatPill>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              {filteredMenus.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  Menu tidak ditemukan
                  {search && (
                    <div className="mt-1 text-xs">
                      Coba hapus kata kunci pencarian
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {filteredMenus.map((m) => (
                    <MenuCard
                      key={m.id}
                      menu={m}
                      qty={qtyMap[m.id] ?? 0}
                      onAdd={() => addItem(m)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* KANAN: CART */}
          <div className="w-full md:w-96 flex flex-col overflow-hidden min-h-0">
            <div className="p-4 space-y-3 border-b border-slate-100 shrink-0">
              <input
                className="input"
                placeholder="Nama pelanggan *"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="input"
                  placeholder="Meja"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                />
                <input
                  type="number"
                  className="input"
                  placeholder="Diskon (Rp)"
                  value={discount || ""}
                  onChange={(e) =>
                    setDiscount(Number(e.target.value) || 0)
                  }
                  min={0}
                />
              </div>
              <input
                className="input"
                placeholder="Catatan (opsional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
              {lines.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-sm">
                  <ShoppingCart
                    size={32}
                    className="mx-auto mb-2 opacity-40"
                  />
                  Keranjang kosong
                  <div className="text-xs mt-1">
                    Klik menu di kiri untuk menambahkan
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between px-1 pb-1 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                      Keranjang
                    </span>
                    <span className="text-xs font-bold text-brand-600">
                      {lines.length} menu · {totalItem} item
                    </span>
                  </div>

                  {lines.map((l) => (
                    <div
                      key={l.menu_id}
                      className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-slate-800 truncate">
                          {l.menu?.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {rupiah(l.menu?.price ?? 0)} × {l.qty} ={" "}
                          <span className="font-semibold text-slate-700">
                            {rupiah((l.menu?.price ?? 0) * l.qty)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setQty(l.menu_id, l.qty - 1)}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition"
                          aria-label="Kurangi"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-7 text-center text-sm font-bold tabular-nums">
                          {l.qty}
                        </span>
                        <button
                          onClick={() => setQty(l.menu_id, l.qty + 1)}
                          className="w-7 h-7 rounded-lg bg-brand-500 text-white flex items-center justify-center hover:bg-brand-600 transition"
                          aria-label="Tambah"
                        >
                          <Plus size={12} />
                        </button>
                        <button
                          onClick={() => removeItem(l.menu_id)}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-red-500 hover:bg-red-50 ml-0.5 transition"
                          aria-label="Hapus"
                          title="Hapus dari keranjang"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 space-y-2 bg-slate-50/50 shrink-0">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium tabular-nums">
                  {rupiah(subtotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Diskon</span>
                <span className="font-medium text-red-500 tabular-nums">
                  - {rupiah(discount)}
                </span>
              </div>
              <div className="flex justify-between text-base pt-2 border-t border-slate-200">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-brand-700 tabular-nums text-lg">
                  {rupiah(total)}
                </span>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={paid}
                  onChange={(e) => setPaid(e.target.checked)}
                  className="w-4 h-4 accent-brand-500 cursor-pointer"
                />
                Tandai sudah dibayar
              </label>
              {err && (
                <div className="text-xs text-red-600 bg-red-50 rounded-lg p-2">
                  {err}
                </div>
              )}
              <button
                onClick={submit}
                disabled={saving || lines.length === 0}
                className="btn-primary w-full mt-2"
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Menyimpan…
                  </>
                ) : (
                  <>Simpan Order ({totalItem} item)</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MENU CARD
// ═══════════════════════════════════════════════════════════
function MenuCard({
  menu,
  qty,
  onAdd,
}: {
  menu: Menu;
  qty: number;
  onAdd: () => void;
}) {
  const inCart = qty > 0;
  const disabled = !menu.is_available;

  return (
    <button
      type="button"
      onClick={onAdd}
      disabled={disabled}
      className={`
        group relative text-left p-3 rounded-xl border-2 transition-all
        ${
          disabled
            ? "opacity-40 cursor-not-allowed border-slate-200 bg-slate-50"
            : inCart
            ? "border-brand-500 bg-brand-50 shadow-md"
            : "border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50/60 hover:shadow"
        }
      `}
    >
      {inCart && (
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-white text-xs font-black flex items-center justify-center shadow-md border-2 border-white">
          {qty}
        </div>
      )}

      {!menu.is_available && (
        <div className="absolute top-1.5 right-1.5 badge bg-red-100 text-red-700 border border-red-200 text-[10px]">
          Habis
        </div>
      )}

      <div className="pr-6">
        <div className="font-semibold text-sm text-slate-800 line-clamp-2 min-h-[2.5rem]">
          {menu.name}
        </div>
        <div className="text-xs text-brand-600 font-bold mt-1 tabular-nums">
          {rupiah(menu.price)}
        </div>
      </div>

      {!disabled && (
        <div
          className={`
            absolute bottom-2 right-2 w-6 h-6 rounded-full flex items-center justify-center
            transition-all
            ${
              inCart
                ? "bg-brand-500 text-white"
                : "bg-slate-100 text-slate-500 group-hover:bg-brand-500 group-hover:text-white"
            }
          `}
        >
          <Plus size={13} />
        </div>
      )}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════
// CATEGORY PILL
// ═══════════════════════════════════════════════════════════
function CatPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition
        ${
          active
            ? "bg-gradient-to-r from-brand-500 to-accent-500 text-white shadow-sm"
            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        }
      `}
    >
      {children}
    </button>
  );
}