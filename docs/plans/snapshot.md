# Plan: Snapshot — Time-Bound Voting Protocol

## Context

"Snapshot" is a new section where any authenticated user can create a time-bound voting proposal and distribute a fixed budget of Voting Power (VP) across multiple options. Key properties:

- **TimeSpan**: a countdown clock that determines when voting ends.
- **Privacy**: `public` (live results visible) or `secret` (results hidden until expiry).
- **VP Budget**: each participant gets a fixed VP allocation (e.g. 100) to distribute freely.
- **Finality**: once the timer hits zero, all inputs lock and a "frozen" resolution view shows aggregated results + a verification stamp (Snapshot ID + Timestamp of Finality).
- **Archive**: expired proposals can be archived; an "Archivados" sub-tab mirrors the Projects pattern.

The feature integrates into the existing nav-tab pattern and reuses the existing modal shell (`#modalOverlay` / `#modalContent`) for creating proposals.

---

## Architecture Decisions

### Firestore Structure

```
snapshots/{auto-id}
  title          string
  description    string
  privacy        'public' | 'secret'
  status         'active' | 'archived'
  baseVP         number          — total VP budget per participant
  timespan       number          — duration in ms
  expiresAt      string          — ISO timestamp (Date.now() + timespan at creation)
  options        Array<{ id: string, label: string }>
  createdBy      string          — user email
  createdAt      Timestamp       — Firestore server timestamp

snapshots/{auto-id}/votes/{userId}
  userName       string
  userEmail      string
  allocation     { [optionId]: number }
  totalSpent     number
  submittedAt    string          — ISO timestamp
```

- Active vs archived is determined by `status` field (not a collection move — same pattern as projects).
- Whether the snapshot is expired is determined client-side: `Date.now() >= new Date(expiresAt).getTime()`.
- Each user can submit/overwrite their vote at any time while the snapshot is active.

### Detail View Architecture

The voting workspace uses a **dedicated full-screen overlay** (`#snapshotDetailOverlay`) separate from the card modal, since it needs a sticky VP tracker, timer, allocation inputs, and a results chart. Width: 780px; wider than the card modal (680px).

### Timer

Client-side `setInterval(1000ms)` running while the detail overlay is open. On each tick, computes remaining ms and updates the DOM. On expiry: clears interval, applies `.snapshot-frozen` class, re-renders to show resolution view.

### Results Aggregation

- When the detail opens, start a Firestore `onSnapshot` listener on the `votes` subcollection. Unsubscribe when detail closes.
- If `privacy === 'public'`: render live results chart in the sidebar alongside the allocation inputs.
- If `privacy === 'secret'` AND not expired: render "🔒 Resultados Cifrados" placeholder.
- If expired (regardless of privacy): render resolution view with final aggregated results.

### VP Validation

At every input event: `balance = baseVP − Σ(allocation values)`. If `balance < 0`: apply `.vp-exceeded` class to the budget bar and disable the commit button. Commit button enabled only when `Σ ≥ 1 AND balance ≥ 0`.

---

## Files to Modify / Create

| File | Action | Summary |
|------|--------|---------|
| `js/config.js` | Modify | Add `SNAPSHOT_TIMESPAN_OPTIONS`, `SNAPSHOT_DEFAULT_VP` |
| `js/state.js` | Modify | Add `_snapshots`, `_archivedSnapshots`, `_unsubSnapshots` |
| `js/snapshot.js` | **Create** | All snapshot logic: listener, CRUD, render, detail overlay |
| `css/snapshot.css` | **Create** | All snapshot styles |
| `index.html` | Modify | Add nav tab, `#snapshotView`, `#snapshotDetailOverlay`, CSS link |
| `js/app.js` | Modify | Wire nav tab, import `renderSnapshots` |
| `js/auth.js` | Modify | Start `startSnapshotsListener` in the auth-success callback |
| `design-system/04-components.md` | Modify | Add Snapshot View section |
| `design-system/05-data-tokens.md` | Modify | Add Snapshot data fields |
| `design-system/06-screen-map.md` | Modify | Add S11, S11a, flows |

**Not modified:** `js/firestore.js`, `css/variables.css`, `firestore.rules` (add in a separate security rules pass)

---

## Step 1 — `js/config.js`: Constants

Add after the `REUSE_PROJECT_CODE_GAPS` export:

