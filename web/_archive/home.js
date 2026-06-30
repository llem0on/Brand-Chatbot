const filterCategory = document.getElementById('filterCategory');
const filterMaterial = document.getElementById('filterMaterial');
const filterGender = document.getElementById('filterGender');
const filterSize = document.getElementById('filterSize');
const productGrid = document.getElementById('productGrid');

function formatRupiah(amount) {
  return 'Rp' + Number(amount || 0).toLocaleString('id-ID');
}

function populateSelect(select, values) {
  values.forEach((value) => {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = value;
    select.appendChild(opt);
  });
}

async function loadFilterOptions() {
  try {
    const res = await fetch('/api/products/filters');
    const data = await res.json();
    populateSelect(filterCategory, (data.categories || []).map((c) => c.name));
    populateSelect(filterMaterial, data.materials || []);
    populateSelect(filterGender, data.genders || []);
    populateSelect(filterSize, data.sizes || []);
  } catch (e) {
    console.error('Gagal memuat filter', e);
  }
}

function buildProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card';

  const variants = (product.variants || []).filter((v) => v.stock > 0);
  const variantOptions = variants.length
    ? variants.map((v) => `<option value="${v.id}">${v.size} / ${v.color}</option>`).join('')
    : '<option value="">Stok kosong</option>';

  card.innerHTML = `
    <div class="image">${product.image_url ? `<img src="${product.image_url}" alt="${product.name}">` : 'Tidak ada gambar'}</div>
    <div class="body">
      <span class="category">${product.category ? product.category.name : ''}</span>
      <span class="name">${product.name}</span>
      <span class="price">${formatRupiah(product.price)}</span>
      <select class="variant-select">${variantOptions}</select>
      <button class="btn btn-full btn-sm add-to-cart-btn" ${variants.length ? '' : 'disabled'}>+ Keranjang</button>
    </div>
  `;

  const addBtn = card.querySelector('.add-to-cart-btn');
  const variantSelect = card.querySelector('.variant-select');

  addBtn.addEventListener('click', async () => {
    const variantId = variantSelect.value;
    if (!variantId) return;

    addBtn.disabled = true;
    addBtn.textContent = 'Menambahkan...';
    try {
      const res = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: getSessionId(), product_variant_id: parseInt(variantId, 10), quantity: 1 }),
      });
      if (!res.ok) throw new Error('gagal');
      addBtn.textContent = 'Ditambahkan!';
    } catch (e) {
      addBtn.textContent = 'Gagal, coba lagi';
    } finally {
      setTimeout(() => {
        addBtn.textContent = '+ Keranjang';
        addBtn.disabled = false;
      }, 1200);
    }
  });

  return card;
}

async function loadProducts() {
  const params = new URLSearchParams();
  if (filterCategory.value) params.set('category', filterCategory.value);
  if (filterMaterial.value) params.set('material', filterMaterial.value);
  if (filterGender.value) params.set('gender', filterGender.value);
  if (filterSize.value) params.set('size', filterSize.value);

  productGrid.innerHTML = '<p class="muted">Memuat produk...</p>';
  try {
    const res = await fetch(`/api/products?${params.toString()}`);
    const products = await res.json();
    productGrid.innerHTML = '';
    if (!products.length) {
      productGrid.innerHTML = '<p class="muted">Tidak ada produk yang cocok dengan filter ini.</p>';
      return;
    }
    products.forEach((p) => productGrid.appendChild(buildProductCard(p)));
  } catch (e) {
    productGrid.innerHTML = '<p class="muted">Gagal memuat produk.</p>';
  }
}

[filterCategory, filterMaterial, filterGender, filterSize].forEach((el) => {
  el.addEventListener('change', loadProducts);
});

document.addEventListener('DOMContentLoaded', async () => {
  await loadFilterOptions();
  loadProducts();
});
