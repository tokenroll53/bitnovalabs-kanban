# Plan: Notification Bell — App Updates & Realtime Events

## Context

Users are running stale cached versions of the app because the PWA service worker serves from cache and there is no mechanism to alert them when a new version is available. Additionally, collaborators working simultaneously have no indication when another user adds a card, project, or snapshot — they only see the change after they happen to look at the relevant view.

This plan adds a **notification bell button** in the header that accumulates unread notifications and opens a dropdown panel listing them. Four trigger types are covered:

1. **App update** — a new service worker version is waiting to activate.
2. **New card** — another user added a card to `cards/`.
3. **New project** — another user added a project to `projects/`.
4. **New snapshot** — another user created a voting proposal in `snapshots/`.

Notifications live in memory only (no Firestore persistence). They are session-scoped: they accumulate while the tab is open and are cleared on reload or logout.

---

## Architecture Decisions

### In-memory store, no persistence
Notifications do not need to survive a page reload. Persisting them to Firestore would add cost, complexity, and a new collection — not justified for session-scoped awareness toasts.

### Detecting "new" items vs. initial load
Every Firestore `onSnapshot` listener fires immediately on first attach, returning all current documents as `type: 'added'`. To distinguish the initial load from live additions, each listener uses a `_initialized` boolean flag:
- On the first snapshot call: set flag to `true`, skip notification logic.
- On subsequent calls: inspect `snapshot.docChanges()` for `type === 'added'`.

### Filtering own writes
When this client writes to Firestore, the local listener fires twice:
1. Immediately with `change.doc.metadata.hasPendingWrites === true` (optimistic local write).
2. After server ACK with `hasPendingWrites === false`.

Skip notifications where `hasPendingWrites === true`. This suppresses the first fire from own writes cleanly. The second fire (server confirmation) is handled by passing an `_ownIds` set: when the user submits a create form, the new document ID is added to `_ownIds` before the async write; the docChanges handler skips IDs in that set.

- For **projects**: document ID = project `code` (known before the write).
- For **snapshots**: document ID is auto-assigned by Firestore; capture the returned `ref.id` in a side-effect and add it to `_ownIds` inside the same `createSnapshot` call before the listener processes the ACK.
- For **cards**: document ID is already on the card object before the write (assigned by `board.js`); can be added to `_ownIds` the same way.

### SW update detection
The current registration in `app.js` is fire-and-forget (`register(...).catch(() => {})`). It needs to be replaced with a pattern that watches for `updatefound` on the registration object. When a new SW moves to `installed` state while the current page is already controlled (i.e. this is an update, not a first install), the notification is emitted.

### Notification panel UX
- Bell icon in `header-actions`, between `#btnExport` and `#userInfo`.
- Red badge with count appears when there are unread notifications.
- Clicking the bell toggles a dropdown panel anchored to the bell button.
- Clicking outside the panel closes it.
- Clicking a notification row: marks it read; if type is `app-update`, calls `window.location.reload()`; otherwise navigates to the relevant view tab.
- "Marcar todo leído" link at the bottom of the panel.
- When badge count is 0, the badge is hidden (not just empty).

---

## Notification Shape

```js
{
  id:        string,          // crypto.randomUUID() or Date.now() fallback
  type:      'app-update' | 'new-card' | 'new-project' | 'new-snapshot',
  title:     string,          // short label shown in bold
  body:      string,          // secondary line
  timestamp: number,          // Date.now()
  read:      boolean,
}
```

---

## Files to Modify / Create

| File | Action | Summary |
|------|--------|---------|
| `js/notifications.js` | **Create** | In-memory store, add/read/mark-read, badge update, panel render & toggle |
| `css/notifications.css` | **Create** | Bell button, badge bubble, dropdown panel, notification rows |
| `index.html` | Modify | Add `#notificationBtn` + `#notificationPanel` in `header-actions` |
| `js/app.js` | Modify | Upgrade SW registration to detect updates; wire bell button events; import `addNotification` |
| `js/firestore.js` | Modify | Add `_cardsInitialized` flag + `docChanges` loop; accept `onNewCard` callback; export `addOwnCardId` |
| `js/projects.js` | Modify | Add `_projectsInitialized` flag + `docChanges` loop; accept `onNewProject` callback; export `addOwnProjectId` |
| `js/snapshot.js` | Modify | Add `_snapshotsInitialized` flag + `docChanges` loop; accept `onNewSnapshot` callback; export `addOwnSnapshotId` |
| `js/auth.js` | Modify | Pass `onNewCard`, `onNewProject`, `onNewSnapshot` callbacks through to `startFirestoreListeners`, `startProjectsListener`, `startSnapshotsListener`; call `clearNotifications()` on logout |

