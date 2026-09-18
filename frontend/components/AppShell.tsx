"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/store/auth";

import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  FileBarChart,
  LogOut,
  ChefHat,
  Menu as MenuIcon,
  X,
  User as UserIcon,
  UtensilsCrossed, // 🆕 icon menu
  LayoutGrid,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: string[];
}

const NAV: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["superadmin", "admin", "cashier", "user"],
  },
  {
    href: "/orders",
    label: "Order",
    icon: ShoppingCart,
    roles: ["superadmin", "admin", "cashier"],
  },
{
    href: "/menus",                    // 🆕
    label: "Menu",                     // 🆕
    icon: UtensilsCrossed,             // 🆕
    roles: ["superadmin", "admin"],    // 🆕
  },

  {
    href: "/users",
    label: "Kelola User",
    icon: Users,
    roles: ["superadmin"],
  },
  {
    href: "/reports",
    label: "Laporan",
    icon: FileBarChart,
    roles: ["superadmin", "admin"],
  },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, fetchMe, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) {
      router.replace("/login");
      return;
    }
    if (!user) fetchMe();
  }, [router, user, fetchMe]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const role = user.role.name;
  const nav = NAV.filter((n) => n.roles.includes(role));

  return (
    <div className="min-h-screen flex">
      {/* ═══════════════ SIDEBAR ═══════════════ */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-40 w-64
          bg-white/80 backdrop-blur-xl border-r border-slate-200/60
          flex flex-col transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="flex items-center justify-between gap-2 px-4 py-5 border-b border-slate-200/60">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white shadow-md shadow-brand-500/30">
              <ChefHat size={18} />
            </div>
            <div>
              <div className="font-bold text-slate-800 leading-tight">
                FoodOrder
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wide">
                {role}
              </div>
            </div>
          </div>
          <button
            className="md:hidden text-slate-400 hover:text-slate-700"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {nav.map((n) => {
            const active = pathname.startsWith(n.href);
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition
                  ${
                    active
                      ? "bg-gradient-to-r from-brand-500 to-accent-500 text-white shadow-md shadow-brand-500/25"
                      : "text-slate-600 hover:bg-slate-100"
                  }
                `}
              >
                <Icon size={16} />
                {n.label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar bottom: user info + logout */}
        <div className="p-3 border-t border-slate-200/60">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-100 to-accent-100 flex items-center justify-center text-brand-700 font-bold text-sm">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{user.name}</div>
              <div className="text-[11px] text-slate-500 truncate">
                {user.email}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 transition"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ═══════════════ MAIN ═══════════════ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ─── HEADER ─── */}
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 px-4 md:px-6 py-3 bg-white/70 backdrop-blur border-b border-slate-200/60">
          {/* Left: hamburger + date */}
          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-slate-500 hover:text-slate-800"
              onClick={() => setSidebarOpen(true)}
              aria-label="Buka menu"
            >
              <MenuIcon size={20} />
            </button>
            <div className="text-xs text-slate-500 hidden sm:block">
              {new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </div>
          </div>

          {/* Right: user badge + Panel + Logout */}
          <div className="flex items-center gap-2">
            {/* User badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-sm">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-100 to-accent-100 flex items-center justify-center text-brand-700">
                <UserIcon size={12} />
              </div>
              <span className="text-xs font-medium text-slate-700 truncate max-w-[120px]">
                {user.name}
              </span>
              <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wide">
                {role}
              </span>
            </div>

            {/* Panel button (link ke dashboard publik) */}
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium
                         bg-gradient-to-r from-brand-500 to-accent-500 text-white
                         hover:brightness-110 shadow-sm shadow-brand-500/30 transition"
            >
              <LayoutGrid size={13} />
              <span className="hidden sm:inline">Panel</span>
            </Link>

            {/* Logout button */}
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium
                         bg-white border border-slate-200 text-slate-700
                         hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}