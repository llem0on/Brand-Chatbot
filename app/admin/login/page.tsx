"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginWithToken } from "@/hooks/useAdminAuth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const ok = await loginWithToken(token);
    setLoading(false);

    if (!ok) {
      setError("Token tidak valid");
      return;
    }
    router.push("/admin");
  }

  return (
    <div className="admin-theme min-h-screen flex" style={{ background: "#4B1D24" }}>
      {/* Left decorative panel */}
      <div className="hidden md:flex w-1/2 items-center justify-center" style={{ background: "#4B1D24" }}>
        <div className="text-center">
          <p className="font-serif text-4xl tracking-[0.15em]" style={{ color: "#EFE4DC" }}>BRAND</p>
          <p className="text-xs tracking-[0.2em] uppercase mt-2" style={{ color: "#A56A6C" }}>Admin Panel</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-8" style={{ background: "#EFE4DC" }}>
        <div className="w-full max-w-sm">
          <p className="font-serif text-2xl tracking-[0.1em] mb-1" style={{ color: "#4B1D24" }}>Selamat datang</p>
          <p className="text-xs tracking-[0.1em] uppercase mb-8" style={{ color: "#A56A6C" }}>Masuk ke admin panel</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="admin-label" htmlFor="token">Admin Token</label>
              <input
                id="token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="admin-input"
                placeholder="Masukkan token admin"
                autoFocus
              />
            </div>
            {error && <p className="text-sm" style={{ color: "#7C2A35" }}>{error}</p>}
            <button type="submit" disabled={loading || !token} className="admin-btn w-full disabled:opacity-50">
              {loading ? "Memeriksa..." : "Masuk"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
