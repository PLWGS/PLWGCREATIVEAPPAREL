
(function() {
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
  // Admin link visibility and mobile menu helpers (site-wide)
  // ---------------------------------------------------------------------------

  async function setupAdminLinkVisibility() {
    try {
      // Hide by default using a CSS rule that matches admin links directly
      if (!document.getElementById('adminLinkHideStyle')) {
        const style = document.createElement('style');
        style.id = 'adminLinkHideStyle';
        style.textContent = 'a[href$="admin.html"], a[href*="/admin.html"] { display:none !important; }';
        document.head.appendChild(style);
      }

      // Collect admin links (may be none)
      const adminLinks = Array.from(document.querySelectorAll("a[href$='admin.html'], a[href*='/admin.html']"));
      if (adminLinks.length === 0) return;

      const token = localStorage.getItem('adminToken');
      if (!token) {
        // Keep hidden
        return;
      }
      const res = await fetch('/api/admin/verify', {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => null);
      const isValid = !!res && res.ok;
      if (isValid) {
        const style = document.getElementById('adminLinkHideStyle');
        if (style) style.remove();
        adminLinks.forEach(a => { a.style.display = ''; a.classList.remove('hidden'); });
      }
    } catch (_) {
      // Fail closed – leave CSS rule in place (hidden)
    }
  }

  function setupMobileMenu() {
    try {
      // Find an existing mobile menu button or create one
      let button = document.querySelector('header button.lg\\:hidden');
      const headerRight = document.querySelector('header .flex.items-center.space-x-4') || document.querySelector('header .flex.items-center:last-child');
      if (!button && headerRight) {
        button = document.createElement('button');
        button.setAttribute('aria-label', 'Open menu');
        button.className = 'lg:hidden text-text-primary hover:text-accent transition-colors duration-300';
        button.innerHTML = '<svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>';
        headerRight.appendChild(button);
      }
      if (!button) {
        // Fallback button if header structure is different (inline styles for reliability)
        const fallback = document.createElement('button');
        fallback.id = 'globalHamburger';
        fallback.setAttribute('aria-label', 'Open menu');
        fallback.style.cssText = 'position:fixed;top:16px;right:16px;z-index:2147483647;padding:10px;border-radius:8px;background:rgba(42,42,42,0.85);color:#fff;display:block';
        fallback.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>';
        document.body.appendChild(fallback);
        button = fallback;
      }

      // Build slide-over menu from existing top nav links
      const existingNavLinks = Array.from(document.querySelectorAll('header nav a'))
        .filter(a => a.href && !a.classList.contains('hidden'));

      // Create container if not present
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

      const linksContainer = panel.querySelector('#mobileMenuLinks');
      linksContainer.innerHTML = '';
      existingNavLinks.forEach((a) => {
        const link = document.createElement('a');
        link.href = a.getAttribute('href');
        link.textContent = a.textContent || a.getAttribute('aria-label') || 'Link';
        link.style.cssText = 'display:block;padding:10px 12px;border-radius:8px;color:#fff;text-decoration:none';
        link.onmouseenter = () => { link.style.background = '#00bcd4'; link.style.color = '#000'; };
        link.onmouseleave = () => { link.style.background = 'transparent'; link.style.color = '#fff'; };
        // Respect admin visibility (hidden means not allowed)
        if (a.classList.contains('hidden') || a.style.display === 'none') link.classList.add('hidden');
        linksContainer.appendChild(link);
      });

      const backdrop = panel.querySelector('#mobileMenuBackdrop');
      const sheet = panel.querySelector('#mobileMenuSheet');
      const closeBtn = panel.querySelector('#mobileMenuClose');

      function openMenu() {
        panel.style.pointerEvents = 'auto';
        requestAnimationFrame(() => {
          backdrop.style.opacity = '1';
          sheet.style.transform = 'translateX(0)';
        });
      }
      function closeMenu() {
        backdrop.style.opacity = '0';
        sheet.style.transform = 'translateX(100%)';
        setTimeout(() => { panel.style.pointerEvents = 'none'; }, 300);
      }

      button.addEventListener('click', openMenu);
      backdrop.addEventListener('click', closeMenu);
      closeBtn.addEventListener('click', closeMenu);
    } catch (_) {
      // ignore
    }
  }

  // Run helpers after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setupAdminLinkVisibility();
      setupMobileMenu();
    });
  } else {
    setupAdminLinkVisibility();
    setupMobileMenu();
  }
})();
