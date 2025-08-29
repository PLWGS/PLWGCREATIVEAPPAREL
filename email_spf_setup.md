# Handover Document – Email & SPF Configuration for plwgscreativeapparel.com

## Purpose
This document serves as a reference for all DNS and email configuration steps completed to ensure that email works correctly for **plwgscreativeapparel.com** using **Zoho Mail** (with custom domain hosted on Namecheap). It also includes SPF setup details and the critical DNS change that fixed the issue. Keep this in the root project folder for future troubleshooting or changes.

---

## Domain & DNS Provider
- **Domain Registrar & DNS Host:** Namecheap
- **Nameservers in Use:**
  - `dns1.registrar-servers.com`
  - `dns2.registrar-servers.com`

This means all DNS records are managed directly through the **Namecheap Advanced DNS** tab.

---

## Email Provider
- **Provider:** Zoho Mail (Free Plan)
- **Domain:** `plwgscreativeapparel.com`
- **Mailboxes Created:** (examples)
  - `info@plwgscreativeapparel.com`
  - `support@plwgscreativeapparel.com`

---

## DNS Records Added in Namecheap

### 1. **MX Records (Mail Routing)**
These direct incoming mail to Zoho:

| Type | Host | Value         | Priority |
|------|------|---------------|----------|
| MX   | @    | mx.zoho.com   | 10       |
| MX   | @    | mx2.zoho.com  | 20       |
| MX   | @    | mx3.zoho.com  | 50       |

### 2. **SPF Record (Anti-Spam / Authentication)**
Only **one SPF TXT record** is valid per domain. Final correct record:

```
v=spf1 include:zoho.com ~all
```

- **Type:** TXT
- **Host:** @
- **Value:** v=spf1 include:zoho.com ~all

This allows Zoho Mail servers to send mail on behalf of `@plwgscreativeapparel.com`.

### 3. **CNAME Record (Domain Verification)**
Zoho provides a unique `zbXXXXXXXX` record. Example format:

| Type  | Host        | Value              |
|-------|-------------|--------------------|
| CNAME | zb12345678  | zmverify.zoho.com  |

This is required to prove domain ownership.

### 4. **DKIM Record (Email Integrity & Deliverability)**
Generated in Zoho Admin Panel. Example format:

| Type  | Host               | Value (long DKIM key)                 |
|-------|--------------------|---------------------------------------|
| CNAME | zoho._domainkey    | <Zoho DKIM generated value>           |

### 5. **(Optional) DMARC Record**
Improves spoofing protection. Example setup:

```
v=DMARC1; p=none; rua=mailto:postmaster@plwgscreativeapparel.com
```

- Can later change `p=none` → `p=quarantine` or `p=reject` after monitoring.

---

## Critical Fix – Root Record Correction
Initially, the root domain (`@`) had a **CNAME record** pointing elsewhere. This conflicted with Zoho’s SPF detection and email routing.

**What was done:**
- **Deleted** the CNAME record with `@` as the host.
- **Replaced it** with an **A Record** pointing to the correct server IP address (Railway app deployment).

This change ensured:
1. Root domain (`plwgscreativeapparel.com`) resolved correctly to the Railway-hosted website.
2. SPF, MX, and TXT records for `@` worked without conflict.
3. Zoho Mail successfully validated SPF.

### Before & After DNS Diagram

**Before (Broken):**
```
@   →   CNAME → some.otherdomain.com
MX  →   Zoho mail servers (ignored due to CNAME conflict)
TXT →   v=spf1 include:zoho.com ~all (not applied)
```

**After (Working):**
```
@   →   A Record → <Railway server IP>
MX  →   Zoho mail servers (mx.zoho.com, mx2.zoho.com, mx3.zoho.com)
TXT →   v=spf1 include:zoho.com ~all (active and validated)
CNAME (Zoho verify) → zbXXXXXX → zmverify.zoho.com
CNAME (Zoho DKIM)   → zoho._domainkey → <Zoho DKIM key>
```

---

## Verification & Testing
1. After DNS corrections, verified domain inside **Zoho Admin Console**.
2. Sent/received test emails successfully.
3. Ran SPF verification using:
   ```
   nslookup -type=TXT plwgscreativeapparel.com
   ```
   Confirmed output contained:
   ```
   v=spf1 include:zoho.com ~all
   ```
4. SPF validation confirmed inside Zoho Mail Admin.

---

## Railway Integration (Web App Context)
- Domain `plwgscreativeapparel.com` is also connected to a project hosted on **Railway.app**.
- The **critical fix** was aligning the root domain record:
  - `@` → set as **A Record** with Railway’s provided IP.
- Website and email DNS records now coexist without conflict.
- Rule of thumb: **Railway handles website hosting (A Record), Zoho handles email (MX, TXT, CNAME, DKIM).**

---

## Lessons & Best Practices
- Only **one SPF record** should exist per domain. If using multiple services (e.g., Zoho + SendGrid), merge into a single SPF record.
- Never use a **CNAME record for `@` (root domain)** when also configuring MX/TXT records. Always use an **A Record with IP**.
- DNS propagation may take **15 minutes – 24 hours**; always allow time before retesting.
- Keep a copy of Zoho’s verification records in case re-verification is needed.
- Use online SPF/DKIM/DMARC lookup tools to confirm correctness.
- Store this document in the project root for quick reference during future migrations or troubleshooting.

---

## Quick Reference Commands
- Check MX records:
  ```
  nslookup -type=MX plwgscreativeapparel.com
  ```

- Check SPF TXT record:
  ```
  nslookup -type=TXT plwgscreativeapparel.com
  ```

- Verify propagation globally:
  - Use: https://mxtoolbox.com or https://dnschecker.org

---

**Document Prepared:** Aug 29, 2025  
**For Domain:** plwgscreativeapparel.com  
**Admin Reference Copy**

