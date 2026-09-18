"use client";
import { create } from "zustand";
import { api } from "@/lib/api";
import type { User } from "@/types";

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (u: User | null) => void;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  loading: true,

  setUser: (u) => set({ user: u, loading: false }),

  login: async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", data.data.token);
    set({ user: data.data.user, loading: false });
    return data.data.user;
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ user: null, loading: false });
    if (typeof window !== "undefined") window.location.href = "/dashboard";
  },

  fetchMe: async () => {
    try {
      const { data } = await api.get("/auth/me");
      set({ user: data.data, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },
}));

export const can = (role: string | undefined, ...allowed: string[]) =>
  !!role && allowed.includes(role);