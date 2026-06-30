// Floating chat bubble widget - injected on every page that includes this script.
(function () {
  const sessionId = getSessionId();

  const root = document.createElement('div');
  root.id = 'chatWidgetRoot';
  root.innerHTML = `
    <button id="chatLauncher" class="chat-launcher" aria-label="Buka chat">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
    </button>
    <div id="chatPanel" class="chat-panel-floating hidden">
      <div class="app">
        <header class="chat-header">
          <div class="avatar">B</div>
          <div class="header-info">
            <h2>brand</h2>
            <span class="status"><span class="dot"></span> Online</span>
          </div>
          <button id="resetBtn" class="icon-btn" aria-label="Reset percakapan" title="Reset percakapan">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="1 4 1 10 7 10"></polyline>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
            </svg>
          </button>
          <button id="chatCloseBtn" class="icon-btn" aria-label="Tutup chat" title="Tutup">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </header>

        <div id="messages" class="messages"></div>

        <div class="suggestions" id="suggestions">
          <button class="chip" data-prompt="halo, aku cari kaos ukuran L">Cari kaos size L</button>
          <button class="chip" data-prompt="ada promo apa aja hari ini?">Promo hari ini</button>
          <button class="chip" data-prompt="bahan cotton combed 30s ready warna apa aja?">Stok cotton combed</button>
          <button class="chip" data-prompt="ongkir ke Jakarta berapa?">Ongkir ke Jakarta</button>
        </div>

        <form id="composer" class="composer" autocomplete="off">
          <textarea id="input" placeholder="Tulis pesan ke brand..." rows="1"></textarea>
          <button type="submit" id="sendBtn" aria-label="Kirim">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </form>
      </div>
    </div>
  `;
  document.body.appendChild(root);

  const launcher = document.getElementById('chatLauncher');
  const panel = document.getElementById('chatPanel');
  const closeBtn = document.getElementById('chatCloseBtn');
  const messagesEl = document.getElementById('messages');
  const form = document.getElementById('composer');
  const input = document.getElementById('input');
  const sendBtn = document.getElementById('sendBtn');
  const resetBtn = document.getElementById('resetBtn');

  let isOnline = false;
  let healthCheckInterval = null;
  let adminPollInterval = null;
  let lastAdminMessageId = 0;
  let hasOpenedOnce = false;

  function updateStatus(online) {
    isOnline = online;
    root.querySelectorAll('.dot').forEach(dot => {
      dot.classList.toggle('offline', !online);
    });
    const statusEl = root.querySelector('.header-info .status');
    if (statusEl) {
      statusEl.innerHTML = `<span class="dot${online ? '' : ' offline'}"></span> ${online ? 'Online' : 'Offline'}`;
    }
  }

  async function checkHealth() {
    try {
      const res = await fetch('/health', { method: 'GET', signal: AbortSignal.timeout(5000) });
      const wasOnline = isOnline;
      const nowOnline = res.ok;
      if (wasOnline !== nowOnline) {
        updateStatus(nowOnline);
        if (hasOpenedOnce) {
          appendSystem(nowOnline ? 'Bot kembali online.' : 'Bot sedang offline. Coba lagi nanti.');
        }
      } else {
        updateStatus(nowOnline);
      }
    } catch (e) {
      const wasOnline = isOnline;
      updateStatus(false);
      if (wasOnline && hasOpenedOnce) {
        appendSystem('Bot sedang offline. Cek koneksi atau gateway.');
      }
    }
  }

  function startHealthCheck() {
    checkHealth();
    healthCheckInterval = setInterval(checkHealth, 10000);
  }

  function stopHealthCheck() {
    if (healthCheckInterval) {
      clearInterval(healthCheckInterval);
      healthCheckInterval = null;
    }
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function formatInline(line) {
    return escapeHtml(line).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }

  // Renders a minimal markdown subset (bullet lists, **bold**, line breaks) so
  // LLM replies show up as actual lists instead of one flat paragraph.
  function renderBotText(text) {
    const lines = text.split('\n');
    let html = '';
    let inList = false;
    const closeList = () => {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
    };
    lines.forEach((rawLine) => {
      const line = rawLine.trim();
      if (/^-{3,}$/.test(line)) {
        closeList();
        html += '<hr>';
        return;
      }
      const bulletMatch = line.match(/^[*\-]\s+(.*)/);
      if (bulletMatch) {
        if (!inList) {
          html += '<ul>';
          inList = true;
        }
        html += `<li>${formatInline(bulletMatch[1])}</li>`;
      } else {
        closeList();
        if (line) {
          html += `<p>${formatInline(line)}</p>`;
        }
      }
    });
    closeList();
    return html;
  }

  function appendMessage(text, role) {
    const div = document.createElement('div');
    div.className = `msg ${role}`;
    if (role === 'bot' || role === 'admin') {
      div.innerHTML = renderBotText(text);
    } else {
      div.textContent = text;
    }
    const meta = document.createElement('span');
    meta.className = 'meta';
    meta.textContent = role === 'user' ? 'Kamu' : role === 'admin' ? 'Admin' : 'brand';
    div.appendChild(meta);
    messagesEl.appendChild(div);
    scrollToBottom();
    return div;
  }

  async function pollAdminMessages() {
    try {
      const res = await fetch(`/chat/${encodeURIComponent(sessionId)}/admin-messages?after=${lastAdminMessageId}`);
      if (!res.ok) return;
      const messages = await res.json();
      messages.forEach((m) => {
        appendMessage(m.content, 'admin');
        lastAdminMessageId = m.id;
      });
    } catch (e) {
      // silent - health check already surfaces connectivity issues
    }
  }

  function startAdminPolling() {
    pollAdminMessages();
    adminPollInterval = setInterval(pollAdminMessages, 4000);
  }

  function stopAdminPolling() {
    if (adminPollInterval) {
      clearInterval(adminPollInterval);
      adminPollInterval = null;
    }
  }

  function appendSystem(text) {
    const div = document.createElement('div');
    div.className = 'msg system';
    div.textContent = text;
    messagesEl.appendChild(div);
    scrollToBottom();
  }

  function appendTyping() {
    const div = document.createElement('div');
    div.className = 'typing';
    div.id = 'typing';
    div.innerHTML = '<span></span><span></span><span></span>';
    messagesEl.appendChild(div);
    scrollToBottom();
    return div;
  }

  function removeTyping() {
    const t = document.getElementById('typing');
    if (t) t.remove();
  }

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function setBusy(busy) {
    sendBtn.disabled = busy;
    input.disabled = busy;
    if (busy) {
      sendBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10" opacity="0.3"></circle><path d="M12 6v6l4 2"></path></svg>';
    } else {
      sendBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>';
    }
  }

  async function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (!isOnline) {
      appendMessage(trimmed, 'user');
      appendMessage('Bot sedang offline. Tunggu sampai online kembali ya.', 'bot');
      return;
    }

    appendMessage(trimmed, 'user');
    setBusy(true);
    appendTyping();

    try {
      const res = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message: trimmed }),
      });
      if (!res.ok) {
        removeTyping();
        appendMessage('Maaf, server lagi ada masalah. Coba lagi sebentar ya.', 'bot');
        updateStatus(false);
        return;
      }
      const data = await res.json();
      removeTyping();
      appendMessage(data.reply, 'bot');
      updateStatus(true);
    } catch (e) {
      removeTyping();
      appendMessage('Koneksi gagal. Cek apakah server jalan.', 'bot');
      updateStatus(false);
      console.error(e);
    } finally {
      setBusy(false);
      input.focus();
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value;
    input.value = '';
    input.style.height = 'auto';
    sendMessage(text);
  });

  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      form.dispatchEvent(new Event('submit'));
    }
  });

  root.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => sendMessage(chip.dataset.prompt));
  });

  resetBtn.addEventListener('click', () => {
    if (!confirm('Reset percakapan? History akan dihapus.')) return;
    localStorage.removeItem(SESSION_KEY);
    location.reload();
  });

  function openPanel() {
    panel.classList.remove('hidden');
    if (!hasOpenedOnce) {
      hasOpenedOnce = true;
      appendSystem('Sapa brand dengan pesan apa saja, atau pilih salah satu saran di bawah.');
    }
    input.focus();
  }

  function closePanel() {
    panel.classList.add('hidden');
  }

  launcher.addEventListener('click', () => {
    if (panel.classList.contains('hidden')) {
      openPanel();
    } else {
      closePanel();
    }
  });
  closeBtn.addEventListener('click', closePanel);

  startHealthCheck();
  startAdminPolling();

  window.addEventListener('beforeunload', () => {
    stopHealthCheck();
    stopAdminPolling();
  });
})();
