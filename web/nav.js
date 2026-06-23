// Shared site navigation, injected into <div id="site-nav-root"></div> on every page.
(function () {
  const NAV_LINKS = [
    { href: '/', label: 'Home' },
    { href: '/order.html', label: 'Order' },
    { href: '/about.html', label: 'About Us' },
  ];

  function renderNav(loggedIn) {
    const root = document.getElementById('site-nav-root');
    if (!root) return;

    const path = window.location.pathname;
    const linksHtml = NAV_LINKS.map((link) => {
      const isActive = link.href === path;
      return `<a href="${link.href}" class="${isActive ? 'active' : ''}">${link.label}</a>`;
    }).join('');

    const actionsHtml = loggedIn
      ? `<a href="/profile.html" class="btn btn-ghost btn-sm">Profile</a>`
      : `<a href="/login.html" class="btn btn-ghost btn-sm">Login</a><a href="/register.html" class="btn btn-sm">Daftar</a>`;

    root.innerHTML = `
      <header class="site-header">
        <nav class="site-nav">
          <a href="/" style="display:flex;align-items:center;gap:10px;">
            <div class="brand-mark">B</div>
            <span class="brand-name">brand</span>
          </a>
          <div class="site-nav-links">${linksHtml}</div>
          <div class="site-nav-actions">${actionsHtml}</div>
        </nav>
      </header>
    `;
  }

  async function init() {
    renderNav(false);
    try {
      const res = await fetch('/auth/me');
      const data = await res.json();
      renderNav(!!data.logged_in);
    } catch (e) {
      // keep logged-out nav on network failure
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