---

## Detailed Implementation

### 1. `js/notifications.js` (new)

```js
/* Bitnova Kanban — notifications: in-memory bell store */

const _notifications = [];  // newest first
const _ownIds = new Set();  // doc IDs created by this client — skip in docChanges

// ====== OWN-ID GUARD ======
export function registerOwnId(id) { _ownIds.add(id); }
export function isOwnId(id)       { return _ownIds.has(id); }

// ====== STORE ======
export function addNotification({ type, title, body }) {
  _notifications.unshift({
    id: (typeof crypto !== 'undefined' && crypto.randomUUID)
          ? crypto.randomUUID()
          : String(Date.now()),
    type, title, body,
    timestamp: Date.now(),
    read: false,
  });
  _updateBadge();
}

export function markAllRead() {
  _notifications.forEach(n => { n.read = true; });
  _updateBadge();
}

export function markRead(id) {
  const n = _notifications.find(n => n.id === id);
  if (n) n.read = true;
  _updateBadge();
}

export function clearNotifications() {
  _notifications.length = 0;
  _ownIds.clear();
  _updateBadge();
}

export function getNotifications() { return _notifications; }

// ====== BADGE ======
function _updateBadge() {
  const count = _notifications.filter(n => !n.read).length;
  const badge = document.getElementById('notifBadge');
  if (!badge) return;
  badge.textContent = count > 9 ? '9+' : String(count);
  badge.style.display = count > 0 ? '' : 'none';
}

// ====== PANEL ======
export function toggleNotificationPanel() {
  const panel = document.getElementById('notificationPanel');
  if (!panel) return;
  const isOpen = panel.classList.contains('open');
  if (isOpen) {
    panel.classList.remove('open');
  } else {
    _renderPanel();
    panel.classList.add('open');
  }
}

export function closeNotificationPanel() {
  document.getElementById('notificationPanel')?.classList.remove('open');
}

function _renderPanel() {
  const panel = document.getElementById('notificationPanel');
  if (!panel) return;
  const items = _notifications.length
    ? _notifications.map(n => `
        <div class="notif-row${n.read ? '' : ' unread'}" data-id="${n.id}" data-type="${n.type}">
          <span class="notif-icon">${_icon(n.type)}</span>
          <div class="notif-content">
            <div class="notif-title">${_esc(n.title)}</div>
            <div class="notif-body">${_esc(n.body)}</div>
            <div class="notif-time">${_relTime(n.timestamp)}</div>
          </div>
        </div>`).join('')
    : '<div class="notif-empty">Sin notificaciones</div>';

  panel.innerHTML = `
    <div class="notif-header">
      <span>Notificaciones</span>
      <button class="notif-mark-all" id="notifMarkAll">Marcar todo leído</button>
    </div>
    <div class="notif-list">${items}</div>`;
}

function _icon(type) {
  return {
    'app-update':   '⬆',
    'new-card':     '🗂',
    'new-project':  '📁',
    'new-snapshot': '⏱',
  }[type] ?? '🔔';
}

function _relTime(ts) {
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'Ahora mismo';
  if (diff < 3_600_000) return `Hace ${Math.floor(diff / 60_000)} min`;
  if (diff < 86_400_000) return `Hace ${Math.floor(diff / 3_600_000)} h`;
  return new Date(ts).toLocaleDateString('es');
}

function _esc(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
```

Wire events in `app.js`:
- `#notificationBtn` click → `toggleNotificationPanel()`
- `#notifMarkAll` delegated click (inside panel) → `markAllRead(); _renderPanel()`
- `.notif-row` delegated click → `markRead(id)`; if `type === 'app-update'` reload; else navigate to view
- Document click outside panel → `closeNotificationPanel()`

