# Security Checklist — Bitnova Labs Kanban

Pre-deployment security audit results and remediation guide.

---

## Status Overview

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | XSS: card title/description unescaped | Critical | ✅ Fixed in code |
| 2 | XSS: team member names unescaped | Medium | ✅ Fixed in code |
| 3 | Missing input length limits | Medium | ✅ Fixed in code |
| 4 | Missing Content Security Policy | High | ✅ Fixed in code |
| 5 | Missing clickjacking protection | Medium | ✅ Fixed in code (CSP frame-ancestors) |
| 6 | Missing Firestore security rules file | Critical | ✅ File created — needs deploying |
| 7 | Firebase placeholder credentials | Critical | ⚠️ Requires your action |
| 8 | Missing Subresource Integrity on CDN scripts | High | ⚠️ Requires your action |

---

## Items Already Fixed in Code

No action needed. These were patched directly in `index.html`:

- **XSS** — `card.title` and `card.desc` are now passed through `escHtml()` before being rendered into the DOM. A malicious card title like `<img src=x onerror="alert('XSS')">` will display as text, not execute.
- **XSS** — Team member names are defensively escaped in all render paths.
- **Input limits** — All form fields now have `maxlength`: title (200), description (3000), project code (20), checklist items (200), archive note (500).
- **CSP** — A Content Security Policy meta tag was added to `<head>`. It restricts scripts to `self` and the Firebase CDN, restricts connections to Firebase domains, and blocks the app from being embedded in iframes.

---

## Step 1 — Deploy Firestore Security Rules (Critical)

Without this, anyone who discovers your Firebase config can read and write all your cards directly via the Firestore API, bypassing the login screen entirely.

The file `firestore.rules` is already written and ready. You just need to deploy it.

### Option A — Firebase Console (no CLI needed)

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Open your project
3. In the left menu, click **Firestore Database**
4. Click the **Rules** tab
5. Replace the entire content with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /cards/{cardId} {
      allow read, write: if request.auth != null;
    }

    match /archivedCards/{cardId} {
      allow read, write: if request.auth != null;
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

6. Click **Publish**
7. Verify: try accessing `https://firestore.googleapis.com/v1/projects/YOUR_PROJECT_ID/databases/(default)/documents/cards` in a browser — you should get a `403 Permission Denied` error.

### Option B — Firebase CLI

```bash
# Install Firebase CLI (one time)
npm install -g firebase-tools

# Login
firebase login

# Initialize in the project folder (select Firestore when asked)
cd /path/to/bitnovalabs-kanbas
firebase init firestore

# Deploy only the rules
firebase deploy --only firestore:rules
```

---

## Step 2 — Replace Firebase Placeholder Credentials (Critical)

The app currently has fake credentials that will prevent it from connecting to Firebase at all.

### 2.1 Get your real config

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Open your project
3. Click the **gear icon** → **Project settings**
4. Scroll down to **Your apps** → click your web app
5. Copy the `firebaseConfig` object

### 2.2 Update index.html

Open `index.html` and find this block (around line 2500):

```javascript
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyB1234567890abcdefg",
  authDomain: "bitnova-kanban.firebaseapp.com",
  projectId: "bitnova-kanban",
  storageBucket: "bitnova-kanban.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456"
};
```

Replace the values with your real ones. Example:

```javascript
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyC_YOUR_REAL_KEY_HERE",
  authDomain: "your-real-project.firebaseapp.com",
  projectId: "your-real-project",
  storageBucket: "your-real-project.appspot.com",
  messagingSenderId: "987654321098",
  appId: "1:987654321098:web:realappidhere"
};
```

> **Note on API key exposure:** Firebase web API keys are not secrets — they identify your project but grant no privileged access. Security is enforced by Firestore rules (Step 1) and Firebase Authentication. Never put a private server key or service account key in client-side code.

### 2.3 Authorize your domain

After deploying to GitHub Pages (or any host), add your domain to Firebase:

1. Firebase Console → **Authentication** → **Settings** → **Authorized domains**
2. Click **Add domain**
3. Enter your domain, e.g. `your-username.github.io`

---

## Step 3 — Add Subresource Integrity to Firebase CDN Scripts (High)

SRI ensures the Firebase scripts haven't been tampered with in transit. Without it, a compromised CDN or network attack could inject malicious code.

### 3.1 Generate the hashes

Run these commands in your terminal:

```bash
curl -s https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js | openssl dgst -sha384 -binary | openssl enc -base64 -A

curl -s https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js | openssl dgst -sha384 -binary | openssl enc -base64 -A

curl -s https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js | openssl dgst -sha384 -binary | openssl enc -base64 -A
```

Each command outputs a base64 hash. Copy each one.

### 3.2 Update the script tags in index.html

Find the three Firebase script tags near the bottom of `<head>` and add the integrity attribute to each:

```html
<script
  src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"
  integrity="sha384-PASTE_HASH_HERE"
  crossorigin="anonymous"></script>

<script
  src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"
  integrity="sha384-PASTE_HASH_HERE"
  crossorigin="anonymous"></script>

<script
  src="https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore-compat.js"
  integrity="sha384-PASTE_HASH_HERE"
  crossorigin="anonymous"></script>
```

---

## Deployment Go/No-Go Checklist

Before going live, verify each item:

### Security
- [ ] Firestore rules deployed and tested (Step 1)
- [ ] Real Firebase credentials in `index.html` (Step 2)
- [ ] Deployment domain added to Firebase Authorized domains (Step 2.3)
- [ ] SRI hashes added to Firebase script tags (Step 3) — recommended but optional for internal tools

### Functional test after deploy
- [ ] Login with Google works
- [ ] Creating a card saves to Firestore
- [ ] Moving a card between columns persists after page refresh
- [ ] Archiving a card removes it from the board and shows it in the Archive view
- [ ] Offline mode: disable network in DevTools → make a change → re-enable → change syncs
- [ ] Try entering `<script>alert('xss')</script>` as a card title → should display as text, not execute
- [ ] Open app in a second browser tab/account → changes from tab 1 appear in tab 2 in real time

### XSS verification
- Create a card with this title: `<img src=x onerror="alert('XSS')">`
- Expected result: the text is shown literally on the card, no alert dialog appears
- If an alert dialog appears, stop deployment and report the issue

---

## Known Acceptable Limitations

These are intentional trade-offs for a simple internal team tool:

| Item | Notes |
|------|-------|
| Inline `onclick` handlers | Prevents a strict CSP. Low risk for an internal app with trusted users. |
| `confirm()` for delete actions | Native browser dialog, can be suppressed in some contexts. Acceptable for internal use. |
| Full board re-render on data change | Performance trade-off for simplicity. Acceptable for small teams. |
| All authenticated users share one board | No per-user or role-based access. By design for this app. |

---

*Last updated: 2026-03-13*
