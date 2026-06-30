"use client";

import { useAdminAuth } from "@/hooks/useAdminAuth";
import AdminSidebar from "./AdminSidebar";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { ready } = useAdminAuth();

  if (!ready) {
    return <div className="admin-theme min-h-screen bg-bg" />;
  }

  return (
    <div className="admin-theme flex min-h-screen text-ink" style={{ background: "#EFE4DC" }}>
      <AdminSidebar />
      <main className="flex-1 px-10 py-9 max-w-6xl">{children}</main>
    </div>
  );
}
