import { Inbox } from "lucide-react";

export default function EmptyState({ message = "Tidak ada data" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      <Inbox size={40} className="mb-3 opacity-50" />
      <div className="text-sm">{message}</div>
    </div>
  );
}