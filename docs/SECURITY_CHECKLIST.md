# Security Checklist — Bitnova Labs Kanban

Pre-deployment security audit results and remediation guide.

*Last updated: 2026-04-07*

---

## Status Overview

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | XSS: card title/description unescaped | Critical | ✅ Fixed in code |
| 2 | XSS: team member names unescaped | Medium | ✅ Fixed in code |
| 3 | Missing input length limits | Medium | ✅ Fixed in code |
| 4 | Missing Content Security Policy | High | ✅ Fixed in code |
| 5 | Clickjacking protection (`frame-ancestors`) | Medium | ⚠️ Partial — see note below |
| 6 | Missing Firestore security rules file | Critical | ✅ File updated — needs deploying |
| 7 | Firebase credentials | Critical | ✅ Real credentials in place — verify before deploy |
| 8 | Missing Subresource Integrity on CDN scripts | High | ⚠️ Optional for this release — steps below |

---

## Items Fixed in Code

No action needed. These were patched directly in `index.html`:

- **XSS** — `card.title` and `card.desc` are passed through `escHtml()` before rendering. Malicious input displays as text, not code.
- **XSS** — Team member names are defensively escaped in all render paths.
- **Input limits** — All form fields have `maxlength`: title (200), description (3000), project code (20), checklist items (200), archive note (500).
- **CSP** — A Content Security Policy meta tag is in `<head>`. It restricts scripts to `self` and the Firebase CDN, restricts connections to Firebase domains, and includes `frame-ancestors 'none'`.

---

## Note on Clickjacking Protection (frame-ancestors)

`frame-ancestors 'none'` has been added to the CSP meta tag in `index.html`. **However**, browsers do not enforce `frame-ancestors` when it appears in a `<meta>` tag — this directive is only respected when sent as an HTTP response header (`Content-Security-Policy: frame-ancestors 'none'`).

**GitHub Pages does not support custom HTTP response headers**, so a fully enforced clickjacking block is not achievable on this hosting platform without additional tooling.

**Current state:** the meta tag signals intent and provides partial protection in some environments. The risk is low for an invitation-only internal tool where the URL is not publicly advertised.

**To fully fix:** migrate hosting to a platform that supports custom headers (Cloudflare Pages, Netlify, Vercel), or add a GitHub Actions deployment step that wraps the site in a Cloudflare Worker with headers applied. This is tracked as a post-launch item.

---

## Step 1 — Deploy Firestore Security Rules (Critical)

`firestore.rules` has been updated to cover all collections: `cards`, `archivedCards`, `admins`, `invites`, `team`. Without deploying this file, anyone with your Firebase config can read and write data directly via the Firestore API, bypassing the login screen.

### Option A — Firebase Console (no CLI needed)

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Open your project → **Firestore Database** → **Rules** tab
3. Replace the entire content with the contents of `firestore.rules`
4. Click **Publish**
5. Verify: access `https://firestore.googleapis.com/v1/projects/YOUR_PROJECT_ID/databases/(default)/documents/cards` in a browser — expect a `403 Permission Denied`.

### Option B — Firebase CLI

```bash
firebase deploy --only firestore:rules
```

---

## Step 2 — Bootstrap the First Admin (Required for invitation system)

The invitation system requires at least one admin document in Firestore before the app can send invites.

1. Firebase Console → **Firestore Database** → create collection `admins`
2. Add a document with the admin's email address as the **Document ID** (e.g. `admin@yourdomain.com`)
3. The document body can be empty, or add `{ "grantedAt": <timestamp>, "grantedBy": "bootstrap" }` for record-keeping
4. This is a one-time step. All subsequent admin management happens inside the app.

---

## Step 3 — Enable Auth Providers (Required)

Firebase Console → **Authentication** → **Sign-in method**:

1. Enable **Email/Password**
2. Under Email/Password settings, also enable **Email link (passwordless sign-in)**
3. Enable **Google**
4. Under **Authorized domains**, add your GitHub Pages domain (e.g. `yourusername.github.io`)

---

## Step 4 — Verify Firebase Credentials (Critical)

Check that `index.html` contains your real Firebase project credentials, not placeholder values. The `apiKey`, `authDomain`, `projectId`, `messagingSenderId`, and `appId` must all match your Firebase project.

> **Note:** Firebase web API keys are not secrets — they identify your project but grant no privileged access. Security is enforced by Firestore rules (Step 1) and Firebase Authentication. Never put a private server key or service account key in client-side code.

---

## Step 5 — Add Subresource Integrity to Firebase CDN Scripts (Recommended)

SRI ensures the Firebase scripts loaded from the CDN have not been tampered with. Optional for this release.

### Generate the hashes

```bash
curl -s https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js | openssl dgst -sha384 -binary | openssl enc -base64 -A
curl -s https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js | openssl dgst -sha384 -binary | openssl enc -base64 -A
curl -s https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js | openssl dgst -sha384 -binary | openssl enc -base64 -A
```

### Add integrity attributes to the script tags in index.html

```html
<script
  src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"
  integrity="sha384-PASTE_HASH_HERE"
  crossorigin="anonymous"></script>
```

---

## Deployment Go/No-Go Checklist

### Required before go-live
- [ ] Firestore rules deployed and tested (Step 1)
- [ ] First admin document created in Firestore (Step 2)
- [ ] Email/Password, Email link, and Google auth enabled in Firebase Console (Step 3)
- [ ] GitHub Pages domain added to Firebase Authorized domains (Step 3)
- [ ] Real Firebase credentials confirmed in `index.html` (Step 4)

### Recommended
- [ ] SRI hashes added to Firebase script tags (Step 5)

### Functional tests after deploy
- [ ] Admin can send an invitation from within the app
- [ ] Invitee receives the email and setup screen appears on first click
- [ ] Subsequent login with email + password works
- [ ] Google login works for invited users
- [ ] Uninvited user is blocked (any sign-in method)
- [ ] Creating a card saves to Firestore
- [ ] Moving a card between columns persists after page refresh
- [ ] Archiving a card removes it from the board and shows it in the Archive view
- [ ] Offline mode: disable network in DevTools → make a change → re-enable → change syncs
- [ ] XSS test: create a card with title `<img src=x onerror="alert('XSS')">` → should display as text, no alert

---

## Known Limitations

| Item | Notes |
|------|-------|
| `frame-ancestors` not enforced | GitHub Pages does not support HTTP headers; meta tag version is ignored by browsers. Low risk for invitation-only access. |
| `'unsafe-inline'` in CSP | Required by inline `onclick` handlers. Scheduled for removal in P3 refactor. |
| `confirm()` for delete actions | Native browser dialog, acceptable for internal use. |
| Full board re-render on data change | Performance trade-off for simplicity. Acceptable at current scale. |
