"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/auth";

export default function LoginPage() {
  const r = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      r.replace(user.role.name === "user" ? "/dashboard" : "/orders");
    } else if (!loading) {
      // Balik ke dashboard publik
      r.replace("/dashboard");
    }
  }, [r, user, loading]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
    </div>
  );
}