"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import Image from "next/image";
import { getCart, clearCart, type LocalCartItem } from "@/lib/cart";
import { useTheme } from "@/lib/theme";

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

function rupiah(n: number) {
  return "Rp" + n.toLocaleString("id-ID");
}

type PublicSettings = {
  shipping_cost: number;
  enable_bank_transfer: boolean;
  enable_qris: boolean;
  bank_name: string;
  bank_account_number: string;
  bank_account_holder: string;
  qris_image_url: string;
  biteship_enabled: boolean;
};

type CheckoutResult = {
  order_number: string;
  total_amount: number;
  shipping_cost: number;
};

type CourierRate = {
  company_name: string;
  courier_name: string;
  courier_code: string;
  courier_service_code: string;
  price: number;
  duration: string;
};

// Phases:
// loading   → waiting for settings to load (determines biteship flow)
// phone     → collect WA phone number
// address   → collect delivery address + postal code (only when biteship_enabled)
// courier   → show available couriers from Biteship rate API
// form      → payment method + proof upload
// submitting / success / error
type Phase = "loading" | "phone" | "address" | "courier" | "form" | "submitting" | "success" | "error";

const PHONE_KEY = "wb_last_phone";
const NAME_KEY  = "wb_last_name";

function isValidPhone(p: string) {
  return /^(\+62|62|0)[0-9]{8,13}$/.test(p.trim());
}

