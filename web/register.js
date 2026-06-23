document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errorEl = document.getElementById('registerError');
  errorEl.classList.add('hidden');

  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  btn.textContent = 'Memproses...';

  try {
    const res = await fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.getElementById('registerEmail').value,
        password: document.getElementById('registerPassword').value,
        session_id: getSessionId(),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      errorEl.textContent = data.error || 'Pendaftaran gagal.';
      errorEl.classList.remove('hidden');
      return;
    }
    window.location.href = '/profile.html';
  } catch (err) {
    errorEl.textContent = 'Pendaftaran gagal. Coba lagi.';
    errorEl.classList.remove('hidden');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Daftar';
  }
});