```javascript
export const SNAPSHOT_TIMESPAN_OPTIONS = [
  { label: '15 minutos',  ms: 15 * 60 * 1000 },
  { label: '30 minutos',  ms: 30 * 60 * 1000 },
  { label: '1 hora',      ms: 60 * 60 * 1000 },
  { label: '2 horas',     ms: 2 * 60 * 60 * 1000 },
  { label: '6 horas',     ms: 6 * 60 * 60 * 1000 },
  { label: '24 horas',    ms: 24 * 60 * 60 * 1000 },
  { label: '3 días',      ms: 3 * 24 * 60 * 60 * 1000 },
  { label: '7 días',      ms: 7 * 24 * 60 * 60 * 1000 },
];
export const SNAPSHOT_DEFAULT_VP = 100;
```

---

## Step 2 — `js/state.js`: Snapshot State

Add after the `_unsubProjects` block:

```javascript
let _snapshots         = [];
let _archivedSnapshots = [];
let _unsubSnapshots    = null;

export const getSnapshots          = () => _snapshots;
export const setSnapshots          = (v) => { _snapshots = v; };
export const getArchivedSnapshots  = () => _archivedSnapshots;
export const setArchivedSnapshots  = (v) => { _archivedSnapshots = v; };
export const getUnsubSnapshots     = () => _unsubSnapshots;
export const setUnsubSnapshots     = (v) => { _unsubSnapshots = v; };
```

---

## Step 3 — `index.html`: HTML Structure

### 3a — Nav tab (in the nav tabs list alongside "Proyectos"):

```html
<button class="nav-tab" data-view="snapshot">Snapshot</button>
```

### 3b — View container (after `#projectsView`):

```html
<div id="snapshotView" class="snapshot-view"></div>
```

### 3c — Detail overlay (before closing `</body>`):

```html
<div class="snapshot-detail-overlay" id="snapshotDetailOverlay">
  <div class="snapshot-detail-window" id="snapshotDetailWindow">
    <!-- content injected by JS -->
  </div>
</div>
```

### 3d — CSS link (in `<head>`, after `projects.css`):

```html
<link rel="stylesheet" href="css/snapshot.css">
```

---

## Step 4 — `js/snapshot.js`: Module State + Listener + CRUD

```javascript
/* Bitnova Kanban — snapshot: time-bound voting protocol */

import { db } from './firebase.js';
import {
  getSnapshots, setSnapshots,
  getArchivedSnapshots, setArchivedSnapshots,
  getCurrentUser,
} from './state.js';
import { escHtml, toast } from './ui.js';
import { SNAPSHOT_TIMESPAN_OPTIONS, SNAPSHOT_DEFAULT_VP } from './config.js';

// ====== MODULE STATE ======
let _snapshotsTab        = 'active';   // 'active' | 'archived'
let _detailSnapshotId    = null;       // ID of the currently open detail
let _localAllocation     = {};         // { [optionId]: number } — live draft VP
let _countdownInterval   = null;       // setInterval ID for the open detail timer
let _votesUnsub          = null;       // Firestore listener for votes subcollection
let _cachedVotes         = [];         // latest vote docs for the open detail

// ====== LISTENER ======

export function startSnapshotsListener({ onSnapshotsUpdate }) {
  return db.collection('snapshots')
    .orderBy('createdAt', 'desc')
    .onSnapshot(snapshot => {
      const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setSnapshots(all.filter(s => s.status !== 'archived'));
      setArchivedSnapshots(all.filter(s => s.status === 'archived'));
      onSnapshotsUpdate();
    }, err => console.error('Firestore snapshots error:', err));
}

// ====== CRUD ======

export async function createSnapshot({ title, description, privacy, baseVP, timespan, options }) {
  const user = getCurrentUser();
  return db.collection('snapshots').add({
    title,
    description,
    privacy,
    status: 'active',
    baseVP,
    timespan,
    expiresAt: new Date(Date.now() + timespan).toISOString(),
    options,
    createdBy: user?.email ?? '',
    createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
  });
}

export async function archiveSnapshot(id) {
  return db.collection('snapshots').doc(id).update({ status: 'archived' });
}

export async function submitVote(snapshotId, allocation) {
  const user = getCurrentUser();
  const totalSpent = Object.values(allocation).reduce((s, v) => s + (Number(v) || 0), 0);
  return db.collection('snapshots').doc(snapshotId)
    .collection('votes').doc(user.uid).set({
      userName:   user.displayName || user.email || 'unknown',
      userEmail:  user.email,
      allocation,
      totalSpent,
      submittedAt: new Date().toISOString(),
    });
}
```

