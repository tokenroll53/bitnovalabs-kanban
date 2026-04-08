# Deployment Checklist — Bitnova Kanban

Quick reference for every deployment. Full setup instructions: `docs/FIREBASE_SETUP_GUIDE.md`.

**Deployed URL:** `https://tokenroll53.github.io/bitnovalabs-kanban/`

---

## Firebase (one-time, already done)

- [x] Firebase project created — `bitnova-kanban`
- [x] Web app registered, credentials in `index.html`
- [x] Email/Password provider enabled
- [x] Email link (passwordless) enabled
- [x] Google provider enabled
- [x] GitHub Pages domain added to Authorized Domains (`tokenroll53.github.io`)
- [x] Firestore database created (production mode)
- [x] First admin bootstrapped in `admins/{email}` collection
- [x] Password reset action URL set to `https://tokenroll53.github.io/bitnovalabs-kanban/`
  (Console → Authentication → Templates → Password reset → Edit → Customize action URL)

---

## Before every release

### Code
- [ ] `sw.js` cache version bumped (e.g. `kanbanflow-v4` → `kanbanflow-v5`) so browsers pick up the new build
- [ x ] `firestore.rules` is up to date with any new collections

### Firebase
- [ x ] Latest `firestore.rules` deployed (Console → Firestore → Rules → Publish)
- [ x ] Verify unauthenticated Firestore access returns 403:
  ```
  https://firestore.googleapis.com/v1/projects/bitnova-kanban/databases/(default)/documents/cards
  ```

### GitHub Pages
- [ x ] All changes committed and pushed to `main`
- [ x ] Pages build completed (repo → Actions tab, or wait ~2 min)
- [ x ] App loads at `https://tokenroll53.github.io/bitnovalabs-kanban/`

---

## After every release — smoke test

- [ x ] Login screen appears (email + password form visible, Google button present)
- [ x ] Uninvited email/Google account is rejected with invitation-only message
- [ x ] Admin signs in → Admin button appears in header
- [ x ] Admin panel opens, invite list loads
- [ x ] Send test invitation → email received within 60 seconds
- [ x ] Invited user clicks link → setup screen appears
- [ x ] After setup → board loads, user appears in team list and assignee picker
- [ ] Card create / edit / drag-drop / archive all persist after page refresh
- [ ] Realtime: open two tabs — changes in one appear in the other
- [ ] XSS check: create card with title `<img src=x onerror="alert(1)">` — renders as text, no alert

---

## Adding a new user (ongoing)

1. Sign in as admin → open Admin panel
2. Enter invitee email → Send Invitation
3. Invitee receives email, clicks link, completes setup
4. Done — no code change or redeploy needed

## Revoking a user (ongoing)

1. Sign in as admin → open Admin panel
2. Click Revoke next to the user
3. User is blocked on their next page load — no redeploy needed

---

*Last updated: 2026-04-08*
