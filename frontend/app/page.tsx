"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const r = useRouter();
  useEffect(() => {
    r.replace("/dashboard");
  }, [r]);
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
    </div>
  );
}