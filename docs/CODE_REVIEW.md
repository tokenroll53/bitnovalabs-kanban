# Code & Security Review — Bitnova Labs Kanban

**Date:** 2026-03-13
**Reviewer:** Claude Code
**Verdict:** CONDITIONAL GO — one deployment blocker remaining

---

## Deployment Blocker

**Deploy Firestore security rules before going live.**
The file `firestore.rules` is ready in the project root.

**Option A — Firebase Console (no CLI):**
1. Firebase Console → Firestore Database → Rules tab
2. Paste the contents of `firestore.rules`
3. Click Publish

**Option B — CLI:**
```bash
firebase deploy --only firestore:rules
```

---

## Security Audit Results

| Check | Status | Notes |
|-------|--------|-------|
| XSS — card title/desc/projectCode | ✅ Fixed | All wrapped in `escHtml()` |
| XSS — checklist text | ✅ Fixed | Escaped in all views |
| XSS — archive fields | ✅ Fixed | All fields escaped including assignee names |
| XSS — modal inputs | ✅ Fixed | Input values escaped |
| Content Security Policy | ✅ Fixed | CSP meta tag added to `<head>` |
| Clickjacking protection | ✅ Fixed | `frame-ancestors 'none'` in CSP |
| Input maxlength constraints | ✅ Fixed | title:200, desc:3000, projectCode:20, checklist:200, archiveNote:500 |
| Event listener leak (online/offline) | ✅ Fixed | Moved outside `startFirestoreListeners()` |
| Global state (`window._archiveReason`) | ✅ Fixed | Replaced with `dataset.archiveReason` |
| Firebase credentials | ✅ Updated | Real credentials in `index.html` |
| Firestore security rules | ⚠️ Pending | File written — needs deploying |
| Auth gate | ✅ Pass | App data hidden until auth confirmed |
| No `eval` / `document.write` | ✅ Pass | None found |

**Accepted limitations (internal tool):**
- `'unsafe-inline'` in CSP — required by 26 inline `onclick` handlers
- No SRI hashes on Firebase CDN scripts — steps in `SECURITY_CHECKLIST.md`
- No row-level Firestore access control — all authenticated users share one board (by design)

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

- [ ] Google login works
- [ ] Creating a card saves to Firestore
- [ ] Moving a card between columns persists after page refresh
- [ ] Archiving a card removes it from board and shows in Archive view
- [ ] Archive search filters correctly and preserves the search term while typing
- [ ] Offline mode: disable network in DevTools → make a change → reconnect → change syncs
- [ ] Two browser tabs see each other's changes in real time
- [ ] XSS test passes (see above)
- [ ] Unauthorized Firestore access returns 403 (open Firestore REST URL without auth)
