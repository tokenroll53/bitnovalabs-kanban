# Bitnova Kanban: Safe-Launch Priority Plan

## Summary
This app starts as an internal shared board but is designed to grow into a client-facing product. Every decision should account for that future: clean auth patterns, modular data models, and no shortcuts that would create blockers at scale. The immediate goal is a safe internal launch: close security gaps, implement invitation-only access with an in-app admin panel, validate deployment, run release verification, then schedule the structural work that enables the product path.

---

## Prioritized Actions

### P0 - Close launch blockers
- Add explicit clickjacking protection to the CSP in `index.html` with `frame-ancestors 'none'`, unless embedding is intentionally allowed and documented.
- Verify the Firestore rules from `firestore.rules` are actually deployed to the live Firebase project.
- Reconcile `docs/CODE_REVIEW.md` and `docs/SECURITY_CHECKLIST.md` with the real code so they do not claim protections that are not present.
- Treat this group as required before release.

---

### P1 - Invitation-only access with in-app admin panel

Access is restricted to explicitly invited users. There is no open self-registration. The administrator sends invitations from inside the app. The invitation email doubles as a one-time sign-in link. On first access the user sets a display name and a password; all subsequent logins use email and password. Google Sign-In remains available as an alternative.

#### Auth flow — complete sequence

**First access (invitation):**
1. Admin sends invite from within the app → Firebase sends a magic link email to the invitee.
2. Invitee clicks the link → authenticated automatically via Firebase Email Link.
3. App detects this is a first sign-in (no password set, `invites.status === "pending"`) and shows the **account setup screen**.
4. Setup screen collects: **display name** (shown on avatars, team list, task assignments) and **password** (used for all future logins). Both fields are required.
5. App calls `user.updateProfile({ displayName })`, `user.updatePassword(password)`, and updates `invites/{email}.status` to `"accepted"`.
6. A `team/{userId}` document is created in Firestore with `{ name, email, color }` where `color` is auto-assigned from a predefined palette. The user can change their name and color later from a profile settings screen.
7. Board loads.

**All subsequent logins:**
- User enters their email and password on the login screen → `signInWithEmailAndPassword(email, password)`.
- No magic links involved after the first access. The invitation link is single-use and expires after 24 hours (Firebase default).

**Google Sign-In path:**
- User signs in with Google → invite gate check runs → if invited, the account setup screen is shown on first sign-in to collect a display name (no password needed). A `team/{userId}` document is created using the Google display name as default, editable by the user.

**Password reset:**
- Login screen has a "Forgot password?" link → `auth.sendPasswordResetEmail(email)` → Firebase sends a reset link. Standard Firebase flow, no custom backend.

#### Firestore data model

**`admins/{email}`** — document ID is the admin's email. Contains optional metadata (`grantedAt`, `grantedBy`). First admin is bootstrapped via the Firebase Console once; subsequent admins are managed from within the app by an existing admin.

**`invites/{email}`** — document ID is the invitee's email. Contains:
- `invitedBy`: email of the admin who sent the invite
- `invitedAt`: server timestamp
- `status`: `"pending"` (link not yet clicked) or `"accepted"` (account setup complete)

**`team/{userId}`** — document ID is the Firebase `uid`. Contains:
- `name`: display name chosen during setup
- `email`: used for cross-referencing with `invites`
- `color`: hex color for avatar, auto-assigned on creation, editable by the user
- `createdAt`: server timestamp

The board loads `TEAM` from Firestore `team/` at startup instead of from the hardcoded array in `index.html`. This makes the team list fully dynamic — no code change or redeploy needed when a new user joins.

#### Firestore security rules

```
match /admins/{email} {
  allow read: if request.auth != null && request.auth.token.email == email;
  allow write: if request.auth != null
    && exists(/databases/$(database)/documents/admins/$(request.auth.token.email));
}

match /invites/{email} {
  allow read: if request.auth != null && request.auth.token.email == email;
  allow read, write: if request.auth != null
    && exists(/databases/$(database)/documents/admins/$(request.auth.token.email));
}

match /team/{userId} {
  // Any authenticated, invited user can read the full team list (needed for assignee picker).
  allow read: if request.auth != null
    && exists(/databases/$(database)/documents/invites/$(request.auth.token.email));
  // Users can only write their own team document.
  allow write: if request.auth != null && request.auth.uid == userId;
}
```

