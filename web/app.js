// brand Web Chat — front-end
const SESSION_KEY = 'brand_session_id';

function getSessionId() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = 'web-' + crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

const sessionId = getSessionId();
const messagesEl = document.getElementById('messages');
const form = document.getElementById('composer');
const input = document.getElementById('input');
const sendBtn = document.getElementById('sendBtn');
const resetBtn = document.getElementById('resetBtn');

// Status tracking
let isOnline = false;
let healthCheckInterval = null;
let adminPollInterval = null;
let lastAdminMessageId = 0;

function updateStatus(online) {
  isOnline = online;
  const statusDots = document.querySelectorAll('.dot');
  const statusTexts = document.querySelectorAll('.status-row span:not(.dot), .header-info .status');

  statusDots.forEach(dot => {
    if (online) {
      dot.style.background = 'var(--online)';
      dot.style.boxShadow = '0 0 0 4px rgba(236, 72, 153, 0.18)';
    } else {
      dot.style.background = '#94a3b8';
      dot.style.boxShadow = '0 0 0 4px rgba(148, 163, 184, 0.18)';
    }
  });

  statusTexts.forEach(text => {
    if (text.classList.contains('status')) {
      // Header status
      text.innerHTML = `<span class="dot"></span> ${online ? 'Online' : 'Offline'}`;
      const newDot = text.querySelector('.dot');
      if (newDot) {
        if (online) {
          newDot.style.background = 'var(--online)';
          newDot.style.boxShadow = '0 0 0 4px rgba(236, 72, 153, 0.18)';
        } else {
          newDot.style.background = '#94a3b8';
          newDot.style.boxShadow = '0 0 0 4px rgba(148, 163, 184, 0.18)';
        }
      }
    } else if (!text.classList.contains('dot')) {
      // Sidebar status text
      text.textContent = online ? 'Online' : 'Offline';
    }
  });
}

async function checkHealth() {
  try {
    const res = await fetch('/health', {
      method: 'GET',
      signal: AbortSignal.timeout(5000)
    });
    const wasOnline = isOnline;
    const nowOnline = res.ok;

    if (wasOnline !== nowOnline) {
      updateStatus(nowOnline);
      if (!nowOnline) {
        appendSystem('⚠️ Bot sedang offline. Coba lagi nanti.');
      } else {
        appendSystem('✅ Bot kembali online.');
      }
    } else if (!wasOnline && !nowOnline) {
      updateStatus(false);
    } else {
      updateStatus(true);
    }
  } catch (e) {
    const wasOnline = isOnline;
    updateStatus(false);
    if (wasOnline) {
      appendSystem('⚠️ Bot sedang offline. Cek koneksi atau gateway.');
    }
  }
}

function startHealthCheck() {
  // Initial check
  checkHealth();
  // Check every 10 seconds
  healthCheckInterval = setInterval(checkHealth, 10000);
}

function stopHealthCheck() {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }
}

function timeNow() {
  return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
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

  // Check if offline before sending
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

// Auto-grow textarea
input.addEventListener('input', () => {
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 120) + 'px';
});

// Enter to send, Shift+Enter for newline
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    form.dispatchEvent(new Event('submit'));
  }
});

// Quick prompt chips
document.querySelectorAll('.chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    const prompt = chip.dataset.prompt;
    input.value = prompt;
    input.focus();
  });
});

// Reset conversation
resetBtn.addEventListener('click', () => {
  if (!confirm('Reset percakapan? History akan dihapus.')) return;
  localStorage.removeItem(SESSION_KEY);
  location.reload();
});

// Initial greeting
window.addEventListener('DOMContentLoaded', () => {
  appendSystem('Session ID: ' + sessionId);
  appendSystem('Sapa brand dengan pesan apa saja untuk memulai.');
  input.focus();

  // Start health check
  startHealthCheck();
  startAdminPolling();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  stopHealthCheck();
  stopAdminPolling();
});
