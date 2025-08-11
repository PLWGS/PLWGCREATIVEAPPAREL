PLWGCREATIVEAPPAREL — Customer Dashboard Functional Plan (100% Working)

Executive Summary
This plan makes `pages/account.html` fully functional, connected to secure customer APIs, and backed by Postgres. It keeps existing admin flows intact and uses the single `.env` file [[memory:5479735]]. Every feature includes precise endpoints, data contracts, DB changes (if any), and UI wiring. The goal is end‑to‑end verified behavior [[memory:5479754]].

Scope
- Authentication/session for customers
- Profile and addresses
- Orders history with items
- Wishlist (add/remove/view) integrated with product pages
- Loyalty points and rewards
- Style profile and personalized recommendations
- Security, fallbacks, and health checks

Backend APIs (already present in `server.js`)
- POST /api/customer/auth — Register/Login (issues JWT with role=customer)
- GET /api/customer/profile — Returns customer, addresses, preferences
- PUT /api/customer/profile — Updates profile fields
- GET /api/customer/orders — Returns orders with nested items
- GET /api/customer/wishlist — Items customer saved
- POST /api/customer/wishlist — { product_id }
- DELETE /api/customer/wishlist/:product_id
- GET /api/customer/loyalty — { loyalty_points, loyalty_tier, ... }
- POST /api/customer/loyalty/redeem — redeem selected reward
- PUT /api/customer/style-profile — saves preferences
- GET /api/customer/recommendations — products list

Database
- Uses existing tables: customers, orders, order_items, wishlist, customer_style_profile, loyalty (computed/inline)
- Wishlist table ensured with IF NOT EXISTS during first use
- No destructive migrations; all additions are IF NOT EXISTS

Front‑End: Account Page Wiring
1) JWT bootstrap
- Read `customerToken` from localStorage
- If absent and endpoint is not /auth, redirect to `customer-login.html`

2) API helper
- account.html already defines `apiRequest(endpoint)` → Prefix `/api/customer` and attach `Authorization: Bearer <token>`

3) Profile Settings
- Load: GET /api/customer/profile
- Render name, email, phone, birthday, addresses
- Save: PUT /api/customer/profile with updated fields
- Validation: basic email/phone; show inline errors

4) Orders
- Load recent: GET /api/customer/orders?limit=5
- Show items (name, size, quantity, price, image_url)
- Link to full Orders page (optional future work)

5) Wishlist
- Load: GET /api/customer/wishlist → render grid
- Remove: DELETE /api/customer/wishlist/:product_id from grid
- Product page: POST /api/customer/wishlist (already updated)
- Counts: update “Wishlist Items” card based on list length

6) Loyalty
- Load: GET /api/customer/loyalty → points, tier, rewards
- Redeem: POST /api/customer/loyalty/redeem { reward_id }
- Update UI and totals after redemption

7) Style Profile + Recommendations
- Save: PUT /api/customer/style-profile with preferences the UI captures
- Load recommendations: GET /api/customer/recommendations
- Render “Recommended for You” section

8) Security & Fallbacks
- All endpoints require JWT (customer). 401 → redirect to login
- Defensive rendering: empty arrays when unavailable
- Health: GET /api/health used by deployment

Wishlist Button on Product Page
- Calls `/api/customer/wishlist` with current product id (already implemented)
- On 401 → redirect to `customer-login.html`

DB Admin Notes
- If needed, psql access (Railway):
  - URL provided by user. Use read‑only queries for verification; avoid destructive ops.

QA Test Plan (Happy Path + Errors)
1) Auth
- login → JWT stored → profile/orders/wishlist load
2) Profile
- update fields → GET reflects changes
3) Orders
- mock or seed one order; ensure images and items render
4) Wishlist
- add from product page → appears in account → remove works
5) Loyalty
- GET shows points; redeem reduces points and updates tier/rewards
6) Style Profile
- save preferences; recommendations load
7) Errors
- 401 redirects; empty arrays do not crash UI

Rollout & Safety
- Non‑destructive; toggles rely on existing code paths
- No schema changes beyond IF NOT EXISTS

Completion Criteria
- All account sections fetch live data and are interactive
- Wishlist add/remove works site‑wide
- All flows verified locally and on Railway [[memory:5758909]]

