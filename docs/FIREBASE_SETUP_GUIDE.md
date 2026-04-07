# Firebase Setup Guide — Bitnova Kanban

Complete step-by-step guide for configuring Firebase for the Bitnova Kanban app.
This guide covers the full setup required for the invitation-only access system,
email authentication, and Firestore security.

**Prerequisites:** A Google account and access to [console.firebase.google.com](https://console.firebase.google.com).

---

## Overview of what you will configure

| Step | What | Why |
|------|------|-----|
| 1 | Create or open Firebase project | The backend that powers auth and database |
| 2 | Register the web app | Gets you the config credentials for `index.html` |
| 3 | Update credentials in `index.html` | Connects the app to your Firebase project |
| 4 | Enable authentication providers | Allows email link + email/password + Google login |
| 5 | Add authorized domain | Allows your GitHub Pages URL to use Firebase Auth |
| 6 | Create Firestore database | The real-time database for cards, users, and invites |
| 7 | Deploy Firestore security rules | Locks down who can read and write what |
| 8 | Bootstrap the first admin | Creates your admin account so you can send invitations |

---

## Step 1 — Create or open your Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com).
2. If you already have a Firebase project for this app, click on it and skip to Step 2.
3. If you are starting fresh, click **Add project**.
4. Enter a project name (e.g. `bitnova-kanban`). Firebase will generate a project ID based on this — you can edit it if you want something specific.
5. On the next screen, Google Analytics is optional. You can disable it for now.
6. Click **Create project** and wait for Firebase to finish provisioning (about 30 seconds).
7. Click **Continue** when the project is ready. You will land on the project overview page.

---

## Step 2 — Register the web app and get credentials

1. On the project overview page, look for the icons under "Get started by adding Firebase to your app." Click the **Web** icon (`</>`).
2. In the "App nickname" field, enter `Bitnova Kanban`.
3. **Do not** check the "Also set up Firebase Hosting" checkbox — the app deploys to GitHub Pages.
4. Click **Register app**.
5. Firebase will show you a `firebaseConfig` object. It looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC_xxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

6. **Copy all six values.** You will need them in the next step.
7. Click **Continue to console**.

> If you need these credentials again later: go to **Project settings** (gear icon at the top of the left sidebar) → scroll down to **Your apps** → click on the app → **SDK setup and configuration**.

---

## Step 3 — Update Firebase credentials in index.html

1. Open `index.html` in your code editor.
2. Search for `FIREBASE_CONFIG` (around line 2530).
3. You will find a block like this:

```javascript
const FIREBASE_CONFIG = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

4. Replace the values with the ones you copied from Firebase in Step 2.
5. Save `index.html`.

> **Security note:** Firebase web API keys are not secrets. They identify your project but grant no privileged access on their own. Security is enforced by Firestore rules (Step 7) and Firebase Authentication. Never paste private service account keys in client-side code.

---

## Step 4 — Enable authentication providers

The app uses three sign-in methods. All three must be enabled.

### 4.1 — Open Authentication settings

1. In the Firebase Console left sidebar, click **Authentication**.
2. If you see a "Get started" button, click it.
3. Click the **Sign-in method** tab.

### 4.2 — Enable Email/Password

1. In the list of providers, click **Email/Password**.
2. Toggle the first switch to **Enable**.
3. You will see a second toggle below it: **Email link (passwordless sign-in)**. Toggle this to **Enable** as well.

   > Both toggles must be on. The first enables standard email/password login for returning users. The second enables the magic link used to deliver invitations.

4. Click **Save**.

### 4.3 — Enable Google

1. Back in the provider list, click **Google**.
2. Toggle **Enable**.
3. In the **Project support email** dropdown, select your email address.
4. Click **Save**.

### 4.4 — Verify

After saving, the Sign-in method tab should show:
- **Email/Password** — Enabled
- **Google** — Enabled

---

## Step 5 — Add your authorized domain

Firebase blocks authentication requests from domains that are not on the authorized list. You need to add your GitHub Pages domain.

1. Still in **Authentication**, click the **Settings** tab.
2. Scroll down to **Authorized domains**.
3. You will see `localhost` and your Firebase project domain already listed. Do not remove these.
4. Click **Add domain**.
5. Enter your GitHub Pages domain in this format: `your-username.github.io`

   > Do not include `https://` or a trailing slash. Just the domain.

6. If your app is deployed at a subpath (e.g. `your-username.github.io/bitnova-kanban`), you still only add the root domain: `your-username.github.io`. Firebase matches on the domain, not the path.

7. Click **Add**.

---

## Step 6 — Create the Firestore database

1. In the Firebase Console left sidebar, click **Firestore Database**.
2. Click **Create database**.
3. Choose a **location** for your database. Choose the region closest to your team:
   - Americas: `us-central1` (Iowa) or `southamerica-east1` (São Paulo)
   - Europe: `europe-west1` (Belgium) or `europe-west3` (Frankfurt)
   - Asia Pacific: `asia-east1` (Taiwan)

   > **Important:** You cannot change the region after creation. Choose carefully.

4. For the security rules, select **Start in production mode**. You will deploy the real rules in the next step.
5. Click **Enable**. Firestore takes about 30 seconds to provision.

---

## Step 7 — Deploy Firestore security rules

The `firestore.rules` file in the project root contains all the security rules for the app. These rules must be published before the app goes live — without them, anyone who finds your Firebase config can access your database directly.

### Option A — Firebase Console (no tools needed, recommended for first deploy)

1. In the Firebase Console, go to **Firestore Database** → **Rules** tab.
2. You will see a text editor with the current rules.
3. Open the `firestore.rules` file from the project root in your code editor and copy its entire contents.
4. In the Firebase Console rules editor, select all the existing text and replace it with what you copied.
5. Click **Publish**.
6. Firebase will show a confirmation that the rules were published.

### Option B — Firebase CLI (recommended for future updates)

If you have Node.js installed, you can deploy rules from the terminal:

```bash
# Install the Firebase CLI (one time only)
npm install -g firebase-tools

# Log in to Firebase
firebase login

# In the project folder, initialize Firebase (select Firestore when prompted)
cd /path/to/bitnovalabs-kanbas
firebase init firestore

# Deploy only the rules
firebase deploy --only firestore:rules
```

### Verify the rules are working

After publishing, test that unauthenticated access is blocked:

1. Open a new browser tab.
2. Go to this URL (replace `YOUR_PROJECT_ID` with your Firebase project ID):
   ```
   https://firestore.googleapis.com/v1/projects/YOUR_PROJECT_ID/databases/(default)/documents/cards
   ```
3. You should see a `403 Permission Denied` response. If you see card data instead, the rules were not published correctly — go back and repeat this step.

---

## Step 8 — Bootstrap the first admin

The invitation system requires at least one administrator document in Firestore. This is a one-time manual step. After this, all admin management (including adding more admins) happens inside the app.

1. In the Firebase Console, go to **Firestore Database** → **Data** tab.
2. Click **+ Start collection**.
3. In the "Collection ID" field, type exactly: `admins`
4. Click **Next**.
5. In the "Document ID" field, type the email address of the first administrator — this must be the email address they will use to sign in (e.g. `admin@yourcompany.com`).

   > The document ID must be the exact email address, including the correct capitalisation. Email addresses in Firebase are case-sensitive in this context.

6. You can leave the document fields empty, or add these fields for record-keeping:
   - Field name: `grantedAt` | Type: `timestamp` | Value: click **timestamp** and set to now
   - Field name: `grantedBy` | Type: `string` | Value: `bootstrap`

7. Click **Save**.

You should now see the `admins` collection with one document whose ID is the admin's email.

**What happens next:** When the admin signs in to the app for the first time, the app checks Firestore for their email in the `admins` collection, finds it, and shows the **Admin** button in the header. From there, they can send invitations to other users — no further Firebase Console access is needed for user management.

---

## Step 9 — First sign-in as admin

1. Open the app in your browser.
2. Sign in with Google (using the email you set as admin in Step 8) or use the email link option.

   > If you signed in with Google: the app will check the `invites` collection for your email. Since you are an admin, the rules allow you through even without an `invites` entry.

3. The board will load and you should see an **Admin** button in the header.
4. Click Admin → you will see the invite panel.
5. Enter a team member's email and click **Send Invitation**. They will receive an email with a link to set up their account.

---

## Summary checklist

Use this before going live:

- [ ] Firebase project created and web app registered
- [ ] Firebase credentials updated in `index.html`
- [ ] Email/Password provider enabled (with Email link toggle also on)
- [ ] Google provider enabled
- [ ] GitHub Pages domain added to Authorized Domains
- [ ] Firestore database created in production mode
- [ ] Firestore security rules published from `firestore.rules`
- [ ] Unauthenticated Firestore access returns 403 (verified)
- [ ] `admins` collection created with the first admin's email as the document ID
- [ ] First admin can sign in, sees the Admin button, and can send an invitation

---

## Troubleshooting

| Problem | What to check |
|---------|---------------|
| "auth/unauthorized-domain" on sign-in | Step 5 — add your domain to Authorized Domains |
| "Missing or insufficient permissions" on data load | Step 7 — verify Firestore rules are published |
| Admin button not visible after sign-in | Step 8 — verify the `admins` document ID matches your email exactly |
| Invitation email not received | Check spam; verify Email link is enabled (Step 4.2 second toggle) |
| Google sign-in popup blocked | Allow popups for the app domain in your browser settings |
| Cards not saving after login | Verify credentials in `index.html` match your Firebase project (Step 3) |
| Firestore returns data without login | Rules not published — repeat Step 7 |

---

*Last updated: 2026-04-07*
