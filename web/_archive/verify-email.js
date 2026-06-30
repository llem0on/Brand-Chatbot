(async () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const statusEl = document.getElementById('verifyStatus');
  const linkEl = document.getElementById('verifyProfileLink');

  if (!token) {
    statusEl.textContent = 'Token verifikasi tidak ditemukan.';
    return;
  }

  try {
    const res = await fetch(`/auth/verify-email?token=${encodeURIComponent(token)}`);
    const data = await res.json();
    if (!res.ok) {
      statusEl.textContent = data.error || 'Verifikasi gagal.';
      return;
    }
    statusEl.textContent = 'Email kamu berhasil diverifikasi!';
    linkEl.classList.remove('hidden');
  } catch (e) {
    statusEl.textContent = 'Terjadi kesalahan. Coba lagi.';
  }
})();
