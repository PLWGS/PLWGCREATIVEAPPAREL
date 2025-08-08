
(function() {
  try { console.log('[dhws-data-injector] Loaded'); } catch (_) {}
  // Configuration
  const CONFIG = {
    attributePrefix: 'data-component',
    includeContentAttribute: true,
    maxContentLength: 1000,
    includeLegacyAttributes: true,
    includeElements: [],
    excludeElements: [],
  };

  const TAG_SHOULD_EXCLUDE = [
  "base",
  "object",
  "link",
  "meta",
  "noscript",
  "script",
  "style",
  "title",
  "animate",
  "animateMotion",
  "animateTransform",
  "circle",
  "clipPath",
  "defs",
  "desc",
  "ellipse",
  "feBlend",
  "feColorMatrix",
  "feComponentTransfer",
  "feComposite",
  "feConvolveMatrix",
  "feDiffuseLighting",
  "feDisplacementMap",
  "feDistantLight",
  "feDropShadow",
  "feFlood",
  "feFuncA",
  "feFuncB",
  "feFuncG",
  "feFuncR",
  "feGaussianBlur",
  "feImage",
  "feMerge",
  "feMergeNode",
  "feMorphology",
  "feOffset",
  "fePointLight",
  "feSpecularLighting",
  "feSpotLight",
  "feTile",
  "feTurbulence",
  "filter",
  "foreignObject",
  "g",
  "image",
  "line",
  "linearGradient",
  "marker",
  "mask",
  "metadata",
  "mpath",
  "path",
  "pattern",
  "polygon",
  "polyline",
  "radialGradient",
  "rect",
  "set",
  "stop",
  "switch",
  "symbol",
  "text",
  "textPath",
  "tspan",
  "use",
  "view",
  "body",
  "param",
]

  // Map to track per-class indices for unique component IDs
  const classIndexMap = new Map();

  /**
   * Sanitizes attribute values to prevent XSS
   */
  function sanitizeAttributeValue(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Creates a component ID based on class name and index
   */
  function createComponentId(el) {

    const path = [];
    let current = el;

    while (current && current.parentElement) {
      const siblings = Array.from(current.parentElement.children)
        .filter(child => child.tagName);
      const index = siblings.indexOf(current);
      path.unshift(index);
      current = current.parentElement;

      if (current.tagName === 'BODY') break;
    }

    const line = path.join('-')

    return sanitizeAttributeValue(line);
  }

  /**
   * Extracts text content from an element
   */
  function extractTextContent(element) {
    let text = '';
    for (const node of element.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent.trim() + ' ';
      }
    }
    return text.trim();
  }

  /**
   * Extracts attributes from an element
   */
  function extractAttributes(element) {
    const attributes = {};
    const defaultAttrs = [
      'class', 'id', 'src', 'alt', 'href', 'type', 'name', 'value'
    ];

    // Extract default attributes
    for (const attr of defaultAttrs) {
      if (element.hasAttribute(attr)) {
        if (attr === 'class') {
          attributes['className'] = element.getAttribute(attr);
        } else {
          attributes[attr] = element.getAttribute(attr);
        }
      }
    }

    const textContent = extractTextContent(element);
    if (textContent) {
      attributes['textContent'] = textContent;
    }

    return attributes;
  }

  /**
   * Determines if an element should be tagged
   */
  function shouldTagElement(element) {
    // Skip non-element nodes
    if (element.nodeType !== Node.ELEMENT_NODE) {
      return false;
    }

    const tagName = element.tagName.toLowerCase();

    if (CONFIG.includeElements.length > 0) {
      return CONFIG.includeElements.includes(tagName);
    }

    if (CONFIG.excludeElements.includes(tagName) || TAG_SHOULD_EXCLUDE.includes(tagName)) {
      return false;
    }

    return true;
  }

  /**
   * Tags an element with component metadata
   */
  function tagElement(element) {
    // Skip if already tagged
    if (element.hasAttribute(`${CONFIG.attributePrefix}-id`)) {
      return;
    }

    // Get element name
    const elementName = element.tagName.toLowerCase();

    // Create component ID
    const componentId = createComponentId(element);

    // Set ID attribute
    element.setAttribute(`${CONFIG.attributePrefix}-id`, componentId);

    // Add legacy attributes if enabled
    if (CONFIG.includeLegacyAttributes) {
      element.setAttribute(`${CONFIG.attributePrefix}-path`, window.location.pathname);
      element.setAttribute(`${CONFIG.attributePrefix}-name`, elementName);
      element.setAttribute(`${CONFIG.attributePrefix}-file`, window.location.pathname.split('/').pop());
    }

    // Add content attribute if enabled
    if (CONFIG.includeContentAttribute) {
      const attributes = extractAttributes(element);
      const content = {
        elementName,
        ...attributes
      };

      let encodedContent = encodeURIComponent(JSON.stringify(content));

      // Truncate if needed
      if (encodedContent.length > CONFIG.maxContentLength) {
        encodedContent = encodedContent.substring(0, CONFIG.maxContentLength) + '...';
      }

      element.setAttribute(`${CONFIG.attributePrefix}-content`, encodedContent);
    }
  }

  /**
   * Process all elements in the document
   */
  function processAllElements() {
    const elements = document.querySelectorAll('*');
    let taggedCount = 0;

    elements.forEach((element, index) => {
      if (shouldTagElement(element)) {
        tagElement(element, index);
        taggedCount++;
      }
    });

  }

  /**
   * Initialize the component tagger
   */
  function initialize() {
    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', processAllElements);
    } else {
      processAllElements();
    }

    // Also process on dynamic content changes
    const observer = new MutationObserver((mutations) => {

        for (const mutation of mutations) {
        if (mutation.type === 'childList') {
            for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
                if (shouldTagElement(node)) {
                tagElement(node);
                }

                // Process child elements
                const childElements = node.querySelectorAll('*');
                for (const child of childElements) {
                if (shouldTagElement(child)) {
                    tagElement(child);
                }
                }
            }
            }
        }
        }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Start the component tagger
  initialize();

  // ---------------------------------------------------------------------------
  // Site-wide helpers: hide Admin link for non-admin and add mobile hamburger
  // ---------------------------------------------------------------------------

  function injectAdminHideCSS() {
    if (document.getElementById('adminLinkHideStyle')) return;
    const style = document.createElement('style');
    style.id = 'adminLinkHideStyle';
    style.textContent = 'a[href$="admin.html"], a[href*="/admin.html"] { display:none !important; }';
    document.head.appendChild(style);
  }

  async function revealAdminIfAuthorized() {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;
      const res = await fetch('/api/admin/verify', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null);
      if (res && res.ok) {
        // Remove the hide rule and show any admin links
        const style = document.getElementById('adminLinkHideStyle');
        if (style) style.remove();
        document.querySelectorAll("a[href$='admin.html'], a[href*='/admin.html']").forEach(a => {
          a.style.display = '';
          a.classList.remove('hidden');
        });
      }
    } catch (_) { /* ignore */ }
  }

  function ensureHamburgerAndDrawer() {
    // If a hamburger already exists, do nothing
    if (document.getElementById('globalHamburger')) return;

    // Prefer an existing header right cluster; else attach to header as fallback
    const headerEl = document.querySelector('header') || document.body;
    const headerRight = document.querySelector('header .flex.items-center.space-x-4') || headerEl;
    try {
      const cs = window.getComputedStyle(headerEl);
      if (!cs || cs.position === 'static') {
        headerEl.style.position = 'relative';
      }
    } catch(_) {}

    // Create a fixed top-right toolbar container with responsive right offsets
    let trBar = document.getElementById('globalTopRightBar');
    if (!trBar) {
      trBar = document.createElement('div');
      trBar.id = 'globalTopRightBar';
      // Anchor to LEFT to guarantee visibility on very narrow simulations
      trBar.style.cssText = 'position:fixed;top:8px;left:16px;z-index:2147483647 !important;display:flex;gap:8px;align-items:center;background:transparent;padding:0;margin:0;pointer-events:auto';

      const updatePosition = () => {
        // Keep left anchoring, but adjust slight padding if needed
        const w = window.innerWidth;
        trBar.style.left = w <= 480 ? '16px' : (w <= 768 ? '16px' : '16px');
      };
      updatePosition();
      window.addEventListener('resize', updatePosition);
      document.body.appendChild(trBar);
    }

    const btn = document.createElement('button');
    btn.id = 'globalHamburger';
    btn.setAttribute('aria-label', 'Open menu');
    btn.style.cssText = 'padding:8px;border-radius:8px;background:rgba(30,30,30,0.95);color:#00bcd4;display:block !important;opacity:1;visibility:visible;pointer-events:auto;box-shadow:0 2px 8px rgba(0,0,0,0.3)';
    btn.textContent = '☰';
    trBar.appendChild(btn);
    try { console.log('[dhws-data-injector] hamburger created'); } catch(_) {}

    // If button renders at zero size, switch to text fallback to guarantee visibility
    try {
      const r = btn.getBoundingClientRect();
      if (!r || r.width < 6 || r.height < 6) {
        btn.textContent = 'MENU';
        btn.style.cssText += ';font-weight:700;font-size:16px;color:#fff;background:#0a84ff;outline:2px solid #ff0;';
      }
    } catch(_){}

    // Always show for now (force visible); we can relax later
    function syncHamburgerVisibility() {
      btn.style.setProperty('display', 'block', 'important');
    }
    syncHamburgerVisibility();
    window.addEventListener('resize', syncHamburgerVisibility);

    // Fallback cart icon (only if none exists in header)
    const hasCart = !!document.querySelector('header a[href$="cart.html"], header button#cart-button, [href*="cart"], [data-cart], .cart-btn, #cart-btn');
    let cartBtn = document.getElementById('globalCartBtn');
    if (!hasCart && !cartBtn) {
      cartBtn = document.createElement('button');
      cartBtn.id = 'globalCartBtn';
      cartBtn.setAttribute('aria-label', 'Open cart');
      cartBtn.style.cssText = 'padding:8px;border-radius:8px;background:rgba(30,30,30,0.95);color:#00bcd4;display:block !important;opacity:1;visibility:visible;pointer-events:auto;box-shadow:0 2px 8px rgba(0,0,0,0.3)';
      cartBtn.textContent = '🛒';
      cartBtn.addEventListener('click', () => { try { window.location.href = 'cart.html'; } catch(_){} });
      trBar.appendChild(cartBtn);

      try {
        const rc = cartBtn.getBoundingClientRect();
        if (!rc || rc.width < 6 || rc.height < 6) {
          cartBtn.textContent = 'CART';
          cartBtn.style.cssText += ';font-weight:700;font-size:16px;color:#fff;background:#00b894;outline:2px solid #0ff;';
        }
      } catch(_){}
      try { console.log('[dhws-data-injector] cart fallback created'); } catch(_) {}
      const syncCartVisibility = () => { cartBtn.style.setProperty('display','block','important'); };
      syncCartVisibility();
      window.addEventListener('resize', syncCartVisibility);
    }

    // Build drawer panel
    let panel = document.getElementById('mobileMenuPanel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'mobileMenuPanel';
      panel.style.cssText = 'position:fixed;inset:0;z-index:2147483646;pointer-events:none;display:block';
      panel.innerHTML = `
        <div id="mobileMenuBackdrop" style="position:absolute;inset:0;background:rgba(0,0,0,0.6);opacity:0;transition:opacity .3s"></div>
        <div id="mobileMenuSheet" style="position:absolute;right:0;top:0;bottom:0;width:300px;max-width:85%;background:#1a1a1a;color:#fff;box-shadow:0 10px 30px rgba(0,0,0,.6);transform:translateX(100%);transition:transform .3s;overflow-y:auto">
          <div style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.12);display:flex;align-items:center;justify-content:space-between">
            <span style="font-weight:700">Menu</span>
            <button id="mobileMenuClose" style="color:#a0a0a0">✕</button>
          </div>
          <nav id="mobileMenuLinks" style="padding:12px 8px"></nav>
        </div>`;
      document.body.appendChild(panel);
    }

    // Populate links from header nav; fallback to top-level header anchors
    const linksContainer = panel.querySelector('#mobileMenuLinks');
    linksContainer.innerHTML = '';
    const navLinks = Array.from(document.querySelectorAll('header nav a'));
    const fallbackLinks = navLinks.length ? navLinks : Array.from(document.querySelectorAll('header a[href]'));
    (fallbackLinks || []).forEach(a => {
      const link = document.createElement('a');
      link.href = a.getAttribute('href');
      link.textContent = a.textContent || a.getAttribute('aria-label') || 'Link';
      link.style.cssText = 'display:block;padding:10px 12px;border-radius:8px;color:#fff;text-decoration:none';
      link.onmouseenter = () => { link.style.background = '#00bcd4'; link.style.color = '#000'; };
      link.onmouseleave = () => { link.style.background = 'transparent'; link.style.color = '#fff'; };
      // Respect admin visibility (CSS hide rule will hide if not admin)
      linksContainer.appendChild(link);
    });

    const backdrop = panel.querySelector('#mobileMenuBackdrop');
    const sheet = panel.querySelector('#mobileMenuSheet');
    const closeBtn = panel.querySelector('#mobileMenuClose');

    function openMenu() {
      panel.style.pointerEvents = 'auto';
      requestAnimationFrame(() => { backdrop.style.opacity = '1'; sheet.style.transform = 'translateX(0)'; });
    }
    function closeMenu() {
      backdrop.style.opacity = '0'; sheet.style.transform = 'translateX(100%)';
      setTimeout(() => { panel.style.pointerEvents = 'none'; }, 300);
    }

    btn.addEventListener('click', openMenu);
    backdrop.addEventListener('click', closeMenu);
    closeBtn.addEventListener('click', closeMenu);

    // Also wire up any existing hamburger buttons inside the page header
    try {
      const existingHamburgers = Array.from(document.querySelectorAll('header button, header [role="button"]'))
        .filter(el => el !== btn && (el.id === 'mobile-menu-btn' || /hamburger|menu/i.test(el.className) || el.innerHTML.includes('M4 6h16') || el.innerHTML.includes('menu')));
      existingHamburgers.forEach(h => {
        h.addEventListener('click', (e) => { e.preventDefault(); openMenu(); });
      });
    } catch (_) { /* ignore */ }
  }

  // Initialize helpers
  injectAdminHideCSS();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { revealAdminIfAuthorized(); ensureHamburgerAndDrawer(); });
  } else {
    revealAdminIfAuthorized(); ensureHamburgerAndDrawer();
  }

  // ---------------------------------------------------------------------------
  // Header brand text: prevent overlap and clip on small screens
  // - Truncate with ellipsis and optionally abbreviate to "PLWG" on ultra-small
  // ---------------------------------------------------------------------------
  function improveHeaderBrandForMobile() {
    // Inject CSS once
    if (!document.getElementById('brandAbbrevStyle')) {
      const s = document.createElement('style');
      s.id = 'brandAbbrevStyle';
      s.textContent = `
        @media (max-width: 992px){
          .brand-text-abbr{max-width:44vw;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;display:inline-block}
        }
        @media (max-width: 420px){
          .brand-text-abbr{max-width:34vw;font-size:1.1rem}
        }
      `;
      document.head.appendChild(s);
    }

    // Try to locate the brand span text near the logo
    const candidates = [
      document.querySelector('header nav .flex.items-center span.font-orbitron'),
      document.querySelector('header .flex.items-center span.font-orbitron'),
      document.querySelector('header span.font-orbitron'),
    ].filter(Boolean);

    const brand = candidates[0];
    if (!brand) return;

    brand.classList.add('brand-text-abbr');
    if (!brand.dataset.fullBrand) brand.dataset.fullBrand = brand.textContent.trim();

    function syncBrandAbbrev(){
      const w = window.innerWidth;
      if (w <= 420) {
        brand.textContent = 'PLWGS';
      } else if (brand.dataset.fullBrand) {
        brand.textContent = brand.dataset.fullBrand;
      }
    }
    syncBrandAbbrev();
    window.addEventListener('resize', syncBrandAbbrev);

    // Center the brand + logo on small screens so the toolbar does not overlap
    try {
      const header = document.querySelector('header');
      if (header && getComputedStyle(header).position === 'static') {
        header.style.position = 'relative';
      }
      // Find the immediate flex container that wraps logo svg + text
      let brandWrap = brand.closest('div');
      for (let i = 0; i < 3 && brandWrap && !brandWrap.className.includes('flex'); i++) {
        brandWrap = brandWrap.parentElement;
      }
      if (brandWrap) {
        const centerBrand = () => {
          const w = window.innerWidth;
          if (w <= 600) {
            brandWrap.style.position = 'absolute';
            brandWrap.style.left = '50%';
            brandWrap.style.transform = 'translateX(-50%)';
            brandWrap.style.top = '8px';
            brandWrap.style.zIndex = '2147483640';
          } else {
            brandWrap.style.position = '';
            brandWrap.style.left = '';
            brandWrap.style.transform = '';
            brandWrap.style.top = '';
            brandWrap.style.zIndex = '';
          }
        };
        centerBrand();
        window.addEventListener('resize', centerBrand);
      }
    } catch(_) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', improveHeaderBrandForMobile);
  } else {
    improveHeaderBrandForMobile();
  }
})();
