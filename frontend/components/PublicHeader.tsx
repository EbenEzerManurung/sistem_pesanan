"use client";
import { useState } from "react";
import { useAuth } from "@/store/auth";
import { ChefHat, LogIn, LogOut, User as UserIcon, LayoutDashboard } from "lucide-react";
import LoginModal from "./LoginModal";
import Link from "next/link";

export default function PublicHeader() {
  const { user, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/75 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-3">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white shadow-md shadow-brand-500/30 group-hover:scale-105 transition">
              <ChefHat size={18} />
            </div>
            <div>
              <div className="font-bold text-slate-800 leading-tight">
                FoodOrder
              </div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wide">
                Live Monitor
              </div>
            </div>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* User info */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/80 border border-slate-200/60">
                  <UserIcon size={12} className="text-slate-500" />
                  <span className="text-xs font-medium text-slate-700 truncate max-w-[120px]">
                    {user.name}
                  </span>
                  <span className="text-[10px] font-semibold text-brand-600 uppercase">
                    {user.role.name}
                  </span>
                </div>

                {/* Tombol ke panel admin (kalau bukan role user) */}
                {user.role.name !== "user" && (
                  <Link href="/orders" className="btn-primary btn-sm">
                    <LayoutDashboard size={13} />
                    <span className="hidden sm:inline">Panel</span>
                  </Link>
                )}

                {/* Logout */}
                <button onClick={logout} className="btn-ghost btn-sm">
                  <LogOut size={13} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowLogin(true)}
                className="btn-primary btn-sm"
              >
                <LogIn size={13} />
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  );
}