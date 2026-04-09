# Plan: Project Archiving

## Context
Projects currently support creation, editing, and deletion. The user wants to archive projects (with a reason) instead of permanently deleting them, view archived projects in a dedicated panel within the Projects View, and restore them. The selection bar (shown when rows are checked) needs an "Archivar" button alongside the existing "Eliminar" button. Each row in the active table also gets a per-row archive icon button.

The feature mirrors the existing card-archive pattern but keeps a simpler approach: instead of moving to a separate Firestore collection, projects stay in `projects/{code}` with an `archived: true` flag + metadata fields. This is simpler to restore (a single `update()`), preserves the stable code-based document ID, and avoids needing a composite index.

---

## Architecture Decision: Same Collection + `archived` Flag

Cards use a separate `archivedCards` collection (because cards move between collections on archive/restore, requiring a batch copy+delete to change the document ID namespace). Projects use their code as a stable document ID — no need to move them. A simple field update is enough.

The Firestore listener receives all docs; state splits them at the JS layer.

---

## Files to Modify

| File | Changes |
|------|---------|
| `js/state.js` | Add `_archivedProjects` array + getter/setter |
| `js/projects.js` | Split listener, archive/restore CRUD, updated render, archived table, confirmation modal |
| `css/projects.css` | Tab toggle, reason badges, archive/restore row buttons |
| `design-system/04-components.md` | Update Projects View section |
| `design-system/05-data-tokens.md` | Add project archive fields |
| `design-system/06-screen-map.md` | Update S10 |

**Not modified:** `js/firestore.js`, `js/auth.js`, `index.html`, `css/variables.css`

---

## Step 1 — `js/state.js`

Add after the existing `_projects` block:

```javascript
let _archivedProjects = [];
export const getArchivedProjects = () => _archivedProjects;
export const setArchivedProjects = (v) => { _archivedProjects = v; };
```

---

## Step 2 — `js/projects.js`: Listener Split

Update `startProjectsListener` to import `setArchivedProjects` from `./state.js` and split on `archived` flag:

```javascript
import { getProjects, setProjects, getArchivedProjects, setArchivedProjects, ... } from './state.js';

export function startProjectsListener({ onProjectsUpdate }) {
  return db.collection('projects')
    .orderBy('createdAt', 'desc')
    .onSnapshot(snapshot => {
      const all = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setProjects(all.filter(p => !p.archived));
      setArchivedProjects(all.filter(p => p.archived));
      onProjectsUpdate();
    }, err => console.error('Firestore projects error:', err));
}
```

---

## Step 3 — `js/projects.js`: New CRUD Functions

Add after `batchDeleteProjects`:

```javascript
// Archive one project
export async function archiveProject(code, reason) {
  const user = getCurrentUser();
  return db.collection('projects').doc(code).update({
    archived: true,
    archivedAt: new Date().toISOString(),
    archivedBy: user?.displayName || user?.email || 'unknown',
    archiveReason: reason,
  });
}

// Batch archive
export async function batchArchiveProjects(codes, reason) {
  const user = getCurrentUser();
  const batch = db.batch();
  const meta = {
    archived: true,
    archivedAt: new Date().toISOString(),
    archivedBy: user?.displayName || user?.email || 'unknown',
    archiveReason: reason,
  };
  codes.forEach(code => batch.update(db.collection('projects').doc(code), meta));
  return batch.commit();
}

// Restore project (remove archive metadata)
export async function restoreProject(code) {
  return db.collection('projects').doc(code).update({
    archived: false,
    archivedAt: window.firebase.firestore.FieldValue.delete(),
    archivedBy: window.firebase.firestore.FieldValue.delete(),
    archiveReason: window.firebase.firestore.FieldValue.delete(),
  });
}
```

---

## Step 4 — `js/projects.js`: View Toggle State & Render

Add module-level tab state (alongside existing `_projectSearch` and `_selectedCodes`):