#### Firebase Console one-time setup
1. Enable Email/Password sign-in under Authentication → Sign-in method.
2. Under Email/Password, also enable "Email link (passwordless sign-in)" — used for the invitation mechanism only.
3. Enable Google sign-in.
4. In the `admins` Firestore collection, manually create one document with the first admin's email as the document ID.
5. Deploy the updated Firestore rules.

#### Admin panel UI (visible only to admin users)
- Render an "Admin" button in the app header only when `admins/{user.email}` exists in Firestore.
- The panel is a modal or side drawer with two sections:

**Invite a user:**
- Email input and "Send Invitation" button.
- On submit: create `invites/{email}` with `{ invitedBy, invitedAt, status: "pending" }`, then call `auth.sendSignInLinkToEmail(email, { url: appUrl, handleCodeInApp: true })`. Store the email in `localStorage` so it is available when the link is opened on the same device.
- Show confirmation: "Invitation sent to [email]."
- Show error if the email is already in `invites`.

**Manage existing invites:**
- List all documents in `invites` (admins can read all).
- Each row shows: email, invited by, date, status badge (`pending` / `accepted`).
- Each row has a "Revoke" button that deletes the `invites/{email}` document and the corresponding `team/{userId}` document. Revoked users are blocked on their next page load.

#### Login screen UI
- Email and password fields with a "Sign in" button → `signInWithEmailAndPassword`.
- "Forgot password?" link → `auth.sendPasswordResetEmail(email)`.
- "Sign in with Google" button.
- No registration form. If an uninvited user somehow reaches the login screen, the invite gate in `onAuthStateChanged` handles rejection after any sign-in attempt.

#### Invite gate in `onAuthStateChanged`
After every sign-in, query `invites/{user.email}`. If the document does not exist and the user is not an admin, call `auth.signOut()` and display: "Access is by invitation only. Contact your administrator." Apply to all sign-in methods.

#### `authErrors` map additions
- `auth/invalid-action-code`: "The invitation link is invalid or has expired. Ask your administrator to send a new one."
- `auth/expired-action-code`: same message.
- `auth/wrong-password`: "Incorrect password."
- `auth/user-not-found`: "No account found with that email."
- `auth/weak-password`: "Password must be at least 6 characters."

#### Why this approach
- The magic link is used exactly once, as a secure delivery channel for the invitation. After setup it plays no further role.
- Email + password for daily login is familiar, works on any device, and requires no dependency on Google accounts.
- The `team/` collection replaces the hardcoded `TEAM` array, making the user roster dynamic. No redeploy is needed when someone new joins — the right foundation for a multi-tenant product.

#### Acceptance criteria
- An admin can open the admin panel and send an invitation by email address.
- The invitee receives the email and clicking the link lands them on the account setup screen.
- Setup requires a display name and a password; neither can be skipped.
- After setup, the user appears in the team list and is assignable to cards.
- All subsequent logins use email and password; no link is needed again.
- Password reset email is delivered and the new password works on next sign-in.
- An uninvited user who signs in (any method) is signed out immediately with the invitation-only message.
- An admin can revoke access; the user is blocked on their next page load and removed from the team list.
- A non-admin does not see the Admin button.
- Google Sign-In works for invited users; the setup screen collects a display name on first Google sign-in.
- The `TEAM` list in the board reflects all active `team/` documents, with no code change required when users are added or removed.

---

### P1 - Fix deployment and onboarding reliability
- Update `docs/INSTALLATION_GUIDE.md` so setup steps reflect the current app and remove stale references such as `seedDemoData()`.
- Keep GitHub Pages as the supported host for this release and verify `manifest.json` `start_url` and `sw.js` `BASE` match the exact deployed subpath.
- Add one concise deployment checklist covering: first admin bootstrapped in Firestore, all Firestore rules deployed, Email Link + Email/Password + Google sign-in enabled in Firebase Console, GitHub Pages domain added to authorized domains, and PWA path validation.
- Make this the canonical onboarding path for future deploys.

