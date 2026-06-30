const sessionId = getSessionId();

const cartError = document.getElementById('cartError');
const cartSuccess = document.getElementById('cartSuccess');
const cartEmpty = document.getElementById('cartEmpty');
const cartLayout = document.getElementById('cartLayout');
const cartList = document.getElementById('cartList');
const cartSubtotalEl = document.getElementById('cartSubtotal');
const cartShippingEl = document.getElementById('cartShipping');
const cartTotalEl = document.getElementById('cartTotal');
const checkoutGuestNotice = document.getElementById('checkoutGuestNotice');
const checkoutVerifyNotice = document.getElementById('checkoutVerifyNotice');
const checkoutForm = document.getElementById('checkoutForm');
const resendVerificationBtn = document.getElementById('resendVerificationBtn');

let shippingCost = 0;

function formatRupiah(amount) {
  return 'Rp' + Number(amount || 0).toLocaleString('id-ID');
}

function showError(message) {
  cartError.textContent = message;
  cartError.classList.remove('hidden');
  setTimeout(() => cartError.classList.add('hidden'), 4000);
}

function buildCartRow(item) {
  const row = document.createElement('div');
  row.className = 'card cart-item';
  row.innerHTML = `
    <div class="info">
      <strong>${item.product.name}</strong>
      <div class="muted" style="font-size:12px;">${item.product_variant.size} / ${item.product_variant.color}</div>
      <div class="muted" style="font-size:12px;">${formatRupiah(item.product.price)}</div>
    </div>
    <div class="qty-controls">
      <button class="btn btn-secondary btn-sm qty-minus">-</button>
      <span class="qty-value">${item.quantity}</span>
      <button class="btn btn-secondary btn-sm qty-plus">+</button>
      <button class="btn btn-ghost btn-sm remove-btn">Hapus</button>
    </div>
  `;

  row.querySelector('.qty-minus').addEventListener('click', () => updateQuantity(item.id, item.quantity - 1));
  row.querySelector('.qty-plus').addEventListener('click', () => updateQuantity(item.id, item.quantity + 1));
  row.querySelector('.remove-btn').addEventListener('click', () => removeItem(item.id));

  return row;
}

async function updateQuantity(itemId, quantity) {
  try {
    await fetch(`/api/cart/items/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity }),
    });
    loadCart();
  } catch (e) {
    showError('Gagal update jumlah.');
  }
}

async function removeItem(itemId) {
  try {
    await fetch(`/api/cart/items/${itemId}`, { method: 'DELETE' });
    loadCart();
  } catch (e) {
    showError('Gagal menghapus item.');
  }
}

async function loadCheckoutSettings() {
  try {
    const res = await fetch('/api/settings/public');
    const data = await res.json();
    shippingCost = data.shipping_cost || 0;

    const methodSelect = document.getElementById('checkoutPaymentMethod');
    methodSelect.innerHTML = '';
    if (data.enable_bank_transfer) {
      methodSelect.innerHTML += '<option value="transfer_bank">Transfer Bank</option>';
    }
    if (data.enable_qris) {
      methodSelect.innerHTML += '<option value="qris">QRIS</option>';
    }
  } catch (e) {
    console.error('Gagal memuat settings', e);
  }
}

async function loadAuthState() {
  try {
    const res = await fetch('/auth/me');
    return await res.json();
  } catch (e) {
    return { logged_in: false };
  }
}

async function loadCart() {
  try {
    const res = await fetch(`/api/cart?session_id=${encodeURIComponent(sessionId)}`);
    const data = await res.json();
    const items = data.items || [];

    if (items.length === 0) {
      cartEmpty.classList.remove('hidden');
      cartLayout.classList.add('hidden');
      return;
    }

    cartEmpty.classList.add('hidden');
    cartLayout.classList.remove('hidden');

    cartList.innerHTML = '';
    items.forEach((item) => cartList.appendChild(buildCartRow(item)));

    cartSubtotalEl.textContent = formatRupiah(data.total);
    cartShippingEl.textContent = formatRupiah(shippingCost);
    cartTotalEl.textContent = formatRupiah(data.total + shippingCost);

    const auth = await loadAuthState();
    checkoutGuestNotice.classList.add('hidden');
    checkoutVerifyNotice.classList.add('hidden');
    checkoutForm.classList.add('hidden');

    if (!auth.logged_in) {
      checkoutGuestNotice.classList.remove('hidden');
    } else if (!auth.email_verified) {
      checkoutVerifyNotice.classList.remove('hidden');
    } else {
      checkoutForm.classList.remove('hidden');
    }
  } catch (e) {
    showError('Gagal memuat keranjang.');
  }
}

resendVerificationBtn?.addEventListener('click', async () => {
  resendVerificationBtn.disabled = true;
  resendVerificationBtn.textContent = 'Mengirim...';
  try {
    await fetch('/auth/resend-verification', { method: 'POST' });
    resendVerificationBtn.textContent = 'Terkirim! Cek email kamu';
  } catch (e) {
    resendVerificationBtn.textContent = 'Gagal, coba lagi';
    resendVerificationBtn.disabled = false;
  }
});

checkoutForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = checkoutForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Memproses...';

  try {
    const res = await fetch('/api/cart/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        name: document.getElementById('checkoutName').value,
        phone: document.getElementById('checkoutPhone').value,
        address: document.getElementById('checkoutAddress').value,
        payment_method: document.getElementById('checkoutPaymentMethod').value,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      showError(data.error || 'Checkout gagal.');
      return;
    }

    cartSuccess.innerHTML = `Pesanan <strong>${data.order_number}</strong> berhasil dibuat!<br>${data.payment_instructions.replace(/\n/g, '<br>')}`;
    cartSuccess.classList.remove('hidden');
    loadCart();
  } catch (e) {
    showError('Checkout gagal. Coba lagi.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Checkout';
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  await loadCheckoutSettings();
  loadCart();
});
