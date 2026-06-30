"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Already logged in → redirect home
  useEffect(() => {
    if (status === "authenticated") router.replace("/");
  }, [status, router]);

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: "var(--color-bg)" }}>
        <div style={{ width: 2, height: 32, background: "var(--color-accent)", animation: "pulse 1s ease infinite" }} />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ background: "var(--color-bg)" }}
    >
      {/* scanline texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.03) 3px,rgba(0,0,0,0.03) 6px)" }}
      />

      {/* glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 480,
          height: 480,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(200,183,158,0.08) 0%, transparent 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center" style={{ maxWidth: 380, width: "100%", padding: "0 24px" }}>

        {/* brand */}
        <a
          href="/"
          className="font-serif text-3xl tracking-[0.18em] text-ink mb-14 hover:text-accent transition-colors"
        >
          BRAND
        </a>

        {/* card — uses surface so it adapts to theme */}
        <div
          style={{
            width: "100%",
            border: "1px solid var(--color-border)",
            padding: "40px 36px",
            background: "var(--color-surface)",
            boxShadow: "0 8px 48px rgba(42,36,34,0.35), 0 2px 12px rgba(42,36,34,0.18)",
            transition: "box-shadow 0.4s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.boxShadow =
              "0 16px 80px rgba(42,36,34,0.5), 0 4px 24px rgba(42,36,34,0.28), 0 0 120px rgba(200,183,158,0.15)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.boxShadow =
              "0 8px 48px rgba(42,36,34,0.35), 0 2px 12px rgba(42,36,34,0.18)";
          }}
        >
          {/* label */}
          <div style={{ fontSize: 8, letterSpacing: "0.38em", textTransform: "uppercase", color: "var(--color-muted)", marginBottom: 10 }}>
            Masuk ke Akun
          </div>

          <h1
            className="font-serif"
            style={{ fontSize: "clamp(22px,3vw,28px)", color: "var(--color-ink)", lineHeight: 1.1, marginBottom: 8 }}
          >
            Selamat Datang
          </h1>

          <p style={{ fontSize: 12, color: "var(--color-muted)", lineHeight: 1.7, marginBottom: 32 }}>
            Login untuk menyimpan keranjang, riwayat pesanan, dan akses lebih cepat.
          </p>

          <div style={{ height: 1, background: "var(--color-border)", marginBottom: 28 }} />

          {/* Google login button */}
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              padding: "14px 20px",
              border: "1px solid var(--color-border)",
              background: "transparent",
              color: "var(--color-ink)",
              fontSize: 11,
              letterSpacing: "0.14em",
              cursor: "pointer",
              transition: "all 0.25s ease",
            }}
            onMouseEnter={(e) => {
              const t = e.currentTarget;
              t.style.background = "rgba(200,183,158,0.12)";
              t.style.borderColor = "#C8B79E";
            }}
            onMouseLeave={(e) => {
              const t = e.currentTarget;
              t.style.background = "transparent";
              t.style.borderColor = "var(--color-border)";
            }}
          >
            {/* Google G logo */}
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
              <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
            </svg>
            Lanjutkan dengan Google
          </button>

          <p style={{ fontSize: 10, color: "var(--color-muted)", textAlign: "center", marginTop: 24, lineHeight: 1.65, opacity: 0.7 }}>
            Dengan masuk, kamu menyetujui syarat dan ketentuan kami.
          </p>
        </div>

        {/* back link */}
        <a
          href="/"
          style={{ fontSize: 8, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(200,183,158,0.35)", marginTop: 28, transition: "color 0.2s ease" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "#C8B79E"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = "rgba(200,183,158,0.35)"; }}
        >
          ← Kembali ke Beranda
        </a>
      </div>
    </div>
  );
}