---

## Step 5 — `js/snapshot.js`: List View Render

```javascript
// ====== RENDER (list view) ======

export function renderSnapshots() {
  const view = document.getElementById('snapshotView');
  if (!view) return;
  if (_snapshotsTab === 'archived') {
    _renderArchivedSnapshotsView(view);
  } else {
    _renderActiveSnapshotsView(view);
  }
}

function _renderActiveSnapshotsView(view) {
  const snapshots = getSnapshots();
  view.innerHTML = `
    ${_renderSnapshotsHeaderBar()}
    <div class="snapshot-list-wrapper">
      ${snapshots.length ? _renderSnapshotListTableHTML(snapshots) : _renderSnapshotsEmptyHTML('active')}
    </div>
  `;
}

function _renderArchivedSnapshotsView(view) {
  const archived = getArchivedSnapshots();
  view.innerHTML = `
    ${_renderSnapshotsHeaderBar()}
    <div class="snapshot-list-wrapper">
      ${archived.length ? _renderArchivedSnapshotListTableHTML(archived) : _renderSnapshotsEmptyHTML('archived')}
    </div>
  `;
}

function _renderSnapshotsHeaderBar() {
  const activeCount   = getSnapshots().length;
  const archivedCount = getArchivedSnapshots().length;
  const isActive      = _snapshotsTab === 'active';
  return `
    <div class="snapshot-header-bar">
      <div style="display:flex;align-items:center;gap:12px">
        <h2>Snapshot</h2>
        <div class="snapshot-tab-toggle">
          <button class="snapshot-tab-btn${isActive ? ' active' : ''}"
            onclick="switchSnapshotsTab('active')">
            Activas<span class="tab-count">${activeCount}</span>
          </button>
          <button class="snapshot-tab-btn${!isActive ? ' active' : ''}"
            onclick="switchSnapshotsTab('archived')">
            Archivadas<span class="tab-count">${archivedCount}</span>
          </button>
        </div>
      </div>
      ${isActive ? `
      <button class="btn btn-primary" onclick="openNewSnapshotModal()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
        Nueva Propuesta
      </button>
      ` : ''}
    </div>
  `;
}
```

### Active list table columns

| Column | Content |
|--------|---------|
| Título | clickable → `openSnapshotDetail(id)` |
| Privacidad | `.snapshot-privacy-badge.public` / `.secret` |
| Tiempo restante | `.snapshot-countdown` — live-ticking (see timer section) |
| VP Base | monospace number |
| Opciones | count badge |
| Creado por | plain text |
| Acciones | archive icon button (amber hover) |

### Archived list table columns

| Column | Content |
|--------|---------|
| Título | clickable → `openSnapshotDetail(id)` (read-only / results mode) |
| Privacidad | badge |
| Finalizó | ISO date formatted |
| VP Base | monospace |
| Creado por | plain text |

---

## Step 6 — `js/snapshot.js`: Detail Overlay

```javascript
// ====== DETAIL OVERLAY ======

window.openSnapshotDetail = async function(id) {
  _detailSnapshotId = id;
  _localAllocation  = {};

  const snap       = [...getSnapshots(), ...getArchivedSnapshots()].find(s => s.id === id);
  if (!snap) return;

  const user    = getCurrentUser();
  const overlay = document.getElementById('snapshotDetailOverlay');
  const win     = document.getElementById('snapshotDetailWindow');

  // Fetch user's existing vote (if any)
  let myVote = null;
  try {
    const voteDoc = await db.collection('snapshots').doc(id)
      .collection('votes').doc(user.uid).get();
    if (voteDoc.exists) {
      myVote = voteDoc.data();
      _localAllocation = { ...myVote.allocation };
    }
  } catch { /* ignore */ }

  win.innerHTML = _buildDetailHTML(snap, myVote);
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Start timer if not expired
  const isExpired = Date.now() >= new Date(snap.expiresAt).getTime();
  if (!isExpired) {
    _startDetailTimer(snap.expiresAt, snap.id);
  } else {
    _applyFinalityState(id);
  }

  // Start votes listener
  _startVotesListener(id, snap);
};

window.closeSnapshotDetail = function() {
  _stopDetailTimer();
  if (_votesUnsub) { _votesUnsub(); _votesUnsub = null; }
  document.getElementById('snapshotDetailOverlay').classList.remove('active');
  document.getElementById('snapshotDetailWindow').innerHTML = '';
  document.body.style.overflow = '';
  _detailSnapshotId  = null;
  _localAllocation   = {};
  _cachedVotes       = [];
};
```

