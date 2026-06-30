"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ADMIN_TOKEN_KEY, getAdminToken } from "@/lib/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

export function useAdminAuth() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getAdminToken();
    if (!token) {
      router.replace("/admin/login");
      return;
    }
    setReady(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ready };
}

export async function loginWithToken(token: string): Promise<boolean> {
  const res = await fetch(`${API_BASE_URL}/admin/faqs`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return false;
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
  return true;
}

export function logoutAdmin() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  window.location.href = "/admin/login";
}