### P1 - Run a release verification pass
- Verify Google login on desktop popup flow and mobile redirect flow.
- Verify full invitation flow: admin sends invite → invitee receives email → clicks link → setup screen → sets name and password → board loads → user appears in team list.
- Verify subsequent login with email and password works without needing a new link.
- Verify password reset flow.
- Verify uninvited user is rejected for both Google and email/password sign-in.
- Verify create, edit, drag/drop, archive, restore, and export actions against Firestore.
- Verify offline persistence, reconnect sync, and realtime updates across two browser sessions.
- Run one XSS regression test using HTML payloads in user-entered fields and confirm the payload renders as text.
- Verify installability and offline fallback from the GitHub Pages URL.

### P2 - Reduce near-term operational risk
- Improve user-visible error states for sync/auth failures so production issues are diagnosable without reading code.
- Record current accepted limitations: invitation-only access, admin panel required for user management, no per-board permissions yet, GitHub Pages subpath dependency, single-file architecture.
- Keep inline handlers and the current CSP tradeoff for this week if speed matters, but capture their removal as a post-launch hardening item.

### P3 - Post-launch: structural groundwork for the product path
These items are not cosmetic cleanup — they are the foundation for offering this as a client product.
- Split the single-file app into separate HTML, CSS, and JS modules.
- Introduce a board data model that supports multiple boards per tenant, even if only one board is active today.
- Extract Firebase config and all deployment-path constants into a single config file.
- Replace inline event handlers with bound listeners so CSP can be tightened.
- Add automated smoke coverage for auth gating, board rendering, and Firestore-backed core flows.

---

## Implementation Notes
- Hosting stays GitHub Pages for this release. Future client deployments will require a hosting model that supports per-tenant isolation.
- Auth: invitation-only via magic link (one-time) → email + password for all subsequent logins. Google Sign-In as optional alternative.
- Team roster is dynamic: stored in Firestore `team/` collection, loaded at startup. The hardcoded `TEAM` array in `index.html` is removed as part of this work.
- First admin must be bootstrapped once via the Firebase Console. All subsequent user management happens inside the app.
- No product-scope expansion before P0 and P1 are complete.
- P3 work is prioritized above typical post-launch cleanup because it directly enables the client product path.

## Test Cases
- An admin user sees the Admin button; a non-admin does not.
- Admin sends an invitation; the invitee receives the email within seconds.
- Sending a duplicate invite shows an error without re-sending.
- Invitee clicks the link and lands on the account setup screen.
- Setup screen cannot be submitted without both a display name and a password.
- After setup, the user appears in the assignee picker and team list.
- Invitee opens the link on a different device: email prompt appears before sign-in completes, then setup screen follows.
- Subsequent login with email and password works; no new link required.
- Password reset email is delivered; new password works on next sign-in.
- An uninvited Google user is signed out immediately and sees the invitation-only message.
- An uninvited email/password attempt is rejected with the invitation-only message.
- Admin revokes an invite; the user is blocked on their next page load and removed from the team list.
- Card CRUD, drag/drop, archive, and restore persist after refresh.
- Export produces a usable JSON snapshot.
- Offline edits sync after reconnect.
- Realtime updates appear in another tab or browser session.
- HTML payloads in title, description, and checklist fields are rendered as escaped text.
- PWA install and offline entry work from the GitHub Pages subpath.
- Unauthenticated Firestore access is denied; authenticated access succeeds.

## Assumptions And Defaults
- The audience for this plan is you and your IDE agents; the roadmap is written for direct implementation.
- The app is built for internal use first but is designed to grow into a client-facing product. Decisions that would create blockers at scale should be avoided even now.
- GitHub Pages is the deployment target for this release.
- The first admin is bootstrapped via the Firebase Console; all subsequent user management happens in the app.
- Do not refactor architecture before launch; ship the auth and team model changes first, then restructure with P3.