```javascript
let _projectsTab = 'active'; // 'active' | 'archived'
```

Update `renderProjects()` to branch on `_projectsTab`:
- If `'active'` → current flow (active projects table + selection bar)
- If `'archived'` → archived projects table (no selection bar)

Both branches share the header bar with the tab toggle.

### Header bar update

The header bar (`renderProjectsHeaderBar`) gains a tab toggle pill group between the title and the export buttons:

```
[Activos  N]  [Archivados  N]
```

Clicking a pill sets `_projectsTab` and calls `renderProjects()`.

Active tab exports (CSV/JSON) and "Nuevo Proyecto" button only visible when `_projectsTab === 'active'`.

---

## Step 5 — `js/projects.js`: Active Table — Per-Row Archive Button

In `renderProjectRowHTML`, expand `.col-action` to hold two icon buttons:

1. **Existing:** `.project-link-btn` — create card (title: "Crear tarjeta para este proyecto")
2. **New:** `.project-archive-btn` — archive project (title: "Archivar proyecto"), calls `confirmArchiveProjects(['${code}'])`

Column class `.col-action` width needs to expand from `44px` → `80px` in CSS to fit two 28×28 buttons with a gap.

---

## Step 6 — `js/projects.js`: Selection Bar — Archive Button

In the selection bar HTML (rendered inside `renderProjects`), add "Archivar seleccionados" between "Deseleccionar todo" and "Eliminar seleccionados":

```html
<button class="btn"
  style="background:rgba(245,158,11,0.08);border-color:rgba(245,158,11,0.25);color:var(--accent-amber)"
  onclick="confirmArchiveProjects([...window._projectsSelCodes])">
  Archivar seleccionados
</button>
```

(Uses amber tint — same semantic as "warning/archive" used elsewhere in the design system.)

---

## Step 7 — `js/projects.js`: Archive Confirmation Modal

New `window.confirmArchiveProjects(codes)` function — renders into the existing `#modalOverlay` / `#modalContent` shell:

```
┌─────────────────────────────────┐
│  Archivar proyectos             │
├─────────────────────────────────┤
│  ¿Archivar N proyecto(s)?       │
│  · [BL26-01] — Nombre           │
│                                 │
│  Motivo  [ Completado ] [ Cancelado ]  ← required pill toggle
└────────────────────┬────────────┘
              Cancelar  Archivar →
```

- Reason pill toggle: `data-reason="completed"` / `data-reason="cancelled"` stored in `modalContent.dataset.archiveReason`
- "Archivar" button disabled until a reason is selected
- On confirm → calls `batchArchiveProjects(codes, reason)` → clears `_selectedCodes` → `closeModal()` → `toast()`

---

## Step 8 — `js/projects.js`: Archived Projects Table

`renderArchivedProjectsTableHTML(projects)` — new function. Columns:

| Column | Content |
|--------|---------|
| Código | `.project-code-badge` |
| Nombre | `.project-name-cell` |
| Tipo | `.project-type-badge` |
| Motivo | `.project-archive-reason.completed` / `.cancelled` badge |
| Archivado por | plain text |
| Fecha | `font-family: var(--font-mono)` |
| — | Restore button (`.btn-restore-project`) per row |

No checkboxes on archived tab — per-row restore only.
Empty state: same `.projects-empty` component, different message.

`window.restoreProjectAction(code)` → calls `restoreProject(code)` → `toast()`.

---

## Step 9 — `css/projects.css`: New Classes