---

### 2. `css/notifications.css` (new)

Covers:

```
.notif-btn          — bell icon button, same style as .btn
.notif-badge        — absolute red bubble top-right of bell, hidden when 0
.notif-panel        — dropdown box, position:absolute, anchored to bell, z-index above header
.notif-panel.open   — visible
.notif-header       — title row + mark-all link
.notif-list         — scrollable list, max-height: 360px
.notif-row          — flex row, padding, hover highlight, cursor:pointer
.notif-row.unread   — left border accent-cyan + slightly brighter background
.notif-icon         — 20px cell
.notif-content      — flex column
.notif-title        — font-weight:600, text-sm
.notif-body         — text-muted, text-xs
.notif-time         — text-muted, text-xs, margin-top:2px
.notif-empty        — centered muted text
```

All colors use existing CSS variables. No new custom properties needed.

---

### 3. `index.html` changes

In `header-actions`, add before `#userInfo`:

```html
<!-- NOTIFICATION BELL -->
<div class="notif-wrapper" style="position:relative">
  <button class="btn notif-btn" id="notificationBtn" title="Notificaciones">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 01-3.46 0"/>
    </svg>
  </button>
  <span class="notif-badge" id="notifBadge" style="display:none">0</span>
  <div class="notif-panel" id="notificationPanel"></div>
</div>
```

Also add `<link rel="stylesheet" href="css/notifications.css">` in `<head>`.

---

### 4. `js/app.js` changes

Replace the current fire-and-forget SW registration:

```js
// ====== PWA SERVICE WORKER ======
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').then(reg => {
    reg.addEventListener('updatefound', () => {
      const incoming = reg.installing;
      incoming.addEventListener('statechange', () => {
        if (incoming.state === 'installed' && navigator.serviceWorker.controller) {
          // A new SW is waiting — existing tab is already controlled (update, not first install)
          addNotification({
            type: 'app-update',
            title: 'Actualización disponible',
            body: 'Hay una nueva versión de la app. Haz clic aquí para actualizar.',
          });
        }
      });
    });
  }).catch(() => {});
}
```

Wire bell button and panel events:

```js
import {
  addNotification, toggleNotificationPanel, closeNotificationPanel,
  markAllRead, markRead, getNotifications, clearNotifications,
} from './notifications.js';

document.getElementById('notificationBtn').addEventListener('click', e => {
  e.stopPropagation();
  toggleNotificationPanel();
});

document.addEventListener('click', e => {
  const panel = document.getElementById('notificationPanel');
  if (panel?.classList.contains('open') &&
      !panel.contains(e.target) &&
      e.target.id !== 'notificationBtn') {
    closeNotificationPanel();
  }
});

document.getElementById('notificationPanel').addEventListener('click', e => {
  const markAllBtn = e.target.closest('#notifMarkAll');
  if (markAllBtn) { markAllRead(); return; }

  const row = e.target.closest('.notif-row');
  if (!row) return;

  markRead(row.dataset.id);
  closeNotificationPanel();

  if (row.dataset.type === 'app-update') {
    window.location.reload();
    return;
  }

  // Navigate to relevant view
  const viewMap = {
    'new-card':     'board',
    'new-project':  'projects',
    'new-snapshot': 'snapshot',
  };
  const targetView = viewMap[row.dataset.type];
  if (targetView) {
    document.querySelector(`.nav-tab[data-view="${targetView}"]`)?.click();
  }
});
```

---

### 5. `js/firestore.js` changes

```js
import { registerOwnId, isOwnId, addNotification } from './notifications.js';

export function startFirestoreListeners({ onCardsUpdate, onArchiveUpdate }) {
  let _initialized = false;

  const unsubCards = db.collection('cards').orderBy('created', 'desc')
    .onSnapshot(snapshot => {
      if (_initialized) {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added' &&
              !change.doc.metadata.hasPendingWrites &&
              !isOwnId(change.doc.id)) {
            const card = change.doc.data();
            addNotification({
              type: 'new-card',
              title: 'Nueva tarjeta',
              body: card.title || '(sin título)',
            });
          }
        });
      }
      _initialized = true;
      setCards(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      onCardsUpdate();
      // ... rest unchanged
    }, err => { ... });
}
```

