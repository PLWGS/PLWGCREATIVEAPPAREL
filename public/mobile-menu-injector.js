(function () {
  'use strict';
  
  if (window.__DISABLE_INJECTOR__) { 
    console.debug('Injector disabled on this page'); 
    return; 
  }

  if (window.__MOBILE_MENU_INJECTOR_LOADED__) return;
  window.__MOBILE_MENU_INJECTOR_LOADED__ = true;
  window.__DHWS_INJECTOR_VERSION__ = '2025-08-09-6';

  const MOBILE_MAX_WIDTH_PX = 640;

  function isMobileViewport() {
    const w = window.innerWidth || document.documentElement.clientWidth || 0;
    return w <= MOBILE_MAX_WIDTH_PX;
  }

  function ensureToolbar() {
    if (!isMobileViewport()) {
      const existing = document.getElementById('globalTopRightBar');
      if (existing) existing.remove();
      return;
    }

    if (document.getElementById('globalTopRightBar')) return;

    // If a native/hardcoded menu toggle exists, do not duplicate
    const nativeMenu = document.querySelector(
      'button[id*="menu" i], button[aria-label*="menu" i], [data-menu-toggle]'
    );
    if (nativeMenu) return;

    const bar = document.createElement('div');
    bar.id = 'globalTopRightBar';
    bar.style.cssText = [
      'position:fixed',
      'top:env(safe-area-inset-top,10px)',
      'left:50%',
      'transform:translateX(-50%)',
      'z-index:2147483647',
      'display:flex',
      'gap:10px',
      'pointer-events:auto'
    ].join(';');

    const baseBtnStyle = [
      'font-size:22px',
      'padding:8px 10px',
      'border-radius:10px',
      'border:0',
      'background:rgba(0,0,0,0.65)',
      'color:#fff',
      'box-shadow:0 0 0 2px rgba(0,188,212,0.7)'
    ].join(';');

    const menuBtn = document.createElement('button');
    menuBtn.id = 'globalMenuBtn';
    menuBtn.setAttribute('aria-label', 'Open menu');
    menuBtn.textContent = '☰';
    menuBtn.style.cssText = baseBtnStyle;

    const cartBtn = document.createElement('button');
    cartBtn.id = 'globalCartBtn';
    cartBtn.setAttribute('aria-label', 'Cart');
    cartBtn.textContent = '🛒';
    cartBtn.style.cssText = baseBtnStyle;

    menuBtn.addEventListener('click', toggleMobileDrawer);
    cartBtn.addEventListener('click', () => {
      const cartTarget = document.querySelector('#cart-button, a[href*="cart.html" i]');
      if (cartTarget && cartTarget.click) {
        cartTarget.click();
        return;
      }
      const here = window.location.pathname;
      const target = /\/pages\//.test(here) ? 'cart.html' : '/pages/cart.html';
      window.location.href = target;
    });

    bar.appendChild(menuBtn);
    bar.appendChild(cartBtn);
    document.body.appendChild(bar);
    try { document.body.style.overflowX = 'visible'; } catch (_) {}
  }

  function createMobileDrawer() {
    if (document.getElementById('globalMobileDrawer')) return;

    const overlay = document.createElement('div');
    overlay.id = 'globalDrawerOverlay';
    overlay.style.cssText = [
      'position:fixed',
      'inset:0',
      'background:rgba(0,0,0,.5)',
      'z-index:2147483646',
      'display:none'
    ].join(';');
    overlay.addEventListener('click', closeMobileDrawer);

    const drawer = document.createElement('div');
    drawer.id = 'globalMobileDrawer';
    drawer.style.cssText = [
      'position:fixed',
      'top:0',
      'right:-300px',
      'width:280px',
      'height:100vh',
      'background:#111',
      'color:#fff',
      'z-index:2147483647',
      'transition:right .25s ease',
      'padding:20px',
      'overflow:auto'
    ].join(';');

    drawer.innerHTML = [
      "<nav>",
      "<a style='display:block;padding:10px 0;color:#0bd;text-decoration:none' href='/../index.html'>Home</a>",
      "<a style='display:block;padding:10px 0;color:#0bd;text-decoration:none' href='/pages/shop.html'>Shop</a>",
      "<a style='display:block;padding:10px 0;color:#0bd;text-decoration:none' href='/pages/account.html'>My Account</a>",
      "<a style='display:block;padding:10px 0;color:#0bd;text-decoration:none' href='/pages/cart.html'>Cart</a>",
      "</nav>"
    ].join('');

    document.body.appendChild(overlay);
    document.body.appendChild(drawer);
  }

  function toggleMobileDrawer() {
    const drawer = document.getElementById('globalMobileDrawer');
    const overlay = document.getElementById('globalDrawerOverlay');
    if (!drawer || !overlay) {
      createMobileDrawer();
      return toggleMobileDrawer();
    }
    const open = drawer.style.right === '0px';
    if (open) {
      closeMobileDrawer();
    } else {
      overlay.style.display = 'block';
      requestAnimationFrame(() => { drawer.style.right = '0px'; });
      document.body.style.overflow = 'hidden';
    }
  }

  function closeMobileDrawer() {
    const drawer = document.getElementById('globalMobileDrawer');
    const overlay = document.getElementById('globalDrawerOverlay');
    if (!drawer || !overlay) return;
    drawer.style.right = '-300px';
    document.body.style.overflow = '';
    setTimeout(() => { overlay.style.display = 'none'; }, 250);
  }

  function abbreviateBrandOnce() {
    if (!isMobileViewport()) return;
    if (window.__BRAND_ABBREVIATED__) return;
    let target = null;
    // Prefer header/nav regions
    const scoped = document.querySelectorAll('header *, nav *, [class*="header" i] *, [id*="header" i] *');
    for (const el of scoped) {
      const t = (el.textContent || '').trim();
      if (t === 'PlwgsCreativeApparel') { target = el; break; }
    }
    // Fallback: first exact match near the top of the page
    if (!target) {
      const all = document.querySelectorAll('span, a, div, h1, h2');
      for (const el of all) {
        const t = (el.textContent || '').trim();
        if (t === 'PlwgsCreativeApparel') {
          const r = el.getBoundingClientRect();
          if (r.top >= 0 && r.top <= 200) { target = el; break; }
        }
      }
    }
    if (target) {
      target.textContent = 'PLWGS';
      target.style.fontSize = '20px';
      target.style.fontWeight = '800';
      target.style.letterSpacing = '0.5px';
      window.__BRAND_ABBREVIATED__ = true;
    }
  }

  function init() {
    ensureToolbar();
    createMobileDrawer();
    abbreviateBrandOnce();
    setTimeout(abbreviateBrandOnce, 150);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { ensureToolbar(); abbreviateBrandOnce(); }, 100);
  });

  // Persist if removed by other scripts
  const mo = new MutationObserver(() => {
    if (!isMobileViewport()) return;
    if (!document.getElementById('globalTopRightBar')) ensureToolbar();
    if (!window.__BRAND_ABBREVIATED__) abbreviateBrandOnce();
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });
})();


