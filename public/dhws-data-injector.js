// Mobile/header injector – ensures hamburger + cart and brand abbreviation on small screens
(function () {
  if (window.__DHWS_INJECTOR_ACTIVE__) return; // prevent double-run
  window.__DHWS_INJECTOR_ACTIVE__ = true;
  window.__DHWS_INJECTOR_VERSION__ = '2025-08-09-1';

  const log = (...args) => {
    try { console.log('[dhws-data-injector]', ...args); } catch (_) {}
  };

  function ready(fn) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fn);
    } else { fn(); }
  }

  function ensureStyles() {
    if (document.getElementById('dhws-injector-styles')) return;
    const style = document.createElement('style');
    style.id = 'dhws-injector-styles';
    style.textContent = `
      /* Centered, highly visible toolbar (mobile-only; hidden on >=641px) */
      #globalTopRightBar { position: fixed; top: 12px; left: 50%; transform: translateX(-50%); z-index: 2147483647; display: flex; gap: 12px; align-items: center; justify-content: center; pointer-events: none; }
      #globalTopRightBar button { pointer-events: auto; font-size: 24px !important; line-height: 1; padding: 10px 12px; border-radius: 12px; border: 0; background: rgba(0,0,0,0.65); color: #fff; box-shadow: 0 0 0 2px rgba(0,188,212,0.7); }
      @media (max-width: 360px) { #globalTopRightBar { top: 10px; } #globalTopRightBar button { font-size: 22px !important; padding: 8px 10px; } }
      @media (min-width: 641px) { #globalTopRightBar { display: none !important; } }
      #globalMobileDrawer { position: fixed; top: 0; right: 0; height: 100%; width: min(82vw, 320px); background: rgba(20,20,20,0.96); color: #fff; z-index: 2147483646; transform: translateX(100%); transition: transform .25s ease; padding: 20px; overflow-y: auto; box-shadow: -8px 0 24px rgba(0,0,0,0.5); }
      #globalMobileDrawer.open { transform: translateX(0); }
      #globalDrawerOverlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 2147483645; display: none; }
      #globalDrawerOverlay.show { display: block; }
      .dhws-hide-admin-link a[href*="admin.html" i] { display: none !important; }
      @media (min-width: 641px) { #globalMobileDrawer, #globalDrawerOverlay { display: none !important; } }
    `;
    document.head.appendChild(style);
  }

  function abbreviateBrand() {
    const width = window.innerWidth || document.documentElement.clientWidth;
    // Find likely brand text element: small inline element inside header with no children
    const candidates = Array.from(document.querySelectorAll('header a, header span, header h1'))
      .filter(el => el.childElementCount === 0)
      .filter(el => /plwgs\s*creative\s*apparel/i.test((el.textContent || '').trim()));

    candidates.forEach(el => {
      if (!el.dataset.fullBrandText) el.dataset.fullBrandText = el.textContent.trim();
      if (width <= 480) {
        // Abbreviate only on small screens
        el.textContent = 'PLWGS';
        el.style.fontSize = '22px';
        el.style.fontWeight = '800';
        el.style.letterSpacing = '0.6px';
        el.style.color = '#00bcd4';
        el.style.textShadow = '0 0 8px rgba(0,188,212,0.35)';
      } else if (el.dataset.fullBrandText) {
        // Restore on larger screens
        el.textContent = el.dataset.fullBrandText;
        el.style.textShadow = '';
      }
    });
  }

  function buildDrawerFromHeaderLinks() {
    const drawer = document.createElement('div');
    drawer.id = 'globalMobileDrawer';
    const overlay = document.createElement('div');
    overlay.id = 'globalDrawerOverlay';

    function close() { drawer.classList.remove('open'); overlay.classList.remove('show'); }
    overlay.addEventListener('click', close);

    const navLinks = Array.from(document.querySelectorAll('header nav a, header a, nav a'))
      .filter(a => a.href && !/#|javascript:/i.test(a.getAttribute('href') || ''))
      .slice(0, 12)
      .map(a => ({ href: a.getAttribute('href'), text: (a.textContent || a.getAttribute('aria-label') || 'Link').trim() }));

    const list = navLinks.map(l => `<div style="padding:12px 6px; border-bottom: 1px solid rgba(255,255,255,0.08);"><a href="${l.href}" style="color:#00bcd4; text-decoration:none; font-weight:600;">${l.text}</a></div>`).join('');
    drawer.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;"><div style="font-weight:800; color:#00bcd4;">Menu</div><button id="globalDrawerClose" style="font-size:18px; background:transparent; color:#fff; border:0;">✕</button></div>${list}`;
    drawer.querySelector('#globalDrawerClose').addEventListener('click', close);

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);
    return { drawer, overlay, open: () => { drawer.classList.add('open'); overlay.classList.add('show'); } };
  }

  function ensureToolbar() {
    if (document.getElementById('globalTopRightBar')) return;

    // If the page already has its own menu toggle, skip injecting ours
    const nativeMenu = document.querySelector('button[id*="menu" i], button[class*="menu" i], button[aria-label*="menu" i]');
    if (nativeMenu) { log('native hamburger detected – skipping injection'); return; }

    const { drawer, overlay, open } = buildDrawerFromHeaderLinks();

    const bar = document.createElement('div');
    bar.id = 'globalTopRightBar';

    const menuBtn = document.createElement('button');
    menuBtn.id = 'globalMenuBtn';
    menuBtn.setAttribute('aria-label', 'Open menu');
    menuBtn.textContent = '☰';
    menuBtn.addEventListener('click', () => open());

    // Reuse existing cart if present; otherwise add fallback
    let cartTarget = document.querySelector('#cart-button, a[href*="cart.html" i]');
    const cartBtn = document.createElement('button');
    cartBtn.id = 'globalCartBtn';
    cartBtn.setAttribute('aria-label', 'Cart');
    cartBtn.textContent = '🛒';
    cartBtn.addEventListener('click', () => {
      if (cartTarget && cartTarget.click) { cartTarget.click(); return; }
      const here = window.location.pathname;
      const target = /\/pages\//.test(here) ? 'cart.html' : '/pages/cart.html';
      window.location.href = target;
    });

    bar.appendChild(menuBtn);
    bar.appendChild(cartBtn);
    document.body.appendChild(bar);
    // Ensure toolbar not hidden by parent overflow
    const root = document.documentElement; const body = document.body;
    if (getComputedStyle(body).overflow !== 'visible') { body.style.overflowX = 'visible'; }
    log('toolbar injected');
  }

  function hideAdminLinksUntilVerified() {
    // Add a guard class that hides admin links; could be removed by your verify flow
    document.documentElement.classList.add('dhws-hide-admin-link');
  }

  function boot() {
    ensureStyles();
    abbreviateBrand();
    // Only for small screens; desktop stays untouched (and ensure any accidental debug content is cleared)
    function maybeInject() {
      const w = (window.innerWidth || document.documentElement.clientWidth);
      const bar = document.getElementById('globalTopRightBar');
      if (w <= 640 && !bar) {
        ensureToolbar();
      }
      if (w > 640 && bar) {
        bar.remove();
      }
      // Remove any accidental text nodes that some themes inject at top-level inside header
      const header = document.querySelector('header');
      if (header) {
        Array.from(header.childNodes).forEach(node => {
          if (node.nodeType === Node.TEXT_NODE && node.textContent && node.textContent.trim().length > 0) {
            node.textContent = ''; // clear stray text
          }
        });
      }
    }

    maybeInject();
    window.addEventListener('resize', maybeInject);
    hideAdminLinksUntilVerified();
    window.addEventListener('resize', abbreviateBrand);
    log('Loaded v', window.__DHWS_INJECTOR_VERSION__);
  }

  ready(boot);
})();
