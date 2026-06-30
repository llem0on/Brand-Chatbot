"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { getCart, clearCart, type LocalCartItem } from "@/lib/cart";

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
};

type CheckoutResult = {
  order_number: string;
  total_amount: number;
  shipping_cost: number;
};

// "phone" = step wajib isi nomor HP (muncul pertama kali jika belum tersimpan)
// TODO: tambah sub-step OTP di sini ketika OTP flow siap
type Phase = "phone" | "form" | "submitting" | "success" | "error";

const PHONE_KEY = "wb_last_phone";
const NAME_KEY  = "wb_last_name";

function isValidPhone(p: string) {
  return /^(\+62|62|0)[0-9]{8,13}$/.test(p.trim());
}

export default function CheckoutModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const proofInputRef = useRef<HTMLInputElement>(null);

  const savedPhone = typeof window !== "undefined" ? (localStorage.getItem(PHONE_KEY) ?? "") : "";
  const hasPhone   = isValidPhone(savedPhone);

  const [phase, setPhase]       = useState<Phase>(hasPhone ? "form" : "phone");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult]     = useState<CheckoutResult | null>(null);
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [items, setItems]       = useState<LocalCartItem[]>([]);

  const [name]                  = useState(() => typeof window !== "undefined" ? (localStorage.getItem(NAME_KEY) ?? "") : "");
  const [phone, setPhone]       = useState(savedPhone);
  const [phoneInput, setPhoneInput] = useState(savedPhone);
  const [payment, setPayment]   = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);

  useEffect(() => {
    setItems(getCart());
    fetch(`${API}/api/settings/public`)
      .then((r) => r.json())
      .then((d: PublicSettings) => {
        setSettings(d);
        if (d.enable_bank_transfer) setPayment("transfer_bank");
        else if (d.enable_qris) setPayment("qris");
      })
      .catch(() => {});
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handlePhoneContinue() {
    if (!isValidPhone(phoneInput)) {
      setErrorMsg("Masukkan nomor HP yang valid (contoh: 08xxxxxxxx).");
      return;
    }
    const trimmed = phoneInput.trim();
    localStorage.setItem(PHONE_KEY, trimmed);
    setPhone(trimmed);
    setErrorMsg("");
    setPhase("form");
  }

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = settings?.shipping_cost ?? 0;
  const total    = subtotal + shipping;

  async function handleSubmit() {
    if (items.length === 0) { setErrorMsg("Keranjang kosong."); return; }
    if (sessionStatus === "loading") return;
    if (!session) {
      setErrorMsg("Silakan login dulu untuk checkout.");
      setPhase("error");
      return;
    }
    if (!payment) { setErrorMsg("Pilih metode pembayaran terlebih dahulu."); return; }
    if (!proofFile) { setErrorMsg("Upload bukti pembayaran terlebih dahulu."); return; }

    setPhase("submitting");
    setErrorMsg("");

    try {
      // 1. create order
      const res = await fetch(`${API}/api/cart/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: session.user?.name ?? "Guest",
          phone: phone || "00000000000",
          address: "-",
          payment_method: payment,
          email: session.user?.email ?? "",
          items: items.map((i) => ({
            product_variant_id: i.variantId,
            quantity: i.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout gagal");

      const orderResult = data as CheckoutResult;

      // 2. upload proof
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

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(239,228,220,0.04)",
    border: "1px solid rgba(203,180,167,0.14)",
    color: "#EFE4DC",
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
    color: "rgba(203,180,167,0.4)",
    marginBottom: 7,
    display: "block",
  };

  const btnStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: "11px 12px", fontSize: 10, letterSpacing: "0.14em",
    textTransform: "uppercase", cursor: "pointer", transition: "all 0.2s ease",
    border: active ? "1px solid rgba(203,180,167,0.7)" : "1px solid rgba(203,180,167,0.13)",
    color: active ? "var(--color-accent)" : "rgba(239,228,220,0.38)",
    background: active ? "rgba(165,106,108,0.12)" : "transparent",
  });

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0" style={{ backdropFilter: "blur(18px) brightness(0.3)", WebkitBackdropFilter: "blur(18px) brightness(0.3)", background: "rgba(6,4,6,0.55)" }} />

      <div
        className="relative z-10 w-full flex flex-col"
        style={{ maxWidth: 520, maxHeight: "90vh", background: "rgba(13,9,12,0.98)", border: "1px solid rgba(203,180,167,0.13)", boxShadow: "0 0 80px rgba(165,106,108,0.12), 0 32px 80px rgba(0,0,0,0.85)" }}
      >
        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: "1px solid rgba(203,180,167,0.08)" }}>
          <span style={{ fontSize: 8, letterSpacing: "0.38em", textTransform: "uppercase", color: "rgba(203,180,167,0.5)" }}>
            {phase === "success" ? "Pesanan Diterima" : phase === "phone" ? "Nomor HP" : "Checkout"}
          </span>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "rgba(239,228,220,0.3)", padding: 4 }} aria-label="Tutup">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="1" y1="1" x2="9" y2="9" /><line x1="9" y1="1" x2="1" y2="9" />
            </svg>
          </button>
        </div>

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
              <div style={{ fontSize: 11, color: "rgba(239,228,220,0.35)", letterSpacing: "0.06em", lineHeight: 1.7 }}>
                Bukti pembayaran kamu sedang diverifikasi admin.<br />
                Cek status pesanan di halaman Pesanan Saya.
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, width: "100%" }}>
              <button onClick={() => { onClose(); router.push("/pesanan"); }}
                style={{ flex: 1, padding: "13px", border: "1px solid rgba(165,106,108,0.55)", color: "#EFE4DC", background: "rgba(165,106,108,0.14)", fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", cursor: "pointer" }}>
                Lihat Pesanan
              </button>
              <button onClick={onClose}
                style={{ flex: 1, padding: "13px", border: "1px solid rgba(203,180,167,0.12)", color: "rgba(239,228,220,0.5)", background: "transparent", fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", cursor: "pointer" }}>
                Tutup
              </button>
            </div>
          </div>
        )}

        {/* ── PHONE STEP ── */}
        {phase === "phone" && (
          <div className="px-6 py-10 flex flex-col gap-6">
            <div>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: 18, color: "#EFE4DC", marginBottom: 8 }}>Nomor WhatsApp kamu</div>
              <div style={{ fontSize: 11, color: "rgba(239,228,220,0.3)", lineHeight: 1.7 }}>Diperlukan untuk konfirmasi pesanan dan pengiriman.</div>
            </div>
            <div>
              <label style={labelStyle}>No. WhatsApp / HP</label>
              <input
                value={phoneInput}
                onChange={(e) => { setPhoneInput(e.target.value); setErrorMsg(""); }}
                onKeyDown={(e) => { if (e.key === "Enter") handlePhoneContinue(); }}
                placeholder="08xxxxxxxxxx" type="tel" autoFocus style={inputStyle}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(203,180,167,0.45)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(203,180,167,0.14)"; }}
              />
              {errorMsg && <div style={{ marginTop: 8, fontSize: 11, color: "rgba(210,100,100,0.85)" }}>{errorMsg}</div>}
            </div>
            <button onClick={handlePhoneContinue}
              style={{ width: "100%", padding: "15px", border: "1px solid rgba(165,106,108,0.55)", color: "#EFE4DC", background: "rgba(165,106,108,0.14)", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", cursor: "pointer" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(165,106,108,0.26)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(165,106,108,0.14)"; }}>
              Lanjut
            </button>
          </div>
        )}

        {/* ── FORM ── */}
        {(phase === "form" || phase === "submitting" || phase === "error") && (
          <div className="overflow-y-auto flex-1">

            {/* order summary */}
            <div className="px-6 pt-5 pb-4" style={{ borderBottom: "1px solid rgba(203,180,167,0.06)" }}>
              <div style={{ fontSize: 7, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(203,180,167,0.35)", marginBottom: 10 }}>Ringkasan ({items.length} item)</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {items.map((item) => (
                  <div key={item.variantId} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div>
                      <span style={{ fontSize: 12, color: "rgba(239,228,220,0.7)" }}>{item.name}</span>
                      {(item.size || item.color) && <span style={{ fontSize: 9, color: "rgba(239,228,220,0.3)", marginLeft: 8 }}>{[item.size, item.color].filter(Boolean).join(" / ")}</span>}
                      <span style={{ fontSize: 9, color: "rgba(239,228,220,0.3)", marginLeft: 6 }}>×{item.quantity}</span>
                    </div>
                    <span style={{ fontSize: 12, color: "rgba(203,180,167,0.7)", flexShrink: 0, marginLeft: 12 }}>{rupiah(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              {settings && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(203,180,167,0.07)", display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(239,228,220,0.35)" }}>
                  <span>Ongkir</span><span>{shipping > 0 ? rupiah(shipping) : "Gratis"}</span>
                </div>
              )}
              <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between", fontSize: 14, color: "#EFE4DC" }}>
                <span>Total</span><span className="font-serif text-accent">{rupiah(total)}</span>
              </div>
            </div>

            {/* phone chip */}
            <div className="px-6 py-4" style={{ borderBottom: "1px solid rgba(203,180,167,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 7, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(203,180,167,0.35)", marginBottom: 4 }}>No. WhatsApp</div>
                <div style={{ fontSize: 13, color: "#EFE4DC" }}>{phone}</div>
              </div>
              <button onClick={() => { setErrorMsg(""); setPhase("phone"); }}
                style={{ fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(203,180,167,0.5)", background: "transparent", border: "1px solid rgba(203,180,167,0.12)", padding: "5px 12px", cursor: "pointer" }}>
                Ubah
              </button>
            </div>

            {/* payment method + instructions */}
            {settings && (settings.enable_bank_transfer || settings.enable_qris) && (
              <div className="px-6 py-5" style={{ borderBottom: "1px solid rgba(203,180,167,0.06)", display: "flex", flexDirection: "column", gap: 14 }}>
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

                {/* payment instructions */}
                {payment === "transfer_bank" && settings.enable_bank_transfer && settings.bank_account_number && (
                  <div style={{ background: "rgba(239,228,220,0.02)", border: "1px solid rgba(203,180,167,0.08)", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 3 }}>
                    <div style={{ fontSize: 11, color: "rgba(239,228,220,0.4)" }}>Transfer ke:</div>
                    <div style={{ fontSize: 13, color: "#EFE4DC" }}>{settings.bank_name}</div>
                    <div style={{ fontFamily: "var(--font-serif)", fontSize: 18, color: "var(--color-accent)", letterSpacing: "0.06em" }}>{settings.bank_account_number}</div>
                    <div style={{ fontSize: 11, color: "rgba(239,228,220,0.4)" }}>a.n. {settings.bank_account_holder}</div>
                    <div style={{ marginTop: 4, fontSize: 12, color: "#EFE4DC" }}>
                      Nominal: <span style={{ color: "var(--color-accent)", fontFamily: "var(--font-serif)" }}>{rupiah(total)}</span>
                    </div>
                  </div>
                )}

                {payment === "qris" && settings.enable_qris && settings.qris_image_url && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ fontSize: 11, color: "rgba(239,228,220,0.4)" }}>Scan QR berikut:</div>
                    <div style={{ position: "relative", width: 160, height: 160, background: "#fff" }}>
                      <Image src={settings.qris_image_url} alt="QRIS" fill sizes="160px" className="object-contain" />
                    </div>
                    <div style={{ fontSize: 12, color: "#EFE4DC" }}>
                      Nominal: <span style={{ color: "var(--color-accent)", fontFamily: "var(--font-serif)" }}>{rupiah(total)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* proof upload — mandatory */}
            <div className="px-6 py-5" style={{ borderBottom: "1px solid rgba(203,180,167,0.06)" }}>
              <label style={labelStyle}>
                Bukti Pembayaran <span style={{ color: "rgba(210,100,100,0.7)" }}>*</span>
              </label>
              <label style={{ display: "block", cursor: "pointer" }}>
                <div style={{
                  border: "1px dashed rgba(203,180,167,0.25)", padding: "14px 16px",
                  textAlign: "center", fontSize: 11,
                  color: proofFile ? "rgba(239,228,220,0.7)" : "rgba(239,228,220,0.3)",
                  background: proofFile ? "rgba(165,106,108,0.06)" : "transparent",
                  transition: "all 0.2s",
                }}>
                  {proofFile ? proofFile.name : "Pilih foto struk / screenshot transfer"}
                </div>
                <input ref={proofInputRef} type="file" accept="image/*" style={{ display: "none" }}
                  onChange={(e) => { setProofFile(e.target.files?.[0] ?? null); setErrorMsg(""); }} />
              </label>
            </div>

            {phase === "error" && errorMsg && (
              <div className="px-6 pt-3 pb-1" style={{ fontSize: 12, color: "rgba(210,100,100,0.85)", lineHeight: 1.6 }}>
                {errorMsg}
              </div>
            )}

            {/* submit */}
            <div className="px-6 py-5">
              <button
                onClick={handleSubmit}
                disabled={phase === "submitting" || sessionStatus === "loading"}
                style={{
                  width: "100%", padding: "16px",
                  border: "1px solid rgba(165,106,108,0.55)", color: "#EFE4DC",
                  background: phase === "submitting" ? "rgba(165,106,108,0.06)" : "rgba(165,106,108,0.14)",
                  fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase",
                  cursor: (phase === "submitting" || sessionStatus === "loading") ? "default" : "pointer",
                  opacity: (phase === "submitting" || sessionStatus === "loading") ? 0.6 : 1,
                  transition: "background 0.25s ease",
                }}
                onMouseEnter={(e) => { if (phase !== "submitting") (e.currentTarget as HTMLButtonElement).style.background = "rgba(165,106,108,0.26)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = phase === "submitting" ? "rgba(165,106,108,0.06)" : "rgba(165,106,108,0.14)"; }}
              >
                {phase === "submitting" ? "Memproses..." : `Pesan & Kirim Bukti · ${rupiah(total)}`}
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
