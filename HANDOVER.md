## Project Handover — PLWGS Creative Apparel

### 1) What this repo does (current scope)
- Node.js/Express backend with PostgreSQL for products, cart, and admin auth.
- Static frontend in `pages/` served by Express static middleware.
- Cloudinary used for image storage/optimization; main and thumbnail transforms handled in server/cloudinary helper.
- Admin auth with bcrypt, JWT, optional 2FA, password reset, and DB-backed persistent hash via `admin_settings`.
- Public product APIs used by `pages/shop.html` and `pages/product.html` (dynamic rendering).

### 2) How to run
1. Ensure `.env` exists in repo root (single file; do not create duplicates).
2. Required env keys (minimum):
   - DATABASE_URL
   - JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN
   - SESSION_SECRET
   - ADMIN_EMAIL
   - One of:
     - ADMIN_PASSWORD_HASH (prod) or
     - ADMIN_PASSWORD plus `ADMIN_OVERRIDE_PASSWORD=true` (dev)
   - CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME/CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET
   - SMTP settings for Nodemailer (if 2FA/reset used): SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS
   - ADMIN_BOOTSTRAP_TOKEN (for emergency bootstrap endpoint)
   - ADMIN_2FA_ENABLED=true|false, ADMIN_2FA_EMAIL
3. `npm install`
4. `node server.js` (server logs will indicate DB init and auth source)

Static serving:
- Root static: `app.use(express.static('.'));`
- Public assets: `app.use('/public', express.static('public'));`

### 3) Key backend features
- Persistent admin hash in DB table `admin_settings` (single-row storage). On boot:
  1) Try DB value; 2) fall back to `ADMIN_PASSWORD_HASH`; 3) else hash `ADMIN_PASSWORD` if override=true.
- 2FA flow (email OTP):
  - POST `/api/admin/login` → if 2FA enabled returns `{ twoFactorRequired, twoFactorToken }` and sends OTP to `ADMIN_2FA_EMAIL`.
  - POST `/api/admin/2fa/verify` with `{ twoFactorToken, otp }` → returns JWT.
- Password reset flow:
  - POST `/api/admin/password/request-reset` → email token to `ADMIN_EMAIL`.
  - POST `/api/admin/password/reset` with `{ token, newPassword }` → updates hash in `admin_settings`.
- Bootstrap endpoint (one-time / emergency):
  - POST `/api/admin/password/bootstrap` guarded by header `x-admin-bootstrap-token: <ADMIN_BOOTSTRAP_TOKEN>` sets hash directly in `admin_settings`.
- Products table includes `size_stock JSON` and accepts arrays/JSON for `sizes`, `tags`, `sub_images`.

### 4) Image pipeline
- `cloudinary-upload.js`: centralizes upload and transformations.
  - Main image: 800x800, crop: fill, gravity: auto, quality: auto:best (webp when possible)
  - Thumbnail: ~300x120, crop: fill, gravity: auto, quality: auto:good

### 5) Frontend highlights
- `pages/shop.html`: pulls `/api/products/public`, renders grid dynamically, updates result counts.
- `pages/product.html`: fetches one product by ID, renders dynamic sizes/colors/tags, shows stock status per size, adds to cart using correct product name.
- `pages/admin-uploads.html`: full product creation form; validates; collects `size_stock` for XS–XXL.
- `create_edit_page_for_product.js`: generates edit pages mirroring creation form; loads/saves `size_stock` and images.
- `public/dhws-data-injector.js` (site-wide helper):
  1) Hides `Admin` links unless `/api/admin/verify` with stored admin JWT succeeds.
  2) Injects mobile hamburger/drawer (and a fallback cart button if page lacks one).
  3) Abbreviates brand to “PLWGS” on very narrow widths; truncates with ellipsis for small widths.

### 6) Current status (tested locally)
- Admin auth: now stable with DB-backed hash and bootstrap. Verified login locally after bootstrap + proper `.env`.
- Product upload/edit: JSON handling for `size_stock` fixed; creation and editing work locally; dynamic shop/product pages load Cloudinary URLs.
- `product.html`: fixed add-to-cart using product name; improved color selection visuals; quantity controls hooked; stock summary logic improved.
- Mobile UX: brand abbreviation active; universal hamburger + fallback cart are injected via `dhws-data-injector.js` and console logs show script is loading (“[dhws-data-injector] Loaded”, “hamburger created”).

