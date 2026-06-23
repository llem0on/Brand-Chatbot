// Admin Panel JavaScript
let token = '';
let categoriesCache = [];

// Check if already logged in
window.addEventListener('DOMContentLoaded', () => {
  const savedToken = localStorage.getItem('admin_token');
  if (savedToken) {
    token = savedToken;
    showAdminPanel();
    loadDashboard();
  }
});

function login() {
  const inputToken = document.getElementById('tokenInput').value;
  if (!inputToken) {
    alert('Please enter admin token');
    return;
  }

  token = inputToken;
  localStorage.setItem('admin_token', token);

  // Test token by fetching FAQs
  fetchWithAuth('/admin/faqs')
    .then(() => {
      showAdminPanel();
      loadDashboard();
    })
    .catch(() => {
      alert('Invalid token');
      logout();
    });
}

function logout() {
  token = '';
  localStorage.removeItem('admin_token');
  document.getElementById('authForm').classList.remove('hidden');
  document.getElementById('adminPanel').classList.add('hidden');
}

function showAdminPanel() {
  document.getElementById('authForm').classList.add('hidden');
  document.getElementById('adminPanel').classList.remove('hidden');
}

function fetchWithAuth(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }).then(res => {
    if (res.status === 401) {
      logout();
      throw new Error('Unauthorized');
    }
    return res.json();
  });
}

// Tab switching
function switchTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  event.target.classList.add('active');

  // Update tab content
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById(`${tabName}-tab`).classList.add('active');

  // Load data based on tab
  if (tabName === 'stats') loadDashboard();
  if (tabName === 'faqs') loadFAQs();
  if (tabName === 'products') loadProducts();
  if (tabName === 'categories') loadCategories();
  if (tabName === 'promotions') loadPromotions();
  if (tabName === 'orders') loadOrders();
  if (tabName === 'customers') loadCustomers();
  if (tabName === 'settings') loadSettings();
  if (tabName === 'chat') {
    loadConversations();
    startChatListPolling();
  } else {
    stopChatListPolling();
    stopActiveChatPolling();
  }
}

// Dashboard
function loadDashboard() {
  fetchWithAuth('/admin/faqs')
    .then(data => {
      document.getElementById('stat-faqs').textContent = data.length;
    });

  fetchWithAuth('/admin/products')
    .then(data => {
      document.getElementById('stat-products').textContent = data.length;
    });

  fetchWithAuth('/admin/promotions')
    .then(data => {
      document.getElementById('stat-promotions').textContent = data.filter(p => p.active).length;
    });

  fetchWithAuth('/admin/conversations')
    .then(data => {
      document.getElementById('stat-escalations').textContent = data.length;
      updateChatBadge(data.length);
    });

  fetchWithAuth('/admin/orders')
    .then(data => {
      document.getElementById('stat-orders').textContent = data.length;
    });

  fetchWithAuth('/admin/customers')
    .then(data => {
      document.getElementById('stat-customers').textContent = data.length;
    });
}

function updateChatBadge(count) {
  const badge = document.getElementById('chatBadge');
  badge.textContent = count > 0 ? `(${count})` : '';
}

