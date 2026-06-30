export default function Footer() {
  return (
    <footer className="bg-bg border-t border-accent/10 px-6 md:px-12 py-16">
      <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-3 gap-12">
        <div>
          <p className="font-serif text-2xl tracking-[0.15em] mb-4">BRAND</p>
          <p className="text-sm text-ink/60 max-w-xs">
            Editorial fashion untuk yang berani tampil beda. Dibuat dengan
            detail, dipakai dengan percaya diri.
          </p>
        </div>

        <div>
          <p className="text-xs tracking-[0.25em] uppercase text-accent mb-4">
            Newsletter
          </p>
          <p className="text-sm text-ink/60 mb-4">
            Jadi yang pertama tahu soal koleksi & acara terbatas kami.
          </p>
          <form className="flex border-b border-accent/40 focus-within:border-accent transition-colors">
            <input
              type="email"
              placeholder="Alamat email"
              className="flex-1 bg-transparent py-3 text-sm placeholder:text-ink/40 outline-none"
            />
            <button
              type="submit"
              className="text-xs tracking-[0.2em] uppercase text-accent hover:text-accent-strong transition-colors"
            >
              Kirim
            </button>
          </form>
        </div>

        <div>
          <p className="text-xs tracking-[0.25em] uppercase text-accent mb-4">
            Ikuti Kami
          </p>
          <div className="flex gap-5">
            {["Instagram", "TikTok", "Pinterest"].map((label) => (
              <a
                key={label}
                href="#"
                className="text-sm text-ink/70 hover:text-accent transition-colors"
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl mt-14 pt-6 border-t border-accent/10 text-xs text-ink/40 tracking-wide">
        © {new Date().getFullYear()} brand. Seluruh hak cipta dilindungi.
      </div>
    </footer>
  );
}