### 7) Critical open issues (handover focus)
1) Mobile hamburger and fallback cart not visible to user on homepage (and possibly other pages) despite logs showing injector ran.
   - What we see: Console shows `[dhws-data-injector] Loaded` and `hamburger created`, but user reports no visible icons.
   - What we implemented:
     - Multiple revisions to force visibility: high z-index, `display: block !important`, fixed position bar `#globalTopRightBar` added at `body` top-right.
     - Also tried absolute within header and forced header `position: relative`.
   - Likely causes to investigate next:
     - DOM/CSS overlay above the toolbar: a header overlay, transform context, or full-screen element covering top-right; verify via Inspector → pick element at top-right.
     - A CSP blocking inline styles or script behaviors on the live site (locally we do not see CSP errors; user earlier reported CSP on a different page). Check server CSP headers.
     - Another script removing the injected nodes post-injection (MutationObserver). Search for global MutationObservers that remove unknown elements.
     - Responsive viewport scaling in device toolbar causing the top-right to render outside visible clipping area (e.g., parent container overflow hidden). We switched to fixed-position toolbar to avoid this.
     - If Tailwind preflight or reset sets `pointer-events: none` or `opacity: 0` on certain selectors, verify computed styles for `#globalTopRightBar`, `#globalHamburger`, `#globalCartBtn`.
   - Immediate diagnostic steps:
     - In DevTools Console: `document.getElementById('globalTopRightBar')` should return a node; check its bounding rect and computed styles. Toggle `outline: 2px solid red` on it.
     - In Inspector, search for the nodes and check for any ancestors with `opacity:0`, `filter: opacity(0)`, `visibility:hidden`, `transform` + `overflow:hidden` clipping.
     - Temporarily inject `document.body.style.setProperty('overflow','visible','important')` to rule out clipping by a parent.

2) Product sizes/stock on `product.html` — user intermittently sees hardcoded sizes/counters.
   - We removed hardcoded HTML and build the UI from API data; logs show dynamic arrays and object printed. If issue persists live, confirm the live `product.html` is in sync and caching is disabled.

3) Admin link visibility for logged-out users.
   - Injector adds a CSS rule to hide admin links immediately; reveals them only if `/api/admin/verify` with stored JWT is valid. If links remain visible, verify localStorage tokens and that injector script loads on that page.

### 8) Repro notes for Issue #1 (homepage icons)
- Page: `pages/homepage.html`
- Console shows: `[dhws-data-injector] Loaded` and `hamburger created`.
- Expected: a fixed toolbar at top-right with a hamburger; if page lacks a cart button, a fallback cart icon too.
- What to check next in DOM:
  - `#globalTopRightBar`, `#globalHamburger`, `#globalCartBtn` exist and have nonzero size.
  - Computed z-index is effectively above neighbors; position: fixed; not inside a transformed ancestor.
  - No CSS `* { visibility:hidden }`/`display:none` rule applies due to specificity; inline styles should win.

### 9) Files most relevant to open issues
- `public/dhws-data-injector.js` — sitewide injector for menu/cart/admin visibility/brand.
- `pages/homepage.html` — header markup; includes `../public/dhws-data-injector.js` at end of body.
- `server.js` — static config, CSP headers (if any), admin verification endpoint.

### 10) Suggested next steps (checklist)
- [ ] In live/staging, open `homepage.html` → DevTools → Elements. Confirm `#globalTopRightBar` exists. If missing, verify the `<script id="dhws-dataInjector" src="../public/dhws-data-injector.js"></script>` path resolves correctly on that page.
- [ ] If the bar exists but is invisible, add in console: `Object.assign(document.getElementById('globalTopRightBar').style,{outline:'2px solid red',background:'rgba(255,0,0,.1)'});` and observe.
- [ ] Inspect any header overlays or containers with `overflow:hidden` that might clip fixed children (shouldn’t, but worth checking transform contexts).
- [ ] Confirm no CSP is blocking inline styles/scripts on live (Network tab → response headers). If present, we need a nonce/hash or move inline styles to a stylesheet.
- [ ] If all else fails, inject absolute-positioned buttons directly inside the specific header container for `homepage.html` (as a per-page fallback) and ship.

### 11) Known working admin workflows
- Admin login stable after DB-hash memoization and bootstrap token use.
- 2FA and password reset endpoints implemented; require valid SMTP config.

### 12) Notes on `.env` pitfalls observed
- Multiple `.env` copies caused confusion locally; ensure the active `.env` is the one in project root. Remove backups.
- In PowerShell, use single quotes to avoid `$` expansion in literals (e.g., `'Sye$2025'`).

### 13) Contact points in code
- Frontend injector entry: end of each page body tag as `<script id="dhws-dataInjector" src="../public/dhws-data-injector.js"></script>`.
- Product/public API: `/api/products/public` and `/api/products/public/:id`.
- Cart endpoint: `/api/cart/add` expects `{ product_name, quantity, unit_price, size, color, image_url }`.

### 14) Handoff summary
- Backend auth, product CRUD, Cloudinary, and public pages are functionally in place.
- Most urgent blocker is the missing visible mobile toolbar (hamburger/cart) despite injector running; focus initial debugging here using DOM inspection and CSP check as outlined above.