### Detail HTML structure

```
┌─────────────────────────────────────────────────────────┐
│  [← Cerrar]            [🔒 SECRET] or [👁 PUBLIC]       │
│                                                          │
│  PROPOSAL TITLE                                          │
│  description text…                                       │
│                                                          │
│  ┌─ VP TRACKER (sticky glass) ──────────────────────┐   │
│  │  Tu Voting Power: [42] / [100]  ████████░░░░░░░  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ╔══════════════╗   ╔══════════════════════════════╗    │
│  ║  COUNTDOWN   ║   ║  RESULTS / ENCRYPTED         ║    │
│  ║  01:23:45    ║   ║  (sidebar, public only)       ║    │
│  ╚══════════════╝   ╚══════════════════════════════╝    │
│                                                          │
│  OPTIONS                                                 │
│  ┌───────────────────────────────┐                       │
│  │ Option A    [──────────] [42] │                       │
│  │ Option B    [──────────] [58] │                       │
│  └───────────────────────────────┘                       │
│                                                          │
│  [Commit Snapshot ▶]  (disabled until ≥ 1 VP allocated) │
└─────────────────────────────────────────────────────────┘
```

After expiry (finality state):
```
┌─────────────────────────────────────────────────────────┐
│  ⚡ SNAPSHOT FINALIZADO                                  │
│  Snapshot ID: xK9mN2pQrT4vWzAb                          │
│  Timestamp of Finality: 2026-04-09T18:00:00.000Z        │
│                                                          │
│  RESULTADOS FINALES                                      │
│  Option A  [████████████████░░░░░░░░] 65.2%  (65 VP)   │
│  Option B  [████████░░░░░░░░░░░░░░░░] 34.8%  (34 VP)   │
│                                                          │
│  Total votos: 8 participantes · 342 VP totales           │
└─────────────────────────────────────────────────────────┘
```

---

## Step 7 — `js/snapshot.js`: Timer

