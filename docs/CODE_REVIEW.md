# Code & Security Review — Bitnova Labs Kanban

**Date:** 2026-04-07
**Reviewer:** Claude Code
**Verdict:** CONDITIONAL GO — Firestore rules must be deployed before release; see deployment actions below.

---

## Deployment Actions Required (you must do these)

### 1. Deploy Firestore security rules
`firestore.rules` has been updated to cover all current and planned collections: `cards`, `archivedCards`, `admins`, `invites`, `team`. Deploy once and it covers the full auth rollout.

**Option A — Firebase Console (no CLI):**
1. Firebase Console → Firestore Database → Rules tab
2. Paste the contents of `firestore.rules`
3. Click Publish

**Option B — CLI:**
```bash
firebase deploy --only firestore:rules
```

### 2. Bootstrap the first admin
In the Firebase Console, open Firestore → create a collection named `admins` → add one document with the admin's email address as the document ID. The document body can be empty. This is a one-time step; all subsequent admin management happens inside the app.

### 3. Enable auth providers in Firebase Console
Under Authentication → Sign-in method, enable:
- Email/Password
- Email link (passwordless sign-in) — toggle under Email/Password settings
- Google

---

## Security Audit Results

| Check | Status | Notes |
|-------|--------|-------|
| XSS — card title/desc/projectCode | ✅ Fixed | All wrapped in `escHtml()` |
| XSS — checklist text | ✅ Fixed | Escaped in all views |
| XSS — archive fields | ✅ Fixed | All fields escaped including assignee names |
| XSS — modal inputs | ✅ Fixed | Input values escaped |
| Content Security Policy | ✅ Fixed | CSP meta tag present in `<head>` |
| Clickjacking — `frame-ancestors 'none'` | ⚠️ Partial | Added to CSP meta tag. **Note:** browsers ignore `frame-ancestors` in meta tags — it only works as an HTTP response header. GitHub Pages does not support custom HTTP headers. The meta tag signals intent and may be enforced in future if hosting changes. True protection requires moving to a host that supports custom headers (e.g. Cloudflare Pages, Netlify, Vercel). |
| Input maxlength constraints | ✅ Fixed | title:200, desc:3000, projectCode:20, checklist:200, archiveNote:500 |
| Event listener leak (online/offline) | ✅ Fixed | Moved outside `startFirestoreListeners()` |
| Global state (`window._archiveReason`) | ✅ Fixed | Replaced with `dataset.archiveReason` |
| Firebase credentials | ✅ Real credentials in place | Verify before deploy |
| Firestore security rules | ⚠️ File updated — needs deploying | See deployment action 1 above |
| Auth gate | ✅ Pass | App data hidden until auth confirmed |
| No `eval` / `document.write` | ✅ Pass | None found |

**Accepted limitations (internal tool, current phase):**
- `'unsafe-inline'` in CSP — required by inline `onclick` handlers; scheduled for removal in P3
- No SRI hashes on Firebase CDN scripts — steps in `SECURITY_CHECKLIST.md`
- `frame-ancestors` not enforceable on GitHub Pages — documented above

---

## Code Quality Fixes

| Fix | Detail |
|-----|--------|
| Dead code removed | `saveData()`, `loadData()`, `idCounter`, `seedDemoData()` |
| `renderLabels()` | Shared helper replaces duplicate `LABELS.find` in board + archive |
| `renderAssigneeAvatars()` / `renderAssigneeNames()` | Shared helpers replace duplicate `TEAM.find` calls |
| `getChecklistProgress()` | Shared helper — consistent rounding between board and archive |
| `findColumn()` / `findTeamMember()` | Shared helpers replace 6+ inline `.find()` calls |
| `getColumnCards()` / `isWipExceeded()` | WIP logic extracted and unified across `handleDrop` + `saveCard` |
| WIP operator | `isWipExceeded` uses `>` consistently (was `>=` — blocked at limit instead of over limit) |
| Analytics single-pass | All stats aggregated in one loop instead of 15+ `.filter()` passes |
| `escHtml()` optimization | Reuses a static `_escDiv` element instead of allocating a new DOM node per call |
| Archive search bug | Search value now preserved after re-render |
| `archiveSearch` global removed | Now read directly from the DOM input |
| CSS deduplication | `.search-box` and `.archive-search` unified into shared selectors |

---

## XSS Verification Test

Run this after deploying:
1. Create a card with title: `<img src=x onerror="alert('XSS')">`
2. **Expected:** text displays literally on the card — no alert fires
3. If an alert fires, stop deployment and report

---

## Functional Test Checklist

- [ ] Invitation flow: admin sends invite, invitee receives email, clicks link, setup screen appears
- [ ] Account setup: display name and password are required, board loads after completion
- [ ] Subsequent login: email + password works, no new link needed
- [ ] Google login works for invited users
- [ ] Uninvited user is blocked on sign-in (any method)
- [ ] Creating a card saves to Firestore
- [ ] Moving a card between columns persists after page refresh
- [ ] Archiving a card removes it from board and shows in Archive view
- [ ] Archive search filters correctly and preserves the search term while typing
- [ ] Offline mode: disable network in DevTools → make a change → reconnect → change syncs
- [ ] Two browser tabs see each other's changes in real time
- [ ] XSS test passes (see above)
- [ ] Unauthorized Firestore access returns 403 (open Firestore REST URL without auth)