// FAQs
function loadFAQs() {
  fetchWithAuth('/admin/faqs')
    .then(data => {
      const tbody = document.getElementById('faqList');
      tbody.innerHTML = '';

      data.forEach((faq, index) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${index + 1}</td>
          <td>${faq.question}</td>
          <td>${faq.category}</td>
          <td>${faq.active ? '✅' : '❌'}</td>
          <td>
            <button class="btn btn-secondary" style="padding: 5px 10px; margin-right: 5px;" onclick="editFAQ(${faq.id})">Edit</button>
            <button class="btn btn-danger" style="padding: 5px 10px;" onclick="deleteFAQ(${faq.id})">Delete</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    });
}

function openFAQModal(faqId = null) {
  document.getElementById('faqModal').classList.add('active');
  document.getElementById('faqError').classList.add('hidden');

  if (faqId) {
    document.getElementById('faqModalTitle').textContent = 'Edit FAQ';
    fetchWithAuth(`/admin/faqs`)
      .then(data => {
        const faq = data.find(f => f.id === faqId);
        if (faq) {
          document.getElementById('faqId').value = faq.id;
          document.getElementById('faqQuestion').value = faq.question;
          document.getElementById('faqAnswer').value = faq.answer;
          document.getElementById('faqKeywords').value = faq.keywords || '';
          document.getElementById('faqCategory').value = faq.category || '';
          document.getElementById('faqOrder').value = faq.display_order || 0;
          document.getElementById('faqActive').checked = faq.active;
        }
      });
  } else {
    document.getElementById('faqModalTitle').textContent = 'Add FAQ';
    document.getElementById('faqForm').reset();
    document.getElementById('faqId').value = '';
  }
}

function closeFAQModal() {
  document.getElementById('faqModal').classList.remove('active');
  document.getElementById('faqForm').reset();
}

function editFAQ(id) {
  openFAQModal(id);
}

function deleteFAQ(id) {
  if (!confirm('Are you sure you want to delete this FAQ?')) return;

  fetchWithAuth(`/admin/faqs/${id}`, { method: 'DELETE' })
    .then(() => {
      loadFAQs();
      alert('FAQ deleted successfully');
    })
    .catch(err => alert('Error deleting FAQ: ' + err.message));
}

document.getElementById('faqForm').addEventListener('submit', (e) => {
  e.preventDefault();

  const id = document.getElementById('faqId').value;
  const data = {
    question: document.getElementById('faqQuestion').value,
    answer: document.getElementById('faqAnswer').value,
    keywords: document.getElementById('faqKeywords').value,
    category: document.getElementById('faqCategory').value || 'general',
    display_order: parseInt(document.getElementById('faqOrder').value) || 0,
    active: document.getElementById('faqActive').checked,
  };

  const url = id ? `/admin/faqs/${id}` : '/admin/faqs';
  const method = id ? 'PUT' : 'POST';

  fetchWithAuth(url, {
    method,
    body: JSON.stringify(data),
  })
    .then(() => {
      closeFAQModal();
      loadFAQs();
      alert('FAQ saved successfully');
    })
    .catch(err => {
      document.getElementById('faqError').textContent = 'Error: ' + err.message;
      document.getElementById('faqError').classList.remove('hidden');
    });
});

// Categories
function loadCategories() {
  fetchWithAuth('/admin/categories')
    .then(data => {
      categoriesCache = data;
      const tbody = document.getElementById('categoryList');
      tbody.innerHTML = '';

      data.forEach(cat => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${cat.name}</td>
          <td>${cat.description || ''}</td>
          <td>
            <button class="btn btn-secondary" style="padding: 5px 10px; margin-right: 5px;" onclick="editCategory(${cat.id})">Edit</button>
            <button class="btn btn-danger" style="padding: 5px 10px;" onclick="deleteCategory(${cat.id})">Delete</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    });
}

function openCategoryModal(categoryId = null) {
  document.getElementById('categoryModal').classList.add('active');
  document.getElementById('categoryError').classList.add('hidden');

  if (categoryId) {
    document.getElementById('categoryModalTitle').textContent = 'Edit Category';
    const cat = categoriesCache.find(c => c.id === categoryId);
    if (cat) {
      document.getElementById('categoryId').value = cat.id;
      document.getElementById('categoryName').value = cat.name;
      document.getElementById('categoryDescription').value = cat.description || '';
    }
  } else {
    document.getElementById('categoryModalTitle').textContent = 'Add Category';
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryId').value = '';
  }
}

function closeCategoryModal() {
  document.getElementById('categoryModal').classList.remove('active');
  document.getElementById('categoryForm').reset();
}

function editCategory(id) {
  openCategoryModal(id);
}

function deleteCategory(id) {
  if (!confirm('Delete this category? Products in it will keep referencing a missing category.')) return;

  fetchWithAuth(`/admin/categories/${id}`, { method: 'DELETE' })
    .then(() => {
      loadCategories();
      alert('Category deleted successfully');
    })
    .catch(err => alert('Error deleting category: ' + err.message));
}

document.getElementById('categoryForm').addEventListener('submit', (e) => {
  e.preventDefault();

  const id = document.getElementById('categoryId').value;
  const data = {
    name: document.getElementById('categoryName').value,
    description: document.getElementById('categoryDescription').value,
  };

  const url = id ? `/admin/categories/${id}` : '/admin/categories';
  const method = id ? 'PUT' : 'POST';

  fetchWithAuth(url, {
    method,
    body: JSON.stringify(data),
  })
    .then(() => {
      closeCategoryModal();
      loadCategories();
      alert('Category saved successfully');
    })
    .catch(err => {
      document.getElementById('categoryError').textContent = 'Error: ' + err.message;
      document.getElementById('categoryError').classList.remove('hidden');
    });
});

// Products
function loadProducts() {
  ensureCategoriesLoaded().then(() => {
    fetchWithAuth('/admin/products')
      .then(data => {
        const tbody = document.getElementById('productList');
        tbody.innerHTML = '';

        data.forEach(product => {
          const tr = document.createElement('tr');
          const categoryName = product.category ? product.category.name : '-';
          tr.innerHTML = `
            <td>${product.code}</td>
            <td>${product.name}</td>
            <td>${categoryName}</td>
            <td>Rp${Number(product.price || 0).toLocaleString('id-ID')}</td>
            <td><button class="btn btn-secondary" style="padding: 5px 10px;" onclick="openVariantModal(${product.id}, '${product.name.replace(/'/g, "\\'")}')">Kelola Varian</button></td>
            <td>${product.active ? '✅' : '❌'}</td>
            <td>
              <button class="btn btn-secondary" style="padding: 5px 10px; margin-right: 5px;" onclick="editProduct(${product.id})">Edit</button>
              <button class="btn btn-danger" style="padding: 5px 10px;" onclick="deleteProduct(${product.id})">Delete</button>
            </td>
          `;
          tbody.appendChild(tr);
        });
      });
  });
}

function ensureCategoriesLoaded() {
  return fetchWithAuth('/admin/categories').then(data => {
    categoriesCache = data;
    const select = document.getElementById('productCategoryId');
    select.innerHTML = categoriesCache.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  });
}

function openProductModal(productId = null) {
  document.getElementById('productModal').classList.add('active');
  document.getElementById('productError').classList.add('hidden');

  ensureCategoriesLoaded().then(() => {
    if (productId) {
      document.getElementById('productModalTitle').textContent = 'Edit Product';
      fetchWithAuth('/admin/products')
        .then(data => {
          const product = data.find(p => p.id === productId);
          if (product) {
            document.getElementById('productId').value = product.id;
            document.getElementById('productCode').value = product.code;
            document.getElementById('productName').value = product.name;
            document.getElementById('productCategoryId').value = product.category_id;
            document.getElementById('productDescription').value = product.description || '';
            document.getElementById('productPrice').value = product.price || 0;
            document.getElementById('productSizes').value = product.sizes || '';
            document.getElementById('productColors').value = product.colors || '';
            document.getElementById('productStock').value = product.stock || 0;
            document.getElementById('productImageUrl').value = product.image_url || '';
            document.getElementById('productActive').checked = product.active;
          }
        });
    } else {
      document.getElementById('productModalTitle').textContent = 'Add Product';
      document.getElementById('productForm').reset();
      document.getElementById('productId').value = '';
    }
  });
}

function closeProductModal() {
  document.getElementById('productModal').classList.remove('active');
  document.getElementById('productForm').reset();
}

function editProduct(id) {
  openProductModal(id);
}

function deleteProduct(id) {
  if (!confirm('Are you sure you want to delete this product?')) return;

  fetchWithAuth(`/admin/products/${id}`, { method: 'DELETE' })
    .then(() => {
      loadProducts();
      alert('Product deleted successfully');
    })
    .catch(err => alert('Error deleting product: ' + err.message));
}

document.getElementById('productForm').addEventListener('submit', (e) => {
  e.preventDefault();

  const id = document.getElementById('productId').value;
  const data = {
    code: document.getElementById('productCode').value,
    name: document.getElementById('productName').value,
    category_id: parseInt(document.getElementById('productCategoryId').value),
    description: document.getElementById('productDescription').value,
    price: parseInt(document.getElementById('productPrice').value) || 0,
    sizes: document.getElementById('productSizes').value,
    colors: document.getElementById('productColors').value,
    stock: parseInt(document.getElementById('productStock').value) || 0,
    image_url: document.getElementById('productImageUrl').value,
    active: document.getElementById('productActive').checked,
  };

  const url = id ? `/admin/products/${id}` : '/admin/products';
  const method = id ? 'PUT' : 'POST';

  fetchWithAuth(url, {
    method,
    body: JSON.stringify(data),
  })
    .then(() => {
      closeProductModal();
      loadProducts();
      alert('Product saved successfully');
    })
    .catch(err => {
      document.getElementById('productError').textContent = 'Error: ' + err.message;
      document.getElementById('productError').classList.remove('hidden');
    });
});

// Promotions
function loadPromotions() {
  fetchWithAuth('/admin/promotions')
    .then(data => {
      const tbody = document.getElementById('promotionList');
      tbody.innerHTML = '';

      data.forEach(promo => {
        const tr = document.createElement('tr');
        const start = promo.start_date ? new Date(promo.start_date).toLocaleDateString('id-ID') : '-';
        const end = promo.end_date ? new Date(promo.end_date).toLocaleDateString('id-ID') : '-';
        tr.innerHTML = `
          <td>${promo.title}</td>
          <td>${promo.type === 'event' ? '🎉 Event' : '🏷️ Promo'}</td>
          <td>${start}</td>
          <td>${end}</td>
          <td>${promo.active ? '✅' : '❌'}</td>
          <td>
            <button class="btn btn-secondary" style="padding: 5px 10px; margin-right: 5px;" onclick="editPromotion(${promo.id})">Edit</button>
            <button class="btn btn-danger" style="padding: 5px 10px;" onclick="deletePromotion(${promo.id})">Delete</button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    });
}

function toDateInputValue(isoString) {
  if (!isoString) return '';
  return isoString.substring(0, 10);
}

function openPromotionModal(promotionId = null) {
  document.getElementById('promotionModal').classList.add('active');
  document.getElementById('promotionError').classList.add('hidden');

  if (promotionId) {
    document.getElementById('promotionModalTitle').textContent = 'Edit Promotion';
    fetchWithAuth('/admin/promotions')
      .then(data => {
        const promo = data.find(p => p.id === promotionId);
        if (promo) {
          document.getElementById('promotionId').value = promo.id;
          document.getElementById('promotionTitle').value = promo.title;
          document.getElementById('promotionDescription').value = promo.description || '';
          document.getElementById('promotionType').value = promo.type || 'promo';
          document.getElementById('promotionStartDate').value = toDateInputValue(promo.start_date);
          document.getElementById('promotionEndDate').value = toDateInputValue(promo.end_date);
          document.getElementById('promotionActive').checked = promo.active;
        }
      });
  } else {
    document.getElementById('promotionModalTitle').textContent = 'Add Promotion';
    document.getElementById('promotionForm').reset();
    document.getElementById('promotionId').value = '';
  }
}

function closePromotionModal() {
  document.getElementById('promotionModal').classList.remove('active');
  document.getElementById('promotionForm').reset();
}

function editPromotion(id) {
  openPromotionModal(id);
}

function deletePromotion(id) {
  if (!confirm('Are you sure you want to delete this promotion?')) return;

  fetchWithAuth(`/admin/promotions/${id}`, { method: 'DELETE' })
    .then(() => {
      loadPromotions();
      alert('Promotion deleted successfully');
    })
    .catch(err => alert('Error deleting promotion: ' + err.message));
}

document.getElementById('promotionForm').addEventListener('submit', (e) => {
  e.preventDefault();

  const id = document.getElementById('promotionId').value;
  const data = {
    title: document.getElementById('promotionTitle').value,
    description: document.getElementById('promotionDescription').value,
    type: document.getElementById('promotionType').value,
    start_date: document.getElementById('promotionStartDate').value || null,
    end_date: document.getElementById('promotionEndDate').value || null,
    active: document.getElementById('promotionActive').checked,
  };

  const url = id ? `/admin/promotions/${id}` : '/admin/promotions';
  const method = id ? 'PUT' : 'POST';

  fetchWithAuth(url, {
    method,
    body: JSON.stringify(data),
  })
    .then(() => {
      closePromotionModal();
      loadPromotions();
      alert('Promotion saved successfully');
    })
    .catch(err => {
      document.getElementById('promotionError').textContent = 'Error: ' + err.message;
      document.getElementById('promotionError').classList.remove('hidden');
    });
});

// Chat (escalations)
let activeConversationUserId = null;
let chatListPollInterval = null;
let activeChatPollInterval = null;

function loadConversations() {
  fetchWithAuth('/admin/conversations')
    .then(data => {
      updateChatBadge(data.length);

      const list = document.getElementById('conversationList');
      list.innerHTML = '';

      if (data.length === 0) {
        list.innerHTML = '<p style="color:#9ca3af; padding: 10px;">Tidak ada eskalasi aktif.</p>';
        return;
      }

      data.forEach(conv => {
        const div = document.createElement('div');
        div.className = 'conversation-item' + (conv.user_id === activeConversationUserId ? ' active' : '');
        div.innerHTML = `
          <div class="conversation-user">${conv.user_id}</div>
          <div class="conversation-channel">${conv.channel === 'whatsapp' ? '📱 WhatsApp' : '🌐 Web'}</div>
          <div class="conversation-summary">${conv.escalation_summary || 'Belum ada ringkasan'}</div>
        `;
        div.addEventListener('click', () => openConversation(conv));
        list.appendChild(div);
      });
    });
}

function openConversation(conv) {
  activeConversationUserId = conv.user_id;
  document.getElementById('chatEmpty').classList.add('hidden');
  document.getElementById('chatActive').classList.remove('hidden');
  document.getElementById('chatActiveUser').textContent =
    conv.user_id + (conv.channel === 'whatsapp' ? ' (WhatsApp)' : ' (Web)');
  document.getElementById('chatActiveSummary').textContent = conv.escalation_summary || '';

  loadMessages();
  loadConversations();
  startActiveChatPolling();
}

function loadMessages() {
  if (!activeConversationUserId) return;

  fetchWithAuth(`/admin/conversations/${encodeURIComponent(activeConversationUserId)}/messages`)
    .then(data => {
      const container = document.getElementById('chatMessages');
      container.innerHTML = '';
      data.forEach(m => {
        const div = document.createElement('div');
        div.className = `chat-bubble ${m.sender}`;
        div.textContent = m.content;
        container.appendChild(div);
      });
      container.scrollTop = container.scrollHeight;
    });
}

function startChatListPolling() {
  stopChatListPolling();
  chatListPollInterval = setInterval(loadConversations, 6000);
}

function stopChatListPolling() {
  if (chatListPollInterval) {
    clearInterval(chatListPollInterval);
    chatListPollInterval = null;
  }
}

function startActiveChatPolling() {
  stopActiveChatPolling();
  activeChatPollInterval = setInterval(loadMessages, 4000);
}

function stopActiveChatPolling() {
  if (activeChatPollInterval) {
    clearInterval(activeChatPollInterval);
    activeChatPollInterval = null;
  }
}

document.getElementById('chatReplyForm').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!activeConversationUserId) return;

  const input = document.getElementById('chatReplyInput');
  const message = input.value.trim();
  if (!message) return;

  fetchWithAuth(`/admin/conversations/${encodeURIComponent(activeConversationUserId)}/reply`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  })
    .then(() => {
      input.value = '';
      loadMessages();
    })
    .catch(err => alert('Gagal mengirim: ' + err.message));
});

function resolveConversation() {
  if (!activeConversationUserId) return;
  if (!confirm('Selesaikan eskalasi ini dan kembalikan percakapan ke bot?')) return;

  fetchWithAuth(`/admin/conversations/${encodeURIComponent(activeConversationUserId)}/resolve`, { method: 'POST' })
    .then(() => {
      stopActiveChatPolling();
      activeConversationUserId = null;
      document.getElementById('chatActive').classList.add('hidden');
      document.getElementById('chatEmpty').classList.remove('hidden');
      loadConversations();
    })
    .catch(err => alert('Gagal menyelesaikan: ' + err.message));
}

// Orders
const ORDER_STATUS_LABELS = {
  menunggu_pembayaran: '⏳ Menunggu Pembayaran',
  sudah_bayar: '💰 Sudah Bayar',
  dikirim: '🚚 Dikirim',
  selesai: '✅ Selesai',
  dibatalkan: '❌ Dibatalkan',
};

function loadOrders() {
  fetchWithAuth('/admin/orders')
    .then(data => {
      const tbody = document.getElementById('orderList');
      tbody.innerHTML = '';

      data.forEach(order => {
        const tr = document.createElement('tr');
        const customerName = order.customer ? order.customer.name : '-';
        const productName = order.product ? order.product.name : '-';
        const variant = order.product_variant ? `${order.product_variant.size}/${order.product_variant.color}` : '-';
        const createdAt = new Date(order.created_at).toLocaleString('id-ID');

        const statusOptions = Object.keys(ORDER_STATUS_LABELS)
          .map(s => `<option value="${s}" ${s === order.status ? 'selected' : ''}>${ORDER_STATUS_LABELS[s]}</option>`)
          .join('');

        tr.innerHTML = `
          <td>${order.order_number}</td>
          <td>${customerName}</td>
          <td>${productName} (${variant})</td>
          <td>${order.quantity}</td>
          <td>Rp${Number(order.total_amount || 0).toLocaleString('id-ID')}</td>
          <td>${order.payment_method === 'qris' ? 'QRIS' : 'Transfer Bank'}</td>
          <td><select onchange="updateOrderStatus(${order.id}, this.value)">${statusOptions}</select></td>
          <td>${createdAt}</td>
        `;
        tbody.appendChild(tr);
      });
    });
}

function updateOrderStatus(id, status) {
  fetchWithAuth(`/admin/orders/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }).catch(err => alert('Gagal update status: ' + err.message));
}

// Customers
function loadCustomers() {
  fetchWithAuth('/admin/customers')
    .then(data => {
      const tbody = document.getElementById('customerList');
      tbody.innerHTML = '';

      data.forEach(customer => {
        const tr = document.createElement('tr');
        const createdAt = new Date(customer.created_at).toLocaleDateString('id-ID');
        tr.innerHTML = `
          <td>${customer.customer_code}</td>
          <td>${customer.name}</td>
          <td>${customer.phone || '-'}</td>
          <td>${customer.address || '-'}</td>
          <td>${createdAt}</td>
        `;
        tbody.appendChild(tr);
      });
    });
}

// Settings
function loadSettings() {
  fetchWithAuth('/admin/settings')
    .then(settings => {
      document.getElementById('settingsEnableBankTransfer').checked = settings.enable_bank_transfer;
      document.getElementById('settingsBankName').value = settings.bank_name || '';
      document.getElementById('settingsBankAccountNumber').value = settings.bank_account_number || '';
      document.getElementById('settingsBankAccountHolder').value = settings.bank_account_holder || '';
      document.getElementById('settingsEnableQRIS').checked = settings.enable_qris;
      document.getElementById('settingsQrisImageUrl').value = settings.qris_image_url || '';
      document.getElementById('settingsShippingCost').value = settings.shipping_cost || 0;
      document.getElementById('settingsPaymentDeadlineHours').value = settings.payment_deadline_hours || 24;
      document.getElementById('settingsClosingMessage').value = settings.closing_message || '';
    });
}

document.getElementById('settingsForm').addEventListener('submit', (e) => {
  e.preventDefault();

  const data = {
    enable_bank_transfer: document.getElementById('settingsEnableBankTransfer').checked,
    bank_name: document.getElementById('settingsBankName').value,
    bank_account_number: document.getElementById('settingsBankAccountNumber').value,
    bank_account_holder: document.getElementById('settingsBankAccountHolder').value,
    enable_qris: document.getElementById('settingsEnableQRIS').checked,
    qris_image_url: document.getElementById('settingsQrisImageUrl').value,
    shipping_cost: parseInt(document.getElementById('settingsShippingCost').value) || 0,
    payment_deadline_hours: parseInt(document.getElementById('settingsPaymentDeadlineHours').value) || 24,
    closing_message: document.getElementById('settingsClosingMessage').value,
  };

  fetchWithAuth('/admin/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
    .then(() => {
      document.getElementById('settingsSuccess').textContent = 'Settings berhasil disimpan!';
      document.getElementById('settingsSuccess').classList.remove('hidden');
      document.getElementById('settingsError').classList.add('hidden');
      setTimeout(() => document.getElementById('settingsSuccess').classList.add('hidden'), 3000);
    })
    .catch(err => {
      document.getElementById('settingsError').textContent = 'Error: ' + err.message;
      document.getElementById('settingsError').classList.remove('hidden');
    });
});

// Product Variants
let activeVariantProductId = null;

function openVariantModal(productId, productName) {
  activeVariantProductId = productId;
  document.getElementById('variantModalTitle').textContent = `Manage Variants - ${productName}`;
  document.getElementById('variantModal').classList.add('active');
  document.getElementById('variantError').classList.add('hidden');
  document.getElementById('variantForm').reset();
  loadVariants();
}

function closeVariantModal() {
  activeVariantProductId = null;
  document.getElementById('variantModal').classList.remove('active');
}

function loadVariants() {
  if (!activeVariantProductId) return;

  fetchWithAuth(`/admin/products/${activeVariantProductId}/variants`)
    .then(data => {
      const tbody = document.getElementById('variantList');
      tbody.innerHTML = '';

      data.forEach(variant => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${variant.size}</td>
          <td>${variant.color}</td>
          <td><input type="number" value="${variant.stock}" style="width: 80px;" onchange="updateVariantStock(${variant.id}, this.value)" /></td>
          <td><button class="btn btn-danger" style="padding: 5px 10px;" onclick="deleteVariant(${variant.id})">Delete</button></td>
        `;
        tbody.appendChild(tr);
      });
    });
}

function updateVariantStock(variantId, stock) {
  fetchWithAuth(`/admin/variants/${variantId}`, {
    method: 'PUT',
    body: JSON.stringify({ stock: parseInt(stock) || 0 }),
  }).catch(err => alert('Gagal update stok: ' + err.message));
}

function deleteVariant(variantId) {
  if (!confirm('Hapus varian ini?')) return;

  fetchWithAuth(`/admin/variants/${variantId}`, { method: 'DELETE' })
    .then(() => loadVariants())
    .catch(err => alert('Gagal menghapus: ' + err.message));
}

document.getElementById('variantForm').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!activeVariantProductId) return;

  const data = {
    size: document.getElementById('variantSize').value,
    color: document.getElementById('variantColor').value,
    stock: parseInt(document.getElementById('variantStock').value) || 0,
  };

  fetchWithAuth(`/admin/products/${activeVariantProductId}/variants`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
    .then(() => {
      document.getElementById('variantForm').reset();
      loadVariants();
    })
    .catch(err => {
      document.getElementById('variantError').textContent = 'Error: ' + err.message;
      document.getElementById('variantError').classList.remove('hidden');
    });
});