export default function CheckoutModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const proofInputRef = useRef<HTMLInputElement>(null);

  const savedPhone = typeof window !== "undefined" ? (localStorage.getItem(PHONE_KEY) ?? "") : "";
  const hasPhone   = isValidPhone(savedPhone);

  const [phase, setPhase]           = useState<Phase>("loading");
  const [errorMsg, setErrorMsg]     = useState("");
  const [result, setResult]         = useState<CheckoutResult | null>(null);
  const [settings, setSettings]     = useState<PublicSettings | null>(null);
  const [items, setItems]           = useState<LocalCartItem[]>([]);

  // phone
  const [phone, setPhone]           = useState(savedPhone);
  const [phoneInput, setPhoneInput] = useState(savedPhone);
  const [name]                      = useState(() => typeof window !== "undefined" ? (localStorage.getItem(NAME_KEY) ?? "") : "");
  const [payment, setPayment]       = useState("");
  const [proofFile, setProofFile]   = useState<File | null>(null);
  const [showLoginPanel, setShowLoginPanel] = useState(false);

  // address + courier (Biteship)
  const [address, setAddress]             = useState("");
  const [postalCode, setPostalCode]       = useState("");
  const [availableRates, setAvailableRates] = useState<CourierRate[]>([]);
  const [selectedRate, setSelectedRate]   = useState<CourierRate | null>(null);
  const [ratesLoading, setRatesLoading]   = useState(false);
  const [ratesError, setRatesError]       = useState("");

  useEffect(() => {
    setItems(getCart());
    fetch(`${API}/api/settings/public`)
      .then((r) => r.json())
      .then((d: PublicSettings) => {
        setSettings(d);
        if (d.enable_bank_transfer) setPayment("transfer_bank");
        else if (d.enable_qris) setPayment("qris");
        // Set initial phase based on saved phone + Biteship mode
        if (d.biteship_enabled) {
          setPhase(hasPhone ? "address" : "phone");
        } else {
          setPhase(hasPhone ? "form" : "phone");
        }
      })
      .catch(() => setPhase(hasPhone ? "form" : "phone"));

    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (session && showLoginPanel) setShowLoginPanel(false);
  }, [session, showLoginPanel]);

  function handleGoogleLogin() {
    sessionStorage.setItem("wb_checkout_reopen", "1");
    signIn("google", { callbackUrl: window.location.pathname });
  }

  function handlePhoneContinue() {
    if (!isValidPhone(phoneInput)) {
      setErrorMsg("Masukkan nomor HP yang valid (contoh: 08xxxxxxxx).");
      return;
    }
    const trimmed = phoneInput.trim();
    localStorage.setItem(PHONE_KEY, trimmed);
    setPhone(trimmed);
    setErrorMsg("");
    setPhase(settings?.biteship_enabled ? "address" : "form");
  }

  async function handleAddressContinue() {
    if (!address.trim()) { setErrorMsg("Alamat pengiriman wajib diisi."); return; }
    if (!/^\d{5}$/.test(postalCode.trim())) { setErrorMsg("Kode pos harus 5 digit angka."); return; }
    setErrorMsg("");
    setAvailableRates([]);
    setRatesError("");
    setRatesLoading(true);
    setPhase("courier");

    try {
      const res = await fetch(`${API}/api/shipping/rates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postal_code: postalCode.trim(),
          items: items.map((i) => ({ variant_id: i.variantId, quantity: i.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal mengambil tarif");
      const pricing: CourierRate[] = data.pricing ?? [];
      setAvailableRates(pricing);
      if (pricing.length === 0) setRatesError("Tidak ada layanan pengiriman tersedia ke kode pos ini.");
    } catch (e) {
      setRatesError(e instanceof Error ? e.message : "Gagal mengambil tarif pengiriman.");
    } finally {
      setRatesLoading(false);
    }
  }

  function selectCourier(rate: CourierRate) {
    setSelectedRate(rate);
    setPhase("form");
  }

  const subtotal  = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping  = selectedRate ? selectedRate.price : (settings?.shipping_cost ?? 0);
  const total     = subtotal + shipping;

  async function handleSubmit() {
    if (items.length === 0) { setErrorMsg("Keranjang kosong."); return; }
    if (sessionStatus === "loading") return;
    if (!session) { setShowLoginPanel(true); return; }
    if (!payment) { setErrorMsg("Pilih metode pembayaran terlebih dahulu."); return; }
    if (!proofFile) { setErrorMsg("Upload bukti pembayaran terlebih dahulu."); return; }

    setPhase("submitting");
    setErrorMsg("");

    try {
      const res = await fetch(`${API}/api/cart/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:            session.user?.name ?? "Guest",
          phone:           phone || "00000000000",
          address:         address || "-",
          postal_code:     postalCode || undefined,
          courier_code:    selectedRate?.courier_code ?? "",
          courier_service: selectedRate?.courier_service_code ?? "",
          courier_name:    selectedRate ? `${selectedRate.company_name} ${selectedRate.courier_name}` : "",
          shipping_cost:   selectedRate ? selectedRate.price : undefined,
          payment_method:  payment,
          email:           session.user?.email ?? "",
          items: items.map((i) => ({
            product_variant_id: i.variantId,
            quantity: i.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout gagal");

      const orderResult = data as CheckoutResult;

      const form = new FormData();
      form.append("proof", proofFile);
      const proofRes = await fetch(`${API}/api/orders/${orderResult.order_number}/payment-proof`, {
        method: "POST",
        body: form,
      });
      const proofData = await proofRes.json();
      if (!proofRes.ok) throw new Error(proofData.error ?? "Upload bukti gagal");

      localStorage.setItem(PHONE_KEY, phone.trim());
      if (name) localStorage.setItem(NAME_KEY, name.trim());

      clearCart();
      setResult(orderResult);
      setPhase("success");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Terjadi kesalahan. Coba lagi.");
      setPhase("error");
    }
  }

  // ─── Styles ────────────────────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "color-mix(in srgb, var(--color-ink) 4%, transparent)",
    border: "1px solid color-mix(in srgb, var(--color-border) 80%, transparent)",
    color: "var(--color-ink)",
    padding: "11px 14px",
    fontSize: 13,
    outline: "none",
    transition: "border-color 0.2s ease",
    borderRadius: 0,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 7,
    letterSpacing: "0.3em",
    textTransform: "uppercase",
    color: "var(--color-muted)",
    marginBottom: 7,
    display: "block",
  };

  const btnStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: "11px 12px", fontSize: 10, letterSpacing: "0.14em",
    textTransform: "uppercase", cursor: "pointer", transition: "all 0.2s ease",
    border: active ? "1px solid var(--color-accent)" : "1px solid color-mix(in srgb, var(--color-border) 80%, transparent)",
    color: active ? "var(--color-accent)" : "var(--color-muted)",
    background: active ? "color-mix(in srgb, var(--color-accent) 12%, transparent)" : "transparent",
  });

  const chipStyle: React.CSSProperties = {
    borderBottom: "1px solid color-mix(in srgb, var(--color-border) 30%, transparent)",
    display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "14px 24px",
  };

  const chipBtnStyle: React.CSSProperties = {
    fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase",
    color: "var(--color-muted)", background: "transparent",
    border: "1px solid color-mix(in srgb, var(--color-border) 80%, transparent)",
    padding: "5px 12px", cursor: "pointer", flexShrink: 0, marginTop: 2,
  };

  const headerLabel = (
    phase === "success" ? "Pesanan Diterima" :
    phase === "phone"   ? "Nomor HP" :
    phase === "address" ? "Alamat Pengiriman" :
    phase === "courier" ? "Pilih Pengiriman" :
    "Checkout"
  );

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-8"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ animation: "hero-backdrop-in 0.2s ease both" }}
    >
      <div className="absolute inset-0" style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", pointerEvents: "none" }} />

      <div
        className="relative z-10 w-full flex"
        style={{
          maxWidth: showLoginPanel ? 920 : 520,
          maxHeight: "90vh",
          background: "var(--color-surface)",
          border: "1px solid color-mix(in srgb, var(--color-border) 80%, transparent)",
          boxShadow: "0 8px 48px rgba(0,0,0,0.18), 0 32px 80px rgba(0,0,0,0.12)",
          animation: "hero-overlay-in 0.38s cubic-bezier(0.16,1,0.3,1) both",
          transition: "max-width 0.45s cubic-bezier(0.16,1,0.3,1)",
        }}
      >
        {/* ── LEFT: checkout panel ── */}
        <div className="flex flex-col" style={{ flex: "0 0 520px", maxWidth: 520, minWidth: 0, maxHeight: "90vh" }}>

          {/* header */}
          <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: "1px solid color-mix(in srgb, var(--color-border) 50%, transparent)" }}>
            <span style={{ fontSize: 8, letterSpacing: "0.38em", textTransform: "uppercase", color: "var(--color-muted)" }}>
              {headerLabel}
            </span>
            <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "color-mix(in srgb, var(--color-ink) 45%, transparent)", padding: 4 }} aria-label="Tutup">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="1" y1="1" x2="9" y2="9" /><line x1="9" y1="1" x2="1" y2="9" />
              </svg>
            </button>
          </div>

          {/* ── LOADING ── */}
          {phase === "loading" && (
            <div className="flex items-center justify-center py-20">
              <div style={{ fontSize: 11, color: "var(--color-muted)", letterSpacing: "0.1em" }}>Memuat...</div>
            </div>
          )}

          {/* ── SUCCESS ── */}
          {phase === "success" && result && (
            <div className="flex flex-col items-center text-center py-14 px-8 gap-5 overflow-y-auto">
              <div style={{ width: 52, height: 52, borderRadius: "50%", border: "1px solid rgba(100,210,140,0.45)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 28px rgba(100,210,140,0.18)" }}>
                <svg width="20" height="16" viewBox="0 0 20 16" fill="none" stroke="rgba(100,210,140,0.9)" strokeWidth="1.8">
                  <polyline points="1,8 7,14 19,1" />
                </svg>
              </div>
              <div>
                <div className="font-serif text-2xl text-ink mb-2">Bukti Terkirim!</div>
                <div style={{ fontFamily: "var(--font-serif)", fontSize: 15, color: "var(--color-accent)", marginBottom: 8 }}>{result.order_number}</div>
                <div style={{ fontSize: 11, color: "var(--color-muted)", letterSpacing: "0.06em", lineHeight: 1.7 }}>
                  Bukti pembayaran kamu sedang diverifikasi admin.<br />
                  Cek status pesanan di halaman Pesanan Saya.
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, width: "100%" }}>
                <button onClick={() => { onClose(); router.push("/pesanan"); }}
                  style={{ flex: 1, padding: "13px", border: "1px solid color-mix(in srgb, var(--color-ink) 38%, transparent)", color: "var(--color-ink)", background: "color-mix(in srgb, var(--color-ink) 10%, transparent)", fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", cursor: "pointer" }}>
                  Lihat Pesanan
                </button>
                <button onClick={onClose}
                  style={{ flex: 1, padding: "13px", border: "1px solid color-mix(in srgb, var(--color-border) 80%, transparent)", color: "var(--color-muted)", background: "transparent", fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", cursor: "pointer" }}>
                  Tutup
                </button>
              </div>
            </div>
          )}

          {/* ── PHONE STEP ── */}
          {phase === "phone" && (
            <div className="px-6 py-10 flex flex-col gap-6">
              <div>
                <div style={{ fontFamily: "var(--font-serif)", fontSize: 18, color: "var(--color-ink)", marginBottom: 8 }}>Nomor WhatsApp kamu</div>
                <div style={{ fontSize: 11, color: "var(--color-muted)", lineHeight: 1.7 }}>Diperlukan untuk konfirmasi pesanan dan pengiriman.</div>
              </div>
              <div>
                <label style={labelStyle}>No. WhatsApp / HP</label>
                <input
                  value={phoneInput}
                  onChange={(e) => { setPhoneInput(e.target.value); setErrorMsg(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter") handlePhoneContinue(); }}
                  placeholder="08xxxxxxxxxx" type="tel" autoFocus style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-accent)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "color-mix(in srgb, var(--color-border) 80%, transparent)"; }}
                />
                {errorMsg && <div style={{ marginTop: 8, fontSize: 11, color: "rgba(210,100,100,0.85)" }}>{errorMsg}</div>}
              </div>
              <button onClick={handlePhoneContinue}
                style={{ width: "100%", padding: "15px", border: "1px solid color-mix(in srgb, var(--color-ink) 38%, transparent)", color: "var(--color-ink)", background: "color-mix(in srgb, var(--color-ink) 10%, transparent)", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", cursor: "pointer" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--color-ink)"; (e.currentTarget as HTMLButtonElement).style.color = isLight ? "#FCFAF6" : "#2A2422"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "color-mix(in srgb, var(--color-ink) 10%, transparent)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--color-ink)"; }}>
                Lanjut
              </button>
            </div>
          )}

          {/* ── ADDRESS STEP ── */}
          {phase === "address" && (
            <div className="px-6 py-8 flex flex-col gap-5">
              <div>
                <div style={{ fontFamily: "var(--font-serif)", fontSize: 18, color: "var(--color-ink)", marginBottom: 6 }}>Alamat Pengiriman</div>
                <div style={{ fontSize: 11, color: "var(--color-muted)", lineHeight: 1.7 }}>Diperlukan untuk menghitung ongkos kirim.</div>
              </div>
              <div>
                <label style={labelStyle}>Alamat Lengkap</label>
                <textarea
                  value={address}
                  onChange={(e) => { setAddress(e.target.value); setErrorMsg(""); }}
                  placeholder="Jl. Contoh No. 1, Kelurahan, Kecamatan, Kota"
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-accent)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "color-mix(in srgb, var(--color-border) 80%, transparent)"; }}
                />
              </div>
              <div>
                <label style={labelStyle}>Kode Pos</label>
                <input
                  value={postalCode}
                  onChange={(e) => { setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 5)); setErrorMsg(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddressContinue(); }}
                  placeholder="12345" type="text" inputMode="numeric" maxLength={5}
                  style={inputStyle}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--color-accent)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "color-mix(in srgb, var(--color-border) 80%, transparent)"; }}
                />
                {errorMsg && <div style={{ marginTop: 8, fontSize: 11, color: "rgba(210,100,100,0.85)" }}>{errorMsg}</div>}
              </div>
              <button onClick={handleAddressContinue}
                style={{ width: "100%", padding: "15px", border: "1px solid color-mix(in srgb, var(--color-ink) 38%, transparent)", color: "var(--color-ink)", background: "color-mix(in srgb, var(--color-ink) 10%, transparent)", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", cursor: "pointer" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--color-ink)"; (e.currentTarget as HTMLButtonElement).style.color = isLight ? "#FCFAF6" : "#2A2422"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "color-mix(in srgb, var(--color-ink) 10%, transparent)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--color-ink)"; }}>
                Cek Ongkir
              </button>
            </div>
          )}

          {/* ── COURIER STEP ── */}
          {phase === "courier" && (
            <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4">
              {ratesLoading && (
                <div className="flex flex-col items-center py-10 gap-3">
                  <div style={{ width: 28, height: 28, border: "1.5px solid color-mix(in srgb, var(--color-accent) 30%, transparent)", borderTopColor: "var(--color-accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                  <div style={{ fontSize: 11, color: "var(--color-muted)" }}>Mengambil tarif pengiriman...</div>
                </div>
              )}

              {!ratesLoading && ratesError && (
                <div className="flex flex-col items-center py-8 gap-4">
                  <div style={{ fontSize: 12, color: "rgba(210,100,100,0.85)", textAlign: "center", lineHeight: 1.6 }}>{ratesError}</div>
                  <button onClick={() => setPhase("address")}
                    style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--color-muted)", background: "transparent", border: "1px solid color-mix(in srgb, var(--color-border) 80%, transparent)", padding: "8px 18px", cursor: "pointer" }}>
                    ← Ubah Alamat
                  </button>
                </div>
              )}

              {!ratesLoading && !ratesError && availableRates.length > 0 && (
                <>
                  <div style={{ fontSize: 11, color: "var(--color-muted)", letterSpacing: "0.06em" }}>
                    {availableRates.length} layanan tersedia ke kode pos <strong style={{ color: "var(--color-ink)" }}>{postalCode}</strong>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {availableRates.map((rate) => (
                      <button
                        key={`${rate.courier_code}-${rate.courier_service_code}`}
                        onClick={() => selectCourier(rate)}
                        style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "14px 16px", textAlign: "left", cursor: "pointer",
                          border: "1px solid color-mix(in srgb, var(--color-border) 80%, transparent)",
                          background: "color-mix(in srgb, var(--color-ink) 2%, transparent)",
                          transition: "all 0.18s ease",
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.border = "1px solid var(--color-accent)";
                          (e.currentTarget as HTMLButtonElement).style.background = "color-mix(in srgb, var(--color-accent) 6%, transparent)";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLButtonElement).style.border = "1px solid color-mix(in srgb, var(--color-border) 80%, transparent)";
                          (e.currentTarget as HTMLButtonElement).style.background = "color-mix(in srgb, var(--color-ink) 2%, transparent)";
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 13, color: "var(--color-ink)", fontWeight: 500 }}>
                            {rate.company_name}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 2 }}>
                            {rate.courier_name} · {rate.duration}
                          </div>
                        </div>
                        <div style={{ fontFamily: "var(--font-serif)", fontSize: 15, color: isLight ? "#321318" : "var(--color-accent)", flexShrink: 0, marginLeft: 16 }}>
                          {rupiah(rate.price)}
                        </div>
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setPhase("address")}
                    style={{ fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--color-muted)", background: "transparent", border: "none", padding: "8px 0", cursor: "pointer", alignSelf: "flex-start" }}>
                    ← Ubah Alamat
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── FORM ── */}
          {(phase === "form" || phase === "submitting" || phase === "error") && (
            <div className="overflow-y-auto flex-1">

              {/* order summary */}
              <div className="px-6 pt-5 pb-4" style={{ borderBottom: "1px solid color-mix(in srgb, var(--color-border) 30%, transparent)" }}>
                <div style={{ fontSize: 7, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--color-muted)", marginBottom: 10 }}>Ringkasan ({items.length} item)</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {items.map((item) => (
                    <div key={item.variantId} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <div>
                        <span style={{ fontSize: 12, color: "var(--color-ink)" }}>{item.name}</span>
                        {(item.size || item.color) && <span style={{ fontSize: 9, color: "var(--color-muted)", marginLeft: 8 }}>{[item.size, item.color].filter(Boolean).join(" / ")}</span>}
                        <span style={{ fontSize: 9, color: "var(--color-muted)", marginLeft: 6 }}>×{item.quantity}</span>
                      </div>
                      <span style={{ fontSize: 12, color: isLight ? "#321318" : "var(--color-accent)", flexShrink: 0, marginLeft: 12 }}>{rupiah(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                {settings && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid color-mix(in srgb, var(--color-border) 30%, transparent)", display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--color-muted)" }}>
                    <span>Ongkir{selectedRate ? ` (${selectedRate.company_name})` : ""}</span>
                    <span>{shipping > 0 ? rupiah(shipping) : "Gratis"}</span>
                  </div>
                )}
                <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between", fontSize: 14, color: "var(--color-ink)" }}>
                  <span>Total</span>
                  <span style={{ fontFamily: "var(--font-serif)", color: isLight ? "#321318" : "var(--color-accent)" }}>{rupiah(total)}</span>
                </div>
              </div>

              {/* phone chip */}
              <div style={chipStyle}>
                <div>
                  <div style={{ fontSize: 7, letterSpacing: "0.28em", textTransform: "uppercase", color: "var(--color-muted)", marginBottom: 4 }}>No. WhatsApp</div>
                  <div style={{ fontSize: 13, color: "var(--color-ink)" }}>{phone}</div>
                </div>
                <button onClick={() => { setErrorMsg(""); setPhase("phone"); }} style={chipBtnStyle}>Ubah</button>
              </div>

              {/* address chip (Biteship only) */}
              {selectedRate && address && (
                <div style={chipStyle}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 7, letterSpacing: "0.28em", textTransform: "uppercase", color: "var(--color-muted)", marginBottom: 4 }}>Alamat</div>
                    <div style={{ fontSize: 12, color: "var(--color-ink)", lineHeight: 1.5 }}>{address}</div>
                    <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 2 }}>Kode pos {postalCode}</div>
                  </div>
                  <button onClick={() => setPhase("address")} style={chipBtnStyle}>Ubah</button>
                </div>
              )}

              {/* courier chip (Biteship only) */}
              {selectedRate && (
                <div style={chipStyle}>
                  <div>
                    <div style={{ fontSize: 7, letterSpacing: "0.28em", textTransform: "uppercase", color: "var(--color-muted)", marginBottom: 4 }}>Kurir</div>
                    <div style={{ fontSize: 13, color: "var(--color-ink)" }}>{selectedRate.company_name} {selectedRate.courier_name}</div>
                    <div style={{ fontSize: 11, color: "var(--color-muted)", marginTop: 2 }}>{rupiah(selectedRate.price)} · {selectedRate.duration}</div>
                  </div>
                  <button onClick={() => setPhase("courier")} style={chipBtnStyle}>Ubah</button>
                </div>
              )}

              {/* payment method + instructions */}
              {settings && (settings.enable_bank_transfer || settings.enable_qris) && (
                <div className="px-6 py-5" style={{ borderBottom: "1px solid color-mix(in srgb, var(--color-border) 30%, transparent)", display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Metode Pembayaran</label>
                    <div style={{ display: "flex", gap: 8 }}>
                      {settings.enable_bank_transfer && (
                        <button onClick={() => setPayment("transfer_bank")} style={btnStyle(payment === "transfer_bank")}>Transfer Bank</button>
                      )}
                      {settings.enable_qris && (
                        <button onClick={() => setPayment("qris")} style={btnStyle(payment === "qris")}>QRIS</button>
                      )}
                    </div>
                  </div>

                  {payment === "transfer_bank" && settings.enable_bank_transfer && settings.bank_account_number && (
                    <div style={{ background: "color-mix(in srgb, var(--color-ink) 3%, transparent)", border: "1px solid color-mix(in srgb, var(--color-border) 50%, transparent)", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 3 }}>
                      <div style={{ fontSize: 11, color: "var(--color-muted)" }}>Transfer ke:</div>
                      <div style={{ fontSize: 13, color: "var(--color-ink)" }}>{settings.bank_name}</div>
                      <div style={{ fontFamily: "var(--font-serif)", fontSize: 18, color: "var(--color-accent)", letterSpacing: "0.06em" }}>{settings.bank_account_number}</div>
                      <div style={{ fontSize: 11, color: "var(--color-muted)" }}>a.n. {settings.bank_account_holder}</div>
                      <div style={{ marginTop: 4, fontSize: 12, color: "var(--color-ink)" }}>
                        Nominal: <span style={{ color: "var(--color-accent)", fontFamily: "var(--font-serif)" }}>{rupiah(total)}</span>
                      </div>
                    </div>
                  )}

                  {payment === "qris" && settings.enable_qris && settings.qris_image_url && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ fontSize: 11, color: "var(--color-muted)" }}>Scan QR berikut:</div>
                      <div style={{ position: "relative", width: 160, height: 160, background: "#fff" }}>
                        <Image src={settings.qris_image_url} alt="QRIS" fill sizes="160px" className="object-contain" />
                      </div>
                      <div style={{ fontSize: 12, color: "var(--color-ink)" }}>
                        Nominal: <span style={{ color: "var(--color-accent)", fontFamily: "var(--font-serif)" }}>{rupiah(total)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* proof upload */}
              <div className="px-6 py-5" style={{ borderBottom: "1px solid color-mix(in srgb, var(--color-border) 30%, transparent)" }}>
                <label style={labelStyle}>
                  Bukti Pembayaran <span style={{ color: "rgba(210,100,100,0.7)" }}>*</span>
                </label>
                <label style={{ display: "block", cursor: "pointer" }}>
                  <div style={{
                    border: "1px dashed color-mix(in srgb, var(--color-border) 80%, transparent)", padding: "14px 16px",
                    textAlign: "center", fontSize: 11,
                    color: proofFile ? "var(--color-ink)" : "var(--color-muted)",
                    background: proofFile ? "color-mix(in srgb, var(--color-accent) 6%, transparent)" : "transparent",
                    transition: "all 0.2s",
                  }}>
                    {proofFile ? proofFile.name : "Pilih foto struk / screenshot transfer"}
                  </div>
                  <input ref={proofInputRef} type="file" accept="image/*" style={{ display: "none" }}
                    onChange={(e) => { setProofFile(e.target.files?.[0] ?? null); setErrorMsg(""); }} />
                </label>
              </div>

              {phase === "error" && errorMsg && (
                <div className="px-6 pt-3 pb-1" style={{ fontSize: 12, color: "rgba(210,100,100,0.85)", lineHeight: 1.6 }}>{errorMsg}</div>
              )}

              {/* submit */}
              <div className="px-6 py-5">
                <button
                  onClick={handleSubmit}
                  disabled={phase === "submitting" || sessionStatus === "loading"}
                  style={{
                    width: "100%", padding: "16px",
                    border: "1px solid color-mix(in srgb, var(--color-ink) 38%, transparent)",
                    color: "var(--color-ink)",
                    background: phase === "submitting" ? "color-mix(in srgb, var(--color-ink) 4%, transparent)" : "color-mix(in srgb, var(--color-ink) 10%, transparent)",
                    fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase",
                    cursor: (phase === "submitting" || sessionStatus === "loading") ? "default" : "pointer",
                    opacity: (phase === "submitting" || sessionStatus === "loading") ? 0.6 : 1,
                    transition: "background 0.25s ease, color 0.3s ease, box-shadow 0.35s ease, letter-spacing 0.4s ease, transform 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (phase !== "submitting") {
                      const t = e.currentTarget as HTMLButtonElement;
                      t.style.background = "var(--color-ink)";
                      t.style.color = isLight ? "#FCFAF6" : "#2A2422";
                      t.style.boxShadow = isLight
                        ? "0 0 22px rgba(42,36,34,0.2), 0 6px 18px rgba(0,0,0,0.1)"
                        : "0 0 22px rgba(252,250,246,0.15), 0 6px 18px rgba(0,0,0,0.35)";
                      t.style.letterSpacing = "0.4em";
                      t.style.transform = "scale(1.01)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    const t = e.currentTarget as HTMLButtonElement;
                    t.style.background = phase === "submitting" ? "color-mix(in srgb, var(--color-ink) 4%, transparent)" : "color-mix(in srgb, var(--color-ink) 10%, transparent)";
                    t.style.color = "var(--color-ink)";
                    t.style.boxShadow = "none";
                    t.style.letterSpacing = "0.32em";
                    t.style.transform = "scale(1)";
                  }}
                >
                  {phase === "submitting" ? "Memproses..." : `Pesan & Kirim Bukti · ${rupiah(total)}`}
                </button>
              </div>

            </div>
          )}
        </div>{/* end left panel */}

        {/* ── RIGHT: login panel ── */}
        <div
          style={{
            flex: 1,
            borderLeft: "1px solid color-mix(in srgb, var(--color-border) 50%, transparent)",
            overflow: "hidden",
            maxWidth: showLoginPanel ? 400 : 0,
            transition: "max-width 0.45s cubic-bezier(0.16,1,0.3,1)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              width: 400,
              padding: "48px 36px 36px",
              display: "flex",
              flexDirection: "column",
              gap: 24,
              opacity: showLoginPanel ? 1 : 0,
              transform: showLoginPanel ? "translateX(0)" : "translateX(16px)",
              transition: "opacity 0.3s ease 0.15s, transform 0.35s cubic-bezier(0.16,1,0.3,1) 0.1s",
            }}
          >
            <div>
              <div style={{ fontSize: 7, letterSpacing: "0.32em", textTransform: "uppercase", color: "var(--color-muted)", marginBottom: 12 }}>Masuk</div>
              <div style={{ fontFamily: "var(--font-serif)", fontWeight: 300, fontSize: 22, color: "var(--color-ink)", lineHeight: 1.25, marginBottom: 6 }}>
                Login untuk melanjutkan
              </div>
              <div style={{ fontSize: 11, color: "var(--color-muted)", lineHeight: 1.65 }}>
                Pesanan kamu akan dikaitkan dengan akun setelah login.
              </div>
            </div>

            <button
              onClick={handleGoogleLogin}
              style={{
                width: "100%", padding: "14px 20px",
                border: "1px solid color-mix(in srgb, var(--color-border) 80%, transparent)",
                color: "var(--color-ink)",
                background: "color-mix(in srgb, var(--color-ink) 6%, transparent)",
                fontSize: 11, letterSpacing: "0.08em", cursor: "pointer",
                transition: "background 0.25s ease",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "color-mix(in srgb, var(--color-ink) 12%, transparent)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "color-mix(in srgb, var(--color-ink) 6%, transparent)"; }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Lanjutkan dengan Google
            </button>

            <div style={{ borderTop: "1px solid color-mix(in srgb, var(--color-border) 40%, transparent)", paddingTop: 18 }}>
              <div style={{ fontSize: 11, color: "var(--color-muted)", lineHeight: 1.65 }}>
                Akun baru akan dibuat otomatis jika belum terdaftar.
              </div>
              <button
                onClick={() => setShowLoginPanel(false)}
                style={{ marginTop: 12, fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--color-muted)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
              >
                ← Kembali
              </button>
            </div>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