```javascript
// ====== TIMER ======

function _startDetailTimer(expiresAt, snapshotId) {
  _stopDetailTimer();
  _countdownInterval = setInterval(() => {
    const remaining = new Date(expiresAt).getTime() - Date.now();
    const el = document.getElementById('snapshotCountdown');
    if (!el) { _stopDetailTimer(); return; }

    if (remaining <= 0) {
      _stopDetailTimer();
      _triggerFinality(snapshotId);
      return;
    }

    el.textContent = _formatCountdown(remaining);
    el.className   = 'snapshot-countdown ' + _getCountdownClass(remaining, expiresAt);
  }, 1000);
}

function _stopDetailTimer() {
  if (_countdownInterval) { clearInterval(_countdownInterval); _countdownInterval = null; }
}

function _formatCountdown(ms) {
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (d > 0) return `${d}d ${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function _getCountdownClass(remainingMs, expiresAt) {
  // Determine % of original timespan remaining
  const snap  = [...getSnapshots(), ...getArchivedSnapshots()].find(s => s.id === _detailSnapshotId);
  const total = snap?.timespan ?? 1;
  const pct   = remainingMs / total;
  if (pct > 0.5)  return 'emerald';
  if (pct > 0.10) return 'amber';
  return 'rose pulse';
}

function _triggerFinality(snapshotId) {
  // Flash animation then apply frozen state
  const win = document.getElementById('snapshotDetailWindow');
  if (win) win.classList.add('snapshot-flash');
  setTimeout(() => {
    if (win) win.classList.remove('snapshot-flash');
    _applyFinalityState(snapshotId);
  }, 800);
}

function _applyFinalityState(snapshotId) {
  const snap = [...getSnapshots(), ...getArchivedSnapshots()].find(s => s.id === snapshotId);
  if (!snap) return;
  const resultsEl = document.getElementById('snapshotResultsPanel');
  const workspaceEl = document.getElementById('snapshotWorkspace');
  if (workspaceEl) workspaceEl.classList.add('snapshot-frozen');
  if (resultsEl) resultsEl.innerHTML = _buildResultsHTML(snap, _cachedVotes);
}
```

---

## Step 8 — `js/snapshot.js`: VP Allocation Logic

```javascript
// ====== VP ALLOCATION ======

window.updateSnapshotAllocation = function(optionId, rawValue) {
  const value = Math.max(0, Math.floor(Number(rawValue) || 0));
  _localAllocation[optionId] = value;
  _refreshVPTracker();
};

function _refreshVPTracker() {
  const snap = [...getSnapshots(), ...getArchivedSnapshots()].find(s => s.id === _detailSnapshotId);
  if (!snap) return;

  const spent   = Object.values(_localAllocation).reduce((s, v) => s + v, 0);
  const balance = snap.baseVP - spent;
  const pct     = Math.min(100, (spent / snap.baseVP) * 100);

  const balanceEl = document.getElementById('snapshotVPBalance');
  const barEl     = document.getElementById('snapshotVPBar');
  const commitBtn = document.getElementById('snapshotCommitBtn');

  if (balanceEl) balanceEl.textContent = balance;
  if (barEl) {
    barEl.style.width = pct + '%';
    barEl.className = 'snapshot-vp-bar-fill' + (balance < 0 ? ' exceeded' : '');
  }
  if (commitBtn) commitBtn.disabled = (spent < 1 || balance < 0);
}

window.commitSnapshotVote = async function(snapshotId) {
  const btn = document.getElementById('snapshotCommitBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Registrando…'; }
  try {
    await submitVote(snapshotId, { ..._localAllocation });
    toast('✅ Voto registrado');
    if (btn) { btn.disabled = false; btn.textContent = 'Commit Snapshot ▶'; }
  } catch {
    toast('❌ Error al registrar. Intentá de nuevo.');
    if (btn) { btn.disabled = false; btn.textContent = 'Commit Snapshot ▶'; }
  }
};
```

---

## Step 9 — `js/snapshot.js`: Results & Votes Listener

```javascript
// ====== VOTES LISTENER + RESULTS ======

function _startVotesListener(snapshotId, snap) {
  if (_votesUnsub) { _votesUnsub(); _votesUnsub = null; }
  _votesUnsub = db.collection('snapshots').doc(snapshotId)
    .collection('votes')
    .onSnapshot(vsSnap => {
      _cachedVotes = vsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const isExpired = Date.now() >= new Date(snap.expiresAt).getTime();
      const showResults = snap.privacy === 'public' || isExpired;
      const resultsEl = document.getElementById('snapshotResultsPanel');
      if (resultsEl && showResults) {
        resultsEl.innerHTML = _buildResultsHTML(snap, _cachedVotes);
      }
    }, err => console.error('Votes listener error:', err));
}

function _buildResultsHTML(snap, votes) {
  if (!votes.length) {
    return `<p style="color:var(--text-muted);font-size:12px;text-align:center;padding:24px 0">Sin votos aún.</p>`;
  }

  const totals = {};
  snap.options.forEach(o => { totals[o.id] = 0; });
  votes.forEach(v => {
    Object.entries(v.allocation || {}).forEach(([oid, vp]) => {
      if (totals[oid] !== undefined) totals[oid] += Number(vp) || 0;
    });
  });

  const grandTotal = Object.values(totals).reduce((s, v) => s + v, 0);
  const isExpired  = Date.now() >= new Date(snap.expiresAt).getTime();

  const bars = snap.options.map(o => {
    const vp  = totals[o.id] || 0;
    const pct = grandTotal > 0 ? ((vp / grandTotal) * 100).toFixed(1) : '0.0';
    return `
      <div class="snapshot-result-row">
        <div class="snapshot-result-label">${escHtml(o.label)}</div>
        <div class="snapshot-result-bar-track">
          <div class="snapshot-result-bar-fill" style="width:${pct}%"></div>
        </div>
        <div class="snapshot-result-meta">
          <span class="snapshot-result-pct">${pct}%</span>
          <span class="snapshot-result-vp">${vp} VP</span>
        </div>
      </div>
    `;
  }).join('');

  const stampHTML = isExpired ? `
    <div class="snapshot-stamp">
      <div class="snapshot-stamp-row">
        <span class="snapshot-stamp-label">Snapshot ID</span>
        <span class="snapshot-stamp-value">${escHtml(snap.id)}</span>
      </div>
      <div class="snapshot-stamp-row">
        <span class="snapshot-stamp-label">Timestamp of Finality</span>
        <span class="snapshot-stamp-value">${escHtml(snap.expiresAt)}</span>
      </div>
      <div class="snapshot-stamp-row">
        <span class="snapshot-stamp-label">Participantes</span>
        <span class="snapshot-stamp-value">${votes.length}</span>
      </div>
      <div class="snapshot-stamp-row">
        <span class="snapshot-stamp-label">VP Total Gastado</span>
        <span class="snapshot-stamp-value">${grandTotal}</span>
      </div>
    </div>
  ` : '';

  return bars + stampHTML;
}
```

---

## Step 10 — `js/snapshot.js`: Create Modal

Reuses `#modalOverlay` / `#modalContent`. Options are built dynamically.

```javascript
// ====== CREATE MODAL ======

window.openNewSnapshotModal = function() {
  _snapshotOptionDraft = [
    { id: 'opt_' + Date.now() + '_0', label: '' },
    { id: 'opt_' + Date.now() + '_1', label: '' },
  ];
  _renderSnapshotFormModal();
};

let _snapshotOptionDraft = [];

function _renderSnapshotFormModal() {
  const overlay  = document.getElementById('modalOverlay');
  const content  = document.getElementById('modalContent');
  const tsOpts   = SNAPSHOT_TIMESPAN_OPTIONS.map((t, i) =>
    `<option value="${t.ms}"${i === 2 ? ' selected' : ''}>${escHtml(t.label)}</option>`
  ).join('');

  const optRows = _snapshotOptionDraft.map((o, i) => `
    <div class="snapshot-option-row" data-idx="${i}">
      <input class="modal-input" placeholder="Opción ${i + 1}" value="${escHtml(o.label)}"
        oninput="_updateSnapshotOptionLabel(${i}, this.value)">
      ${_snapshotOptionDraft.length > 2 ? `
        <button class="snapshot-option-remove-btn" onclick="removeSnapshotOption(${i})">✕</button>
      ` : ''}
    </div>
  `).join('');

  content.innerHTML = `
    <div class="modal-header">
      <h2>Nueva Propuesta Snapshot</h2>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <div class="modal-section-title" style="margin-bottom:8px">Título *</div>
      <input class="modal-input" id="sf-title" placeholder="Título de la propuesta" maxlength="120">

      <div class="modal-section-title" style="margin:16px 0 8px">Descripción</div>
      <textarea class="modal-input" id="sf-desc" placeholder="Describe el contexto de esta decisión…" rows="2"></textarea>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:16px">
        <div>
          <div class="modal-section-title" style="margin-bottom:8px">Duración *</div>
          <select class="modal-input" id="sf-timespan">${tsOpts}</select>
        </div>
        <div>
          <div class="modal-section-title" style="margin-bottom:8px">VP por participante</div>
          <input class="modal-input" id="sf-basevp" type="number" value="${SNAPSHOT_DEFAULT_VP}" min="1" max="10000">
        </div>
      </div>

      <div style="margin-top:16px">
        <div class="modal-section-title" style="margin-bottom:8px">Privacidad</div>
        <div style="display:flex;gap:8px">
          <button class="snapshot-privacy-pill active" data-privacy="public"
            onclick="selectSnapshotPrivacy(this,'public')">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            Pública
          </button>
          <button class="snapshot-privacy-pill" data-privacy="secret"
            onclick="selectSnapshotPrivacy(this,'secret')">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            Secreta
          </button>
        </div>
      </div>

      <div style="margin-top:20px">
        <div class="modal-section-title" style="margin-bottom:8px">Opciones (mínimo 2) *</div>
        <div id="snapshotOptionsContainer">${optRows}</div>
        <button class="snapshot-add-option-btn" onclick="addSnapshotOption()">
          + Agregar opción
        </button>
      </div>

      <div id="sf-error" style="display:none;margin-top:12px;padding:8px 12px;
        background:rgba(244,63,94,0.10);border-radius:var(--radius-sm);
        color:var(--accent-rose);font-size:12px"></div>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">Cancelar</button>
      <button class="btn btn-primary" onclick="saveSnapshotFromModal()">Crear Snapshot</button>
    </div>
  `;
  overlay.classList.add('active');
}

window._updateSnapshotOptionLabel = function(idx, val) {
  if (_snapshotOptionDraft[idx]) _snapshotOptionDraft[idx].label = val;
};

window.addSnapshotOption = function() {
  _snapshotOptionDraft.push({ id: 'opt_' + Date.now(), label: '' });
  _renderSnapshotFormModal();
};

window.removeSnapshotOption = function(idx) {
  _snapshotOptionDraft.splice(idx, 1);
  _renderSnapshotFormModal();
};

window.selectSnapshotPrivacy = function(btn, value) {
  document.querySelectorAll('.snapshot-privacy-pill').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
};

window.saveSnapshotFromModal = async function() {
  const title     = document.getElementById('sf-title').value.trim();
  const desc      = document.getElementById('sf-desc').value.trim();
  const timespan  = parseInt(document.getElementById('sf-timespan').value, 10);
  const baseVP    = parseInt(document.getElementById('sf-basevp').value, 10) || SNAPSHOT_DEFAULT_VP;
  const privacyBtn = document.querySelector('.snapshot-privacy-pill.active');
  const privacy   = privacyBtn?.dataset.privacy || 'public';
  const errEl     = document.getElementById('sf-error');

  errEl.style.display = 'none';

  if (!title) { errEl.textContent = 'El título es obligatorio.'; errEl.style.display = ''; return; }
  const validOpts = _snapshotOptionDraft.filter(o => o.label.trim());
  if (validOpts.length < 2) { errEl.textContent = 'Se necesitan al menos 2 opciones con nombre.'; errEl.style.display = ''; return; }

  const saveBtn = document.querySelector('.modal-footer .btn-primary');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Creando…'; }

  try {
    await createSnapshot({
      title, description: desc, privacy, baseVP, timespan,
      options: validOpts.map(o => ({ id: o.id, label: o.label.trim() })),
    });
    closeModal();
    toast('✅ Snapshot creado');
  } catch {
    if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = 'Crear Snapshot'; }
    errEl.textContent = 'Error al crear. Intentá de nuevo.';
    errEl.style.display = '';
  }
};
```

---

## Step 11 — `js/snapshot.js`: Archive + Tab Switch

```javascript
// ====== ARCHIVE ======

window.confirmArchiveSnapshot = function(id) {
  const snap = getSnapshots().find(s => s.id === id);
  const overlay = document.getElementById('modalOverlay');
  const content = document.getElementById('modalContent');
  content.innerHTML = `
    <div class="modal-header">
      <h2>Archivar Snapshot</h2>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <p style="color:var(--text-secondary)">
        ¿Archivar "<strong>${escHtml(snap?.title || id)}</strong>"?
        Permanecerá visible en la pestaña Archivadas.
      </p>
    </div>
    <div class="modal-footer">
      <button class="btn" onclick="closeModal()">Cancelar</button>
      <button class="btn" style="background:rgba(245,158,11,0.15);border-color:rgba(245,158,11,0.4);color:var(--accent-amber)"
        onclick="executeArchiveSnapshot('${escHtml(id)}')">Archivar</button>
    </div>
  `;
  overlay.classList.add('active');
};

window.executeArchiveSnapshot = async function(id) {
  try {
    await archiveSnapshot(id);
    closeModal();
    toast('📦 Snapshot archivado');
  } catch {
    toast('❌ Error al archivar. Intentá de nuevo.');
  }
};

window.switchSnapshotsTab = function(tab) {
  _snapshotsTab = tab;
  renderSnapshots();
};
```

---

## Step 12 — `js/app.js`: Wire Nav Tab

Add import:
```javascript
import { renderSnapshots } from './snapshot.js';
```

In the nav tab click handler, add a new else-if branch:
```javascript
document.getElementById('snapshotView').classList.remove('active');
// … inside the if/else chain:
} else if (currentView === 'snapshot') {
  document.getElementById('snapshotView').classList.add('active');
  renderSnapshots();
}
```

Also add `document.getElementById('snapshotView').classList.remove('active');` to the "hide all" block.

---

## Step 13 — `js/auth.js`: Start Listener

In the `onAuthStateChanged` success callback, alongside `startProjectsListener`, add:

```javascript
import { startSnapshotsListener } from './snapshot.js';
import { setUnsubSnapshots, getUnsubSnapshots } from './state.js';

// In login success:
const unsubSnap = startSnapshotsListener({ onSnapshotsUpdate: renderSnapshots });
setUnsubSnapshots(unsubSnap);

// In logout / cleanup (alongside projects unsub):
const unsubSnap = getUnsubSnapshots();
if (unsubSnap) { unsubSnap(); setUnsubSnapshots(null); }
```

---

## Step 14 — `css/snapshot.css`: All Styles

Full file content — mirrors the depth, structure, and token usage of `projects.css`.

**Sections:**
1. View container (`.snapshot-view`)
2. Header bar + tab toggle (reuses `.projects-tab-toggle` pattern)
3. List table wrapper + table (`.snapshot-list-wrapper`, `.snapshot-table`)
4. Privacy badges (`.snapshot-privacy-badge.public` / `.secret`)
5. Countdown in list (`.snapshot-countdown.emerald` / `.amber` / `.rose` / `.pulse`)
6. Detail overlay (`.snapshot-detail-overlay`, `.snapshot-detail-window`)
7. Detail header
8. VP Tracker — glassmorphism sticky bar (`.snapshot-vp-tracker`)
9. VP bar (`.snapshot-vp-bar-track`, `.snapshot-vp-bar-fill`, `.exceeded`)
10. Option cards (`.snapshot-option-card`, allocation input, weight display)
11. Commit button (`.snapshot-commit-btn`)
12. Results panel (`.snapshot-results-panel`)
13. Result bars (`.snapshot-result-row`, `.snapshot-result-bar-track`, `.snapshot-result-bar-fill`)
14. Verification stamp (`.snapshot-stamp`, `.snapshot-stamp-row`, `.snapshot-stamp-label`, `.snapshot-stamp-value`)
15. Encrypted placeholder (`.snapshot-encrypted-placeholder`)
16. Frozen state (`.snapshot-frozen`)
17. Flash animation (`@keyframes snapshot-flash`)
18. Empty state
19. Create modal helpers (`.snapshot-option-row`, `.snapshot-add-option-btn`, `.snapshot-privacy-pill`)

---

## CSS Token Reference

All colors use existing tokens. No new CSS variables needed.

| UI element | Token(s) |
|------------|---------|
| VP tracker border | `rgba(6,182,212,0.20)` (cyan) |
| VP bar fill | `var(--accent-cyan)` |
| VP bar exceeded | `var(--accent-rose)` |
| Countdown emerald | `var(--accent-emerald)` |
| Countdown amber | `var(--accent-amber)` |
| Countdown rose | `var(--accent-rose)` |
| Privacy badge: public | `rgba(6,182,212,0.12)` bg + `rgba(6,182,212,0.25)` border + `--accent-cyan` |
| Privacy badge: secret | `rgba(245,158,11,0.12)` bg + `rgba(245,158,11,0.25)` border + `--accent-amber` |
| Result bar fill | `var(--accent-cyan)` |
| Frozen border glow | `rgba(6,182,212,0.15)` |
| Stamp bg | `var(--bg-deep)` |
| Stamp border | `rgba(6,182,212,0.15)` |

---

## Implementation Order

1. `js/config.js` — constants
2. `js/state.js` — snapshot state
3. `index.html` — nav tab, view div, detail overlay, CSS link
4. `js/snapshot.js` — listener + CRUD (Steps 4–11)
5. `css/snapshot.css` — all styles
6. `js/app.js` — wire nav tab
7. `js/auth.js` — start/stop listener
8. Design system updates (04, 05, 06)

---

## Verification

1. Nav tab "Snapshot" appears; clicking it renders the list view.
2. "Nueva Propuesta" opens the create modal; at least 2 options required; form validates.
3. Created snapshot appears in the Activas tab with a live countdown.
4. Countdown color is emerald → amber → rose as time decreases.
5. Opening a snapshot detail shows the VP tracker and option allocation inputs.
6. Allocating VP: balance updates in real-time; "Commit Snapshot ▶" enabled only when ≥ 1 VP and not exceeded.
7. Exceeding VP budget: bar turns rose, commit button disabled, "Budget Exceeded" indicated.
8. Submitting a vote: toast confirms; re-opening the detail pre-fills previous allocation.
9. PUBLIC mode: results chart visible in real-time as others vote.
10. SECRET mode: "🔒 Resultados Cifrados" shown instead of chart until expiry.
11. On expiry: flash animation fires, inputs lock, resolution view appears with Snapshot ID + Timestamp.
12. Archive button on list row opens confirmation; confirmed snapshot moves to Archivadas tab.
13. Archived snapshots are readable (results still visible) but all inputs disabled.
14. Firestore: `snapshots/{id}` has all fields; `snapshots/{id}/votes/{uid}` has allocation per user.
