# Bitnova Labs — Kanban

## Installation & Deployment Guide

---

## Project Files

| File | Description |
|------|-------------|
| `index.html` | Full application — UI, styles, logic, Firebase integration |
| `manifest.json` | PWA config (name, icons, colors, start URL) |
| `sw.js` | Service Worker for offline cache and sync |
| `firestore.rules` | Firestore security rules — must be deployed to Firebase |
| `icon-192.png` | App icon 192×192px |
| `icon-512.png` | App icon 512×512px |

---

## Step 1 — Configure Firebase

Follow the full Firebase setup guide before deploying:

**[→ docs/FIREBASE_SETUP_GUIDE.md](./FIREBASE_SETUP_GUIDE.md)**

That guide covers:
- Creating the Firebase project and registering the web app
- Updating credentials in `index.html`
- Enabling Email/Password, Email link, and Google authentication
- Creating the Firestore database and deploying security rules
- Bootstrapping the first admin account

Complete all steps in that guide before proceeding.

---

## Step 2 — Deploy to GitHub Pages

1. Create a repository at [github.com/new](https://github.com/new).
   - Name it `bitnova-kanban` (or any name you prefer).
   - Set visibility to **Public** (GitHub Pages requires this on the free plan).

2. Push all project files to the `main` branch.

3. In the repository, go to **Settings** → **Pages**.
   - Source: **Deploy from a branch**
   - Branch: `main`
   - Folder: `/ (root)`
   - Click **Save**.

4. GitHub Pages will build and deploy within 1–2 minutes. Your app URL will be:
   ```
   https://your-username.github.io/bitnova-kanban/
   ```

5. Make sure this domain is added to Firebase Authorized Domains (covered in Step 5 of the Firebase guide).

---

## Step 3 — Verify the deployment

After deploying, run through this checklist:

- [ ] App loads at the GitHub Pages URL
- [ ] Sign-in screen appears (not the board)
- [ ] Google Sign-In works for an invited user
- [ ] Email link sign-in works (send a test invitation from the Admin panel)
- [ ] Board loads after sign-in
- [ ] Creating a card saves and persists after page refresh
- [ ] Uninvited user is blocked with the invitation-only message
- [ ] Admin panel is visible for the admin account and hidden for regular users

---

## How the access system works

The app uses an **invitation-only** model. There is no open registration.

1. The **admin** opens the Admin panel inside the app and enters a team member's email.
2. The team member receives an **invitation email** with a sign-in link.
3. On first click, they land on a **setup screen** to choose a display name and set a password.
4. From then on, they log in with **email + password** (or Google if they prefer).
5. Their profile is automatically added to the team list and they become assignable to cards.

To remove access, the admin clicks **Revoke** next to the user in the Admin panel. The user is blocked on their next page load.

---

## How sync works

**Real-time:** changes made by one user (new card, move, edit) appear instantly in all other open browser sessions without refreshing.

**Offline:** if the connection is lost, the app continues working. Changes are queued locally and sync automatically when the connection returns. The header indicator shows current sync state.

---

## Installing as a native app (PWA)

| Platform | Instructions |
|----------|-------------|
| Chrome / Edge (desktop) | Click the install icon (⊕) in the browser address bar |
| Android Chrome | Menu (⋮) → **Install app** or **Add to home screen** |
| iPhone / iPad Safari | Share button → **Add to Home Screen** |

---

## Troubleshooting

| Problem | Solution |
|---------|---------|
| "auth/unauthorized-domain" | Add your domain in Firebase → Authentication → Settings → Authorized domains |
| "Missing or insufficient permissions" | Deploy the Firestore rules — see `FIREBASE_SETUP_GUIDE.md` Step 7 |
| Admin button not visible | Verify your email is in the `admins` Firestore collection — see `FIREBASE_SETUP_GUIDE.md` Step 8 |
| Invitation email not received | Check spam; verify Email link is enabled in Firebase Auth settings |
| Cards not saving | Verify Firebase credentials in `index.html` match your project |
| App not installing as PWA | URL must use HTTPS — GitHub Pages provides this automatically |

---

## Firebase free plan limits

The Spark (free) plan includes:
- Unlimited authentication
- 1 GB Firestore storage
- 50,000 reads / day
- 20,000 writes / day

For a team of up to 50 people with typical Kanban usage, the free plan is more than sufficient.

---

*Last updated: 2026-04-07*
