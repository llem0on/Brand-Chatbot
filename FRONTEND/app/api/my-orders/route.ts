import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const res = await fetch(
    `${API}/api/orders/by-email?email=${encodeURIComponent(session.user.email)}`,
    { cache: "no-store" }
  );

  const data = await res.json();
  return NextResponse.json(data);
}
