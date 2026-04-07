# Data Tokens

Structured data that drives the visual system — columns, labels, priorities, and team member colors. These are defined in `index.html` as JavaScript constants and must match the CSS token values.

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

Current hardcoded team. Each member has a unique color used for their avatar circle and the assignee picker chip. **Note:** this list will become dynamic (loaded from Firestore `team/` collection) after the P1 auth implementation.

| ID | Name | Avatar color | Hex |
|----|------|-------------|-----|
| `gabriel` | Gabriel | Blue | `#3b82f6` |
| `nasser` | Nasser | Emerald | `#10b981` |
| `erik` | Erik | Amber | `#f59e0b` |
| `gasm` | Gasm | Violet | `#8b5cf6` |
| `alex` | Alex | Pink | `#ec4899` |
| `choshi` | Choshi | Cyan | `#06b6d4` |
| `ariel` | Ariel | Orange | `#f97316` |
| `mario` | Mario | Teal | `#14b8a6` |

**Avatar rendering:**
- 24×24px circle
- Background: member color
- Text: first initial, DM Sans 700, 10px, white
- Border: `2px solid --bg-card` (creates stacking separation)
- Stack: `margin-left: -6px` on 2nd+ avatars

**Future auto-assignment palette** (for new users joining via invite):
When the team list becomes dynamic, use this palette in order to auto-assign colors to new members:

```
#3b82f6  blue
#10b981  emerald
#f59e0b  amber
#8b5cf6  violet
#ec4899  pink
#06b6d4  cyan
#f97316  orange
#14b8a6  teal
#6366f1  indigo
#f43f5e  rose
#84cc16  lime
#a855f7  purple
```

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

## Sync Status States

The header sync dot has three states:

| State | Color | Animation |
|-------|-------|-----------|
| synced (default) | `--accent-emerald` | `syncPulse` 2s loop |
| offline | `--accent-amber` | none |
| error | `--accent-rose` | none |