In `firestoreSaveCard`: before calling `db.collection('cards').doc(id).set(...)`, call `registerOwnId(id)`.

---

### 6. `js/projects.js` changes

Same pattern in `startProjectsListener`:

```js
import { registerOwnId, isOwnId, addNotification } from './notifications.js';

export function startProjectsListener({ onProjectsUpdate }) {
  let _initialized = false;
  return db.collection('projects').orderBy('createdAt', 'desc')
    .onSnapshot(snapshot => {
      if (_initialized) {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added' &&
              !change.doc.metadata.hasPendingWrites &&
              !isOwnId(change.doc.id)) {
            const p = change.doc.data();
            addNotification({
              type: 'new-project',
              title: 'Nuevo proyecto',
              body: `${change.doc.id} — ${p.name || ''}`,
            });
          }
        });
      }
      _initialized = true;
      // ... rest unchanged
    }, err => ...);
}
```

In `saveProject`: project `code` is the document ID and is known before the write; call `registerOwnId(data.code)` at the top of the `saveProject` function (only when `!data._isEdit`).

---

### 7. `js/snapshot.js` changes

Same pattern in `startSnapshotsListener`:

```js
import { registerOwnId, isOwnId, addNotification } from './notifications.js';

export function startSnapshotsListener({ onSnapshotsUpdate }) {
  let _initialized = false;
  return db.collection('snapshots').orderBy('createdAt', 'desc')
    .onSnapshot(snapshot => {
      if (_initialized) {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added' &&
              !change.doc.metadata.hasPendingWrites &&
              !isOwnId(change.doc.id)) {
            const s = change.doc.data();
            addNotification({
              type: 'new-snapshot',
              title: 'Nueva votación',
              body: s.title || '(sin título)',
            });
          }
        });
      }
      _initialized = true;
      // ... rest unchanged
    }, err => ...);
}
```

In `createSnapshot`: after `db.collection('snapshots').add(...)` resolves, call `registerOwnId(ref.id)`. Since `add()` returns a `DocumentReference`, this looks like:

```js
export async function createSnapshot(...) {
  const ref = await db.collection('snapshots').add({ ... });
  registerOwnId(ref.id);   // guard before the listener ACK fires
  return ref;
}
```

---

### 8. `js/auth.js` changes

On logout, call `clearNotifications()` so the bell resets between sessions:

```js
import { clearNotifications } from './notifications.js';

// In the sign-out handler, after auth.signOut():
clearNotifications();
```

---

## Implementation Order

1. `js/notifications.js` — store + badge + panel render
2. `css/notifications.css` — bell, badge, panel styles
3. `index.html` — bell button + panel container + CSS link
4. `js/app.js` — SW update detection + bell button events + import notifications
5. `js/firestore.js` — `_initialized` guard + docChanges for cards + `registerOwnId` in `firestoreSaveCard`
6. `js/projects.js` — same pattern for projects + `registerOwnId` in `saveProject`
7. `js/snapshot.js` — same pattern for snapshots + `registerOwnId` in `createSnapshot`
8. `js/auth.js` — `clearNotifications()` on logout

---

## Verification Checklist

1. Bell icon appears in the header. No badge visible on fresh load.
2. Open two tabs as different users. Tab A creates a card → Tab B sees a badge with count 1.
3. Click the bell on Tab B → panel opens showing "Nueva tarjeta / [title]".
4. Click the notification row → panel closes, navigates to Tablero.
5. Badge disappears after "Marcar todo leído".
6. Same flow works for a new project (navigates to Proyectos).
7. Same flow works for a new snapshot (navigates to Snapshot).
8. Tab A creating a card does NOT generate a notification on Tab A itself.
9. Deploy a new build (bump `CACHE_NAME` in `sw.js`). Open the old app in a tab. A new SW installs in the background. The bell shows 1 notification: "Actualización disponible". Clicking it reloads the page and loads the new version.
10. On logout, bell resets to 0 unread.
