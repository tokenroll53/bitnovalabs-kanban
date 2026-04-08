# Release Verification Checklist — P1

Run through every item below after deploying. Check off as you go.

**Branch:** `main` | **URL:** `https://tokenroll53.github.io/bitnovalabs-kanban/`

---

## 0. Pre-flight

- [ X ] `firestore.rules` published in Firebase Console (Firestore → Rules → Publish)
- [ X ] `sw.js` cache version is `kanbanflow-v3`
- [ X ] All changes pushed to `main`, GitHub Actions build completed

---

## 1. Authentication — Google

- [ X ] Open the app URL in a fresh browser session (or Incognito)
- [ x ] Login screen appears: email field, password field, Google button, "Send magic link" toggle
- [ x ] Click **Sign in with Google** → popup (desktop) or redirect (mobile) → signs in
- [ x ] If the Google account has an `admins/` doc: **Admin** button appears in the header
- [  ] If the Google account has an `invites/` doc: board loads directly
- [  ] If the Google account has neither: rejected with "invitation-only" message

---

## 2. Authentication — Invitation flow (first access)

> Use a real email address you control that is NOT yet in Firebase Auth.

- [ x ] Sign in as admin → open **Admin panel** → enter test email → click **Send Invitation**
- [ x ] Toast confirms invitation sent; email appears in invite list
- [ x ] Check inbox — invitation email arrives within 60 seconds
- [ x ] Click the magic link in the email → app opens at the setup screen
- [ x ] Setup screen shows: display name field, password field, confirm password field
- [ ] Enter a name and a password → click **Save**
- [ ] Board loads, user avatar + name appear in the header
- [ ] User appears in the **Team** sidebar / assignee picker

---

## 3. Authentication — Subsequent login (email + password)

- [ x ] Sign out
- [  ] Enter the same email and the password set during setup → click **Sign in**
- [ x ] Board loads without showing the setup screen again

---

## 4. Authentication — Password reset

- [ x ] On the login screen, click **Forgot password?**
- [ x ] Enter the test email → confirm toast "Reset email sent"
- [ x ] Check inbox — reset email arrives
- [ x] Click the link → Firebase password reset page opens (outside the app — this is expected)

---

## 5. Authentication — Uninvited user rejection

- [ x ] Try signing in with an email that has no `invites/` doc (Google or email+password)
- [ x ] App shows rejection message; board does NOT load

---

## 6. Board — Card CRUD

- [ ] Create a new card (title, label, priority, assignee) → card appears in the correct column
- [ ] Edit the card → changes persist after page refresh
- [ ] Drag the card to another column → persists after refresh
- [ ] Archive the card → card disappears from board; appears in archive view
- [ ] Restore the card from archive → card returns to board

---

## 7. Board — Realtime sync

- [ ] Open the app in two browser tabs (both signed in)
- [ ] Create or move a card in Tab A → change appears in Tab B within ~2 seconds without refreshing

---

## 8. Board — Offline persistence

- [ ] Sign in and load the board
- [ ] Open DevTools → Network → set to **Offline**
- [ ] Create a card while offline → card appears locally
- [ ] Set Network back to **Online** → card syncs to Firestore (refresh to confirm)

---

## 9. Export

- [ ] Click the export button → CSV (or JSON) file downloads
- [ ] Open the file — data matches what is on the board

---

## 10. XSS regression

- [ ] Create a card with title: `<img src=x onerror="alert(1)">`
- [ ] Card renders the text literally — **no alert dialog appears**
- [ ] Edit card description with `<script>alert(1)</script>` — renders as text, no execution

---

## 11. PWA — Install and offline fallback

- [ ] Visit the app URL in Chrome/Edge
- [ ] Browser shows install prompt (or use the address bar install icon)
- [ ] Install the app → PWA opens in standalone window
- [ ] Disconnect from the internet → reload the PWA → app still loads (service worker fallback)

---

## 12. Mobile smoke test

- [ ] Open the URL on a mobile device (or DevTools mobile emulation)
- [ ] Login screen is readable and usable
- [ ] Google sign-in uses redirect flow (not popup) — no popup blocked error
- [ ] Board scrolls and cards are draggable (or tap-to-move if drag is not implemented for touch)

---

## Sign-off

All items above checked → P1 is complete. Safe to notify team and invite first users.

*Last updated: 2026-04-07*
