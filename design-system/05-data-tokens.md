# Data Tokens

Structured data that drives the visual system — columns, labels, priorities, and team member colors. These are defined in `js/config.js` as exported constants and must match the CSS token values in `css/variables.css`.

---

## Columns

Five columns in fixed order. Each has an accent color used for the indicator bar and column header text.

| ID | Label | Color token | Hex | WIP limit |
|----|-------|------------|-----|-----------|
| `backlog` | Backlog / Leads | `--col-backlog` | `#6366f1` (indigo) | none |
| `analysis` | En Análisis | `--col-analysis` | `#3b82f6` (blue) | 5 |
| `development` | En Desarrollo | `--col-dev` | `#06b6d4` (cyan) | 4 |
| `testing` | Testing / Revisión | `--col-testing` | `#f59e0b` (amber) | 3 |
| `done` | Desplegado / Cerrado | `--col-done` | `#10b981` (emerald) | none |

WIP limit of 0 means no limit. Columns at or over their WIP limit show the count badge in rose with a pulse animation.

---

## Labels

Eight card labels. Each maps to a CSS class that applies a tinted background and matching text color.

| ID | Display name | CSS class | Background | Text color |
|----|-------------|-----------|-----------|-----------|
| `frontend` | Frontend | `.label-frontend` | `rgba(6,182,212,0.15)` | `--accent-cyan` (#06b6d4) |
| `backend` | Backend | `.label-backend` | `rgba(139,92,246,0.15)` | `--accent-violet` (#8b5cf6) |
| `bug` | Bug | `.label-bug` | `rgba(244,63,94,0.15)` | `--accent-rose` (#f43f5e) |
| `feature` | Feature | `.label-feature` | `rgba(16,185,129,0.15)` | `--accent-emerald` (#10b981) |
| `sales` | Ventas | `.label-sales` | `rgba(245,158,11,0.15)` | `--accent-amber` (#f59e0b) |
| `support` | Soporte | `.label-support` | `rgba(99,102,241,0.15)` | `#818cf8` (indigo-400) |
| `devops` | DevOps | `.label-devops` | `rgba(249,115,22,0.15)` | `--accent-orange` (#f97316) |
| `design` | Diseño | `.label-design` | `rgba(236,72,153,0.15)` | `#ec4899` (pink-500) |

All label pills: `border-radius: 10px`, `padding: 2px 8px`, `font-size: 10px`, `font-weight: 600`, `letter-spacing: 0.3px`.

---

## Priorities

Four levels in descending urgency. Each maps to a color for the top priority bar on cards.

| ID | Display | Color | Hex |
|----|---------|-------|-----|
| `urgent` | Urgent | `--accent-rose` | `#f43f5e` |
| `high` | High | `--accent-orange` | `#f97316` |
| `medium` | Medium | `--accent-amber` | `#f59e0b` |
| `low` | Low | `--accent-emerald` | `#10b981` |

The priority bar is a 3px strip at the top of each card, full width, `border-radius: radius-md radius-md 0 0`.

---

## Team Members

El equipo es **dinámico** — se carga de la colección `team/{uid}` en Firestore. Cada usuario tiene un campo `color` asignado en el momento de su primer login (account setup).

**Campos por documento `team/{uid}`:**
| Campo | Tipo | Descripción |
|-------|------|-------------|
| `name` | string | Nombre para mostrar |
| `email` | string | Correo registrado |
| `color` | string | Hex único de la paleta AVATAR_PALETTE |
| `createdAt` | timestamp | Fecha de creación del perfil |

**Avatar rendering:**
- 24×24px circle
- Background: campo `color` del doc Firestore
- Text: primera inicial, DM Sans 700, 10px, white
- Border: `2px solid --bg-card` (separación en stack)
- Stack: `margin-left: -6px` en 2do+ avatar

**Paleta de asignación automática de colores (`AVATAR_PALETTE`):**

El sistema elige el primer color no usado en esta lista al crear el perfil de cada usuario:

| # | Hex | Color |
|---|-----|-------|
| 1 | `#3b82f6` | blue |
| 2 | `#10b981` | emerald |
| 3 | `#f59e0b` | amber |
| 4 | `#8b5cf6` | violet |
| 5 | `#ec4899` | pink |
| 6 | `#06b6d4` | cyan |
| 7 | `#f97316` | orange |
| 8 | `#14b8a6` | teal |
| 9 | `#6366f1` | indigo |
| 10 | `#f43f5e` | rose |
| 11 | `#84cc16` | lime |
| 12 | `#a855f7` | purple |

Si todos los colores están en uso (>12 usuarios), el sistema cicla desde el inicio.

---

## Card Type

Cards have a `type` field used for swimlane grouping. Current values: `dev` (default). This can be extended for future swimlane categories.

---

## Archive Reason

Cards are archived with one of two reason values, displayed as a colored badge:

| Value | Label | Background | Text |
|-------|-------|-----------|------|
| `completed` | Completed | `rgba(16,185,129,0.15)` | `--accent-emerald` |
| `suspended` | Suspended | `rgba(245,158,11,0.15)` | `--accent-amber` |

---

## Project Types

Eight types used to classify projects. Defined in `js/config.js` as `PROJECT_TYPES`. Rendered as `.project-type-badge` pills in the Projects View table.

| ID | Display label |
|----|--------------|
| `web_app` | Aplicación Web |
| `mobile_app` | App Móvil |
| `ecommerce` | E-commerce |
| `landing` | Landing / Sitio Corporativo |
| `automation` | Automatización / Integración |
| `consulting` | Consultoría / Asesoría |
| `maintenance` | Mantenimiento / Soporte |
| `chatbot` | Asistente Digital (Chatbot) |

---

## Project Code Format

Auto-generated on project creation. Prefix constant: `PROJECT_CODE_PREFIX = 'BL'`.

**Pattern:** `BL{YY}-{NN}` (e.g. `BL26-01`, `BL26-02`)

- `YY` = last two digits of the current year (zero-padded)
- `NN` = sequential correlative within the year (zero-padded, 2 digits)
- `REUSE_PROJECT_CODE_GAPS = true` → gaps from deleted projects are reused before incrementing the max

The project document ID in Firestore is the code itself (e.g. `projects/BL26-01`).

**Firestore document fields (`projects/{code}`):**
| Field | Type | Description |
|-------|------|-------------|
| `code` | string | e.g. `BL26-01` |
| `name` | string | Project name |
| `type` | string | One of the PROJECT_TYPES IDs |
| `contact` | string | Client contact name |
| `phone` | string | Client phone |
| `email` | string | Client email |
| `salesman` | string | Salesman name |
| `teamLeader` | string | Team leader name |
| `correlative` | number | Numeric sequence used for gap-reuse logic |
| `createdBy` | string | Email of the user who created the project |
| `createdAt` | timestamp | Firestore server timestamp |

---

## Project Archive Fields

Added to the project document on archive, removed on restore. The project stays in the `projects` collection — no collection move needed.

| Field | Type | Description |
|-------|------|-------------|
| `archived` | boolean | `true` when archived; set back to `false` on restore |
| `archivedAt` | string | ISO timestamp of the archive action |
| `archivedBy` | string | displayName or email of the user who archived |
| `archiveReason` | string | `'completed'` \| `'cancelled'` |

On restore, `archivedAt`, `archivedBy`, and `archiveReason` are deleted via `FieldValue.delete()`.

**Archive reason display:**
| Value | Label | Badge color |
|-------|-------|-------------|
| `completed` | Completado | `--accent-emerald` on `rgba(16,185,129,0.15)` |
| `cancelled` | Cancelado | `--accent-rose` on `rgba(244,63,94,0.15)` |

---

## Snapshot Data

### Snapshot Document (`snapshots/{auto-id}`)

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Proposal title |
| `description` | string | Context text (optional) |
| `privacy` | string | `'public'` \| `'secret'` |
| `status` | string | `'active'` \| `'archived'` |
| `baseVP` | number | Total Voting Power budget per participant |
| `timespan` | number | Duration in milliseconds |
| `expiresAt` | string | ISO timestamp: `Date.now() + timespan` at creation |
| `options` | array | `Array<{ id: string, label: string }>` — min 2 options |
| `createdBy` | string | Email of creator |
| `createdAt` | Timestamp | Firestore server timestamp |

Whether a snapshot is **expired** is computed client-side: `Date.now() >= new Date(expiresAt).getTime()`. No separate field is stored.

### Vote Subcollection (`snapshots/{id}/votes/{userId}`)

| Field | Type | Description |
|-------|------|-------------|
| `userName` | string | displayName or email |
| `userEmail` | string | User's email |
| `allocation` | object | `{ [optionId]: number }` — VP per option |
| `totalSpent` | number | `Σ allocation values` |
| `submittedAt` | string | ISO timestamp |

Users can overwrite their vote while the snapshot is active. Only one vote doc per user per snapshot.

### Privacy Modes

| Value | Badge color | Behavior |
|-------|-------------|----------|
| `public` | `--accent-cyan` | Live results visible to all voters while active |
| `secret` | `--accent-amber` | Results hidden behind "🔒 Resultados Cifrados" until expiry; revealed on finality |

### Timespan Options

| Label | ms value |
|-------|---------|
| 15 minutos | `900000` |
| 30 minutos | `1800000` |
| 1 hora | `3600000` |
| 2 horas | `7200000` |
| 6 horas | `21600000` |
| 24 horas | `86400000` |
| 3 días | `259200000` |
| 7 días | `604800000` |

Default VP per participant: `100` (`SNAPSHOT_DEFAULT_VP` in `config.js`).

### Countdown Color States

| Remaining % of original timespan | Color token | Animation |
|-----------------------------------|-------------|-----------|
| > 50% | `--accent-emerald` | none |
| 10–50% | `--accent-amber` | none |
| < 10% | `--accent-rose` | `pulse` (opacity loop) |
| 0 (expired) | — | `snapshot-flash` then frozen |

### Results Calculation

```
percentage(option) = (Σ votes[*].allocation[optionId] / totalSpentVP) × 100
```

Displayed as a CSS bar chart with width set to the computed percentage. The **Verification Stamp** shown in the finality view contains: Snapshot ID (Firestore document ID) · Timestamp of Finality (`expiresAt`) · participant count · total VP spent.

---

## Sync Status States

The header sync dot has three states:

| State | Color | Animation |
|-------|-------|-----------|
| synced (default) | `--accent-emerald` | `syncPulse` 2s loop |
| offline | `--accent-amber` | none |
| error | `--accent-rose` | none |
