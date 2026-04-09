# Colors

All colors defined as CSS custom properties in `css/variables.css`.
The app is **dark-only**. There is no light mode.

---

## Background Layers

Six depth levels. Use from bottom to top — deeper layers sit behind shallower ones.

| Token | Hex | Use |
|-------|-----|-----|
| `--bg-deep` | `#06090f` | App root background, column backgrounds |
| `--bg-primary` | `#0a0e17` | Header, toolbar |
| `--bg-surface` | `#111827` | Modal background, archive items, stat cards, login overlay fill |
| `--bg-card` | `#1a2235` | Kanban cards, form inputs, checklist items |
| `--bg-card-hover` | `#1f2942` | Card hover state |
| `--bg-elevated` | `#243049` | Toast, checklist progress bar track |

**Figma tip:** Set these as fill styles named `bg/deep`, `bg/primary`, `bg/surface`, `bg/card`, `bg/card-hover`, `bg/elevated`.

---

## Border Colors

| Token | Value | Use |
|-------|-------|-----|
| `--border-subtle` | `rgba(99, 132, 185, 0.12)` | Default border on all cards, inputs, separators |
| `--border-active` | `rgba(99, 182, 255, 0.3)` | Hover and focus borders |

---

## Text Colors

| Token | Hex | Use |
|-------|-----|-----|
| `--text-primary` | `#e8ecf4` | Body text, card titles, input text |
| `--text-secondary` | `#8b9dc3` | Descriptions, nav tabs, meta info, user name |
| `--text-muted` | `#5a6e8f` | Placeholders, labels, timestamps, icons at rest |

---

## Accent Colors

Used for interactive elements, status indicators, labels, and highlights.

| Token | Hex | Primary uses |
|-------|-----|--------------|
| `--accent-blue` | `#3b82f6` | Primary action button, active nav tab, active filter chip, focus ring, drag-over highlight |
| `--accent-cyan` | `#06b6d4` | "En Desarrollo" column, Frontend label, Choshi avatar |
| `--accent-emerald` | `#10b981` | "Desplegado" column, low priority, checklist fill, sync OK dot, Feature label, Nasser avatar |
| `--accent-amber` | `#f59e0b` | "Testing" column, medium priority, offline dot, Sales label, Erik avatar |
| `--accent-rose` | `#f43f5e` | Urgent priority, blocked card, logout button, error state, Bug label, WIP exceeded badge |
| `--accent-violet` | `#8b5cf6` | Backend label, Gasm avatar |
| `--accent-orange` | `#f97316` | High priority, DevOps label, Ariel avatar |

**Additional non-token accent values used inline:**
| Hex | Use |
|-----|-----|
| `#ec4899` | Design label, Alex avatar |
| `#818cf8` | Support label (lighter indigo) |
| `#14b8a6` | Mario avatar (teal) |
| `#6366f1` | Backlog column, Support label background tint |
| `#2563eb` | btn-primary hover (blue-600) |

---

## Column Colors

| Token | Hex | Column |
|-------|-----|--------|
| `--col-backlog` | `#6366f1` | Backlog / Leads |
| `--col-analysis` | `#3b82f6` | En Análisis |
| `--col-dev` | `#06b6d4` | En Desarrollo |
| `--col-testing` | `#f59e0b` | Testing / Revisión |
| `--col-done` | `#10b981` | Desplegado / Cerrado |

---

## Logo Gradients

| Part | CSS gradient |
|------|-------------|
| "BITNOVA" (silver) | `linear-gradient(135deg, #c0c8b8 0%, #d4c9a8 50%, #b8bfae 100%)` — applied via `-webkit-background-clip: text` |
| "LABS" (gold) | `linear-gradient(135deg, #d4c9a8 0%, #c8b888 100%)` — applied via `-webkit-background-clip: text` |

The logo is silver-white to warm champagne, with LABS shifting to a subtle gold. Both use `font-family: Space Grotesk, font-weight: 700, letter-spacing: 3.5px`.

---

## Semantic Color Mapping

| Meaning | Color token |
|---------|------------|
| Success / Done / Online | `--accent-emerald` |
| Warning / Offline / Medium | `--accent-amber` |
| Error / Danger / Urgent / Blocked | `--accent-rose` |
| Info / Primary action / Active | `--accent-blue` |
| In progress / Development | `--accent-cyan` |

---

## Tinted Backgrounds (used inline, not as tokens)

These are computed at-use from accent colors. Pattern: `rgba(<accent-rgb>, <opacity>)`.

| Use | Value |
|-----|-------|
| Active nav tab bg | `rgba(59, 130, 246, 0.10)` |
| Active filter chip bg | `rgba(59, 130, 246, 0.15)` |
| Drag-over column bg | `rgba(59, 130, 246, 0.04)` |
| Add card hover bg | `rgba(59, 130, 246, 0.05)` |
| WIP exceeded badge bg | `rgba(244, 63, 94, 0.20)` |
| Login error bg | `rgba(244, 63, 94, 0.10)` |
| Logout button bg | `rgba(244, 63, 94, 0.08)` |
| Logout button bg hover | `rgba(244, 63, 94, 0.18)` |
| Logout border | `rgba(244, 63, 94, 0.25)` |
| Logout border hover | `rgba(244, 63, 94, 0.50)` |
| Project code badge bg | `rgba(99, 132, 185, 0.10)` |
| Label backgrounds | `rgba(<accent-rgb>, 0.15)` |
