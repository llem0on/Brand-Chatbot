async function loadProfile() {
  try {
    const res = await fetch('/auth/me');
    const data = await res.json();
    document.getElementById('profileLoading').classList.add('hidden');

    if (!data.logged_in) {
      document.getElementById('profileGuest').classList.remove('hidden');
      return;
    }

    document.getElementById('profileContent').classList.remove('hidden');
    document.getElementById('profileEmail').textContent = data.email;
    document.getElementById('profileVerified').textContent = data.email_verified
      ? 'Terverifikasi'
      : 'Belum diverifikasi';

    if (!data.email_verified) {
      document.getElementById('resendBtn').classList.remove('hidden');
    }
  } catch (e) {
    document.getElementById('profileLoading').textContent = 'Gagal memuat profil.';
  }
}

document.getElementById('resendBtn').addEventListener('click', async (e) => {
  e.target.disabled = true;
  e.target.textContent = 'Mengirim...';
  try {
    await fetch('/auth/resend-verification', { method: 'POST' });
    e.target.textContent = 'Terkirim! Cek email kamu';
  } catch (err) {
    e.target.textContent = 'Gagal, coba lagi';
    e.target.disabled = false;
  }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch('/auth/logout', { method: 'POST' });
  window.location.href = '/';
});

document.addEventListener('DOMContentLoaded', loadProfile);