```css
/* Tab toggle */
.projects-tab-toggle {
  display: flex;
  gap: 4px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 3px;
}
.projects-tab-btn {
  font: 500 12px var(--font-sans);
  padding: 4px 12px;
  border-radius: calc(var(--radius-sm) - 1px);
  border: none;
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
  transition: var(--transition-fast);
}
.projects-tab-btn .tab-count {
  font-family: var(--font-mono);
  font-size: 10px;
  margin-left: 5px;
  color: var(--text-muted);
}
.projects-tab-btn.active {
  background: var(--bg-elevated);
  color: var(--text-primary);
}
.projects-tab-btn.active .tab-count { color: var(--text-secondary); }

/* Archive reason badge (in archived table) */
.project-archive-reason {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font: 600 10px var(--font-sans);
  letter-spacing: 0.3px;
}
.project-archive-reason.completed {
  background: rgba(16,185,129,0.15);
  color: var(--accent-emerald);
}
.project-archive-reason.cancelled {
  background: rgba(244,63,94,0.15);
  color: var(--accent-rose);
}

/* Per-row archive button */
.project-archive-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; padding: 0;
  background: none;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  cursor: pointer;
  transition: var(--transition-fast);
}
.project-archive-btn:hover {
  color: var(--accent-amber);
  border-color: rgba(245,158,11,0.3);
  background: rgba(245,158,11,0.08);
}

/* Restore button */
.btn-restore-project {
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(16,185,129,0.25);
  background: rgba(16,185,129,0.08);
  color: var(--accent-emerald);
  font: 500 11px var(--font-sans);
  cursor: pointer;
  transition: var(--transition-fast);
}
.btn-restore-project:hover {
  background: rgba(16,185,129,0.18);
  border-color: rgba(16,185,129,0.5);
}

/* Expand action column to fit 2 buttons */
.projects-table .col-action { width: 80px; }
```

---

## Step 10 — Design System Update

### `04-components.md` — Projects View section
- Document `.projects-tab-toggle` / `.projects-tab-btn` (pill toggle)
- Document `.project-archive-btn` (per-row archive button, amber hover)
- Document `.btn-restore-project` (emerald tint)
- Document `.project-archive-reason.completed` / `.cancelled` badges
- Update `.col-action` width to 80px
- Document archived projects table columns
- Document archive confirmation modal (reason picker pills)

### `05-data-tokens.md` — Project archive fields
Add under the Projects Code Format section:

**Archive fields (added on archive, deleted on restore):**
| Field | Type | Value |
|-------|------|-------|
| `archived` | boolean | `true` |
| `archivedAt` | string | ISO timestamp |
| `archivedBy` | string | user displayName or email |
| `archiveReason` | string | `'completed'` \| `'cancelled'` |

Archive reason display labels and colors:
| Value | Label | Style |
|-------|-------|-------|
| `completed` | Completado | emerald (rgba 16,185,129) |
| `cancelled` | Cancelado | rose (rgba 244,63,94) |

### `06-screen-map.md` — S10 update
- Add tab toggle to the view description
- Document archived projects table columns
- Add archive and restore flows

---

## Implementation Order

1. `js/state.js` — add `_archivedProjects`
2. `js/projects.js` — listener split + CRUD functions
3. `js/projects.js` — `_projectsTab` state, header bar toggle, branching render
4. `js/projects.js` — per-row archive button + selection bar button
5. `js/projects.js` — `confirmArchiveProjects` modal + `restoreProjectAction`
6. `js/projects.js` — `renderArchivedProjectsTableHTML`
7. `css/projects.css` — new classes
8. Design system updates (04, 05, 06)

---

## Verification

1. Create a project → appears in Activos tab
2. Select it → selection bar shows Archivar + Eliminar buttons
3. Click Archivar → confirmation modal with reason picker appears
4. Select reason, confirm → project disappears from Activos, count updates
5. Switch to Archivados tab → project appears with reason badge, archivedBy, date
6. Click Restaurar → project returns to Activos tab
7. Per-row archive button (box icon) works the same as selection-bar archive (single item)
8. Firestore: `projects/BL26-XX` doc has `archived: true` + metadata; on restore fields are deleted
9. Search in active tab doesn't cross-contaminate archived; both tabs maintain independent counts
