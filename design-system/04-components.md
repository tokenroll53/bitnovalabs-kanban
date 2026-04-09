# Components

Every UI component in the current app with states, measurements, and visual rules.

---

## App Header

**Selector:** `.app-header`

```
Height:           56px (fixed, min-height 56px)
Padding:          0 24px
Background:       --bg-primary (#0a0e17)
Border-bottom:    1px solid --border-subtle
Layout:           flex, space-between, align-center
Z-index:          100
```

Contains three zones: **Logo** (left) · **Nav Tabs** (center) · **Header Actions** (right).

---

## Logo

**Selectors:** `.app-logo`, `.logo-text`, `.logo-bit`, `.logo-labs`

```
Font:             Space Grotesk 700
Size:             17px
Letter-spacing:   3.5px
Line-height:      1
Gap:              10px between icon and text
```

| Part | Gradient |
|------|----------|
| "BIT" + "NOVA" | `linear-gradient(135deg, #c0c8b8 0%, #d4c9a8 50%, #b8bfae 100%)` |
| "LABS" | `linear-gradient(135deg, #d4c9a8 0%, #c8b888 100%)` |

Text rendered as gradient via `-webkit-background-clip: text; -webkit-text-fill-color: transparent`.

---

## Nav Tab

**Selector:** `.nav-tab`

```
Font:             DM Sans 500, 13px
Padding:          8px 16px
Border-radius:    --radius-sm (6px)
Transition:       --transition-fast
```

| State | Background | Color |
|-------|-----------|-------|
| Default | none | --text-secondary |
| Hover | --bg-surface | --text-primary |
| Active | rgba(59,130,246,0.10) | --accent-blue |

---

## Button (Base)

**Selector:** `.btn`

```
Font:             DM Sans 500, 13px
Padding:          7px 14px
Border-radius:    --radius-sm (6px)
Border:           1px solid --border-subtle
Gap:              6px (icon + label)
Icon size:        15×15px
Transition:       --transition-fast
White-space:      nowrap
```

| State | Background | Border |
|-------|-----------|--------|
| Default | --bg-surface | --border-subtle |
| Hover | --bg-card | --border-active |

### Button Primary

**Selector:** `.btn-primary`

```
Background:   --accent-blue (#3b82f6)
Border:       --accent-blue
Color:        white
Hover bg:     #2563eb
```

### Google Sign-In Button

**Selector:** `.btn-google`

```
Font:         DM Sans 600, 14px
Padding:      12px 28px
Border-radius:--radius-md (10px)
Background:   white
Border:       1px solid #dadce0
Color:        #3c4043
Icon size:    20×20px
Gap:          10px
Display:      block, margin: 0 auto
Hover bg:     #f7f8f8
Hover shadow: 0 1px 3px rgba(0,0,0,0.12)
```

### Logout Button

**Selector:** `.btn-logout`

```
Font:         DM Sans 500, 12px
Padding:      5px 10px
Border-radius:--radius-sm (6px)
Background:   rgba(244,63,94,0.08)
Border:       1px solid rgba(244,63,94,0.25)
Color:        --accent-rose
Hover bg:     rgba(244,63,94,0.18)
Hover border: rgba(244,63,94,0.50)
```

---

## Toolbar

**Selector:** `.toolbar`

```
Height:       44px (min-height)
Padding:      10px 24px
Background:   --bg-primary
Border-bottom:1px solid --border-subtle
Layout:       flex, align-center, gap 12px
```

### Toolbar Separator

```
Width:    1px
Height:   20px
Color:    --border-subtle
Margin:   0 6px
```

---

## Filter Chip

**Selector:** `.filter-chip`

```
Font:         DM Sans 500, 12px
Padding:      4px 10px
Border-radius:20px (pill)
Border:       1px solid --border-subtle
Gap:          5px
Transition:   --transition-fast
```

| State | Background | Border | Color |
|-------|-----------|--------|-------|
| Default | --bg-surface | --border-subtle | --text-secondary |
| Hover | --bg-surface | --border-active | --text-primary |
| Active | rgba(59,130,246,0.15) | --accent-blue | --accent-blue |

Contains optional `.dot` — `7×7px`, `border-radius: 50%`, colored per filter.

---

## Search Box

**Selector:** `.search-box` / `.archive-search`

```
Padding:      5px 12px
Border-radius:--radius-sm (6px)
Background:   --bg-surface
Border:       1px solid --border-subtle
Layout:       flex, align-center, gap 6px
Max-width:    220px (board toolbar) / 400px (archive)
```

Icon: `14×14px`, color `--text-muted`.
Input: DM Sans 12px, background none, color `--text-primary`, placeholder `--text-muted`.

---

## Column

**Selector:** `.column`

```
Min-width:    300px
Max-width:    340px
Flex:         1
Background:   --bg-deep
Border-right: 1px solid --border-subtle
Layout:       flex column
```

Last column has no right border.

### Column Header

```
Padding:      14px 16px 10px
Position:     sticky top 0
Background:   --bg-deep
Z-index:      10
Layout:       flex, align-center, gap 8px
```

**Column indicator bar:**
```
Width:   4px
Height:  20px
Radius:  2px
Color:   column accent color (see data tokens)
```

**Column count badge:**
```
Size:          min 22×22px, padding 0 6px, border-radius 11px
Font:          JetBrains Mono 600, 11px
Background:    --bg-surface
Color:         --text-secondary
```

WIP exceeded state:
```
Background:   rgba(244,63,94,0.20)
Color:        --accent-rose
Animation:    pulse-warn 2s infinite
```

**WIP indicator** (e.g. "/ 5"):
```
Font:   JetBrains Mono, 10px
Color:  --text-muted
```

### Column Body

```
Padding:   4px 10px 60px
Gap:       8px
Overflow:  scroll (y-axis)
```

Drag-over state: `background: rgba(59,130,246,0.04)`.

---

## Kanban Card

**Selector:** `.card`

```
Background:    --bg-card (#1a2235)
Border:        1px solid --border-subtle
Border-radius: --radius-md (10px)
Padding:       12px
Cursor:        grab
Transition:    --transition-smooth
```

| State | Background | Border | Shadow | Transform |
|-------|-----------|--------|--------|-----------|
| Default | --bg-card | --border-subtle | none | none |
| Hover | --bg-card-hover | --border-active | --shadow-card | translateY(-1px) |
| Dragging | --bg-card | --border-subtle | --shadow-elevated | rotate(2deg) scale(0.98), opacity 0.5 |
| Blocked | --bg-card | left: 3px solid --accent-rose | — | — |

Blocked cards show a `⛔` emoji absolutely positioned at `top: 28px, right: 8px`.

### Priority Bar

```
Position:  absolute, top 0, full width
Height:    3px
Radius:    radius-md radius-md 0 0
```

| Priority | Color |
|----------|-------|
| urgent | --accent-rose (#f43f5e) |
| high | --accent-orange (#f97316) |
| medium | --accent-amber (#f59e0b) |
| low | --accent-emerald (#10b981) |

### Card Labels Row

```
Display:   flex wrap
Gap:       4px
Margin-bottom: 8px
Align:     center
```

### Label Pill

```
Padding:      2px 8px
Border-radius:10px
Font:         DM Sans 600, 10px, letter-spacing 0.3px
Background:   rgba(<accent-rgb>, 0.15)
Color:        accent color
```

### Project Code Badge

```
Padding:        2px 8px
Border-radius:  4px
Background:     rgba(99,132,185,0.10)
Border:         1px solid --border-subtle
Font:           JetBrains Mono 600, 10px, letter-spacing 0.5px
Color:          --text-secondary
```

### Card Title

```
Font:   DM Sans 600, 13px, line-height 1.4
Color:  --text-primary
Margin-bottom: 6px
```

### Card Description

```
Font:         DM Sans 400, 11px, line-height 1.5
Color:        --text-secondary
Margin-bottom:10px
Clamp:        2 lines
```

### Checklist Progress

**Bar:**
```
Height:     4px
Background: --bg-elevated (track)
Fill:       --accent-emerald
Radius:     2px
Transition: width 0.3s ease
```

**Text:**
```
Font:   JetBrains Mono 400, 10px
Color:  --text-muted
```

### Card Footer

```
Layout:       flex, space-between, align-center
Padding-top:  8px
Border-top:   1px solid --border-subtle
```

### Avatar

```
Size:         24×24px
Radius:       50%
Font:         DM Sans 700, 10px, color white
Border:       2px solid --bg-card
Stack offset: margin-left -6px (first child: 0)
```

### Card Meta

```
Font:     DM Sans 400, 10px
Color:    --text-muted
Gap:      10px (items), 3px (icon+text)
Icon size:12×12px
```

Due date font: JetBrains Mono, 10px.
Overdue: `--accent-rose`. Soon (≤3 days): `--accent-amber`.

---

## Add Card Button

**Selector:** `.add-card-btn`

```
Font:         DM Sans 400, 12px
Padding:      8px 12px
Margin:       4px 10px
Border-radius:--radius-sm (6px)
Border:       1px dashed --border-subtle
Background:   none
Color:        --text-muted
Gap:          6px
Transition:   --transition-fast
```

Hover: border `--accent-blue`, color `--accent-blue`, bg `rgba(59,130,246,0.05)`.

---

## Modal

**Selector:** `.modal-overlay` / `.modal`

**Overlay:**
```
Position:      fixed inset 0
Z-index:       1000
Background:    rgba(0,0,0,0.60)
Backdrop:      blur(4px)
Transition:    opacity --transition-smooth
```

**Window:**
```
Width:         680px
Max-width:     95vw
Max-height:    90vh
Background:    --bg-surface
Border:        1px solid --border-subtle
Border-radius: --radius-xl (18px)
Shadow:        --shadow-elevated
Overflow:      scroll (y)
```

Enter animation: `translateY(20px) scale(0.97) → 0 scale(1)` over 250ms.

**Header:** padding `24px 24px 16px`, border-bottom, title Space Grotesk 700 20px.

**Body:** padding `20px 24px`.

**Footer:** padding `16px 24px`, border-top, flex end, gap 8px.

**Section title:**
```
Font:   DM Sans 600, 11px, uppercase, letter-spacing 0.5px
Color:  --text-muted
Margin-bottom: 8px
```

### Form Controls

**Input / Textarea / Select:**
```
Width:         100%
Padding:       10px 14px
Background:    --bg-card
Border:        1px solid --border-subtle
Border-radius: --radius-sm (6px)
Font:          DM Sans 400, 13px
Color:         --text-primary
Transition:    --transition-fast
Focus border:  --accent-blue
Focus shadow:  --shadow-glow-blue
```

Textarea: `min-height: 80px`, resize vertical.

**Modal row:** flex, gap 12px — children flex: 1.

### Label/Assignee Picker Options

```
Padding:       4px 12px
Border-radius: 14px
Font:          DM Sans 600, 11px
Opacity:       0.4 default → 1 selected
Border:        2px solid transparent → rgba(255,255,255,0.3) selected
Cursor:        pointer
```

---

## Checklist Item (Modal)

```
Layout:   flex, align-center, gap 8px
Padding:  6px 8px
Radius:   --radius-sm (6px)
BG:       --bg-card
Checkbox: accent-color --accent-emerald, 14×14px
Text:     DM Sans 400, 12px
Done text:line-through, color --text-muted
```

---

## Toast

**Selector:** `.toast`

```
Padding:      12px 20px
Border-radius:--radius-md (10px)
Background:   --bg-elevated
Border:       1px solid --border-subtle
Font:         DM Sans 400, 13px
Shadow:       --shadow-elevated
Position:     fixed bottom 24px right 24px
Z-index:      2000
Gap:          8px (stacked toasts)
```

Enter: `slideUp` 0.3s — Exit: `fadeOut` 0.3s at 2.7s.

---

## Email Confirm Card

**ID:** `emailConfirmOverlay` · **Selector:** `.reset-overlay` / `.reset-card`

Aparece cuando un usuario invitado llega desde su magic link y el email no está en localStorage. Mismo estilo visual que Password Reset Card.

```
Z-index:     6000
Background:  --bg-deep (overlay) / --bg-surface (card)
Card width:  420px max, 90%
Padding:     40px 40px 32px
```

| Elemento | Specs |
|----------|-------|
| Título | Space Grotesk 700, 20px — "Confirmá tu correo" |
| Subtitle | DM Sans 400, 13px, --text-muted |
| Input email | `.setup-input`, type=email |
| Btn Continuar | `.btn-setup` (full width, --accent-blue) |
| Error | `.setup-error` (rose, display none → block) |

---

## Password Reset Card

**ID:** `resetOverlay` · **Selector:** `.reset-overlay` / `.reset-card`

Aparece cuando la URL contiene `?mode=resetPassword&oobCode=…` (link desde correo de Firebase).

```
Z-index:     6000
Background:  --bg-deep (overlay) / --bg-surface (card)
Card width:  420px max, 90%
Padding:     40px 40px 32px
```

| Elemento | Specs |
|----------|-------|
| Título | Space Grotesk 700, 20px — "Nueva contraseña" |
| Subtitle | DM Sans 400, 13px, --text-muted |
| Input nueva contraseña | `.setup-input`, type=password |
| Input confirmar | `.setup-input`, type=password |
| Btn Guardar | `.btn-setup` (full width) |
| Error | `.setup-error` |
| Banner éxito | `.reset-success` — bg emerald 10%, border emerald 25%, color --accent-emerald + Btn "Ir al inicio de sesión" |

---

## Login Card

**Selector:** `.login-overlay` / `.login-card`

Overlay fills viewport, `background: --bg-deep`, centered flex column.

**Card:**
```
Background:    --bg-surface
Border:        1px solid --border-subtle
Border-radius: --radius-xl (18px)
Padding:       48px 40px
Text-align:    center
Max-width:     400px
Width:         90%
Shadow:        --shadow-elevated
Animation:     loginFadeIn 0.4s ease
```

Icon: `64×64px`, radius-md.
Heading: Space Grotesk 700, 22px, letter-spacing 2px.
Subtitle: DM Sans 400, 13px, color `--text-muted`, margin-bottom 32px.

### Login Error Message

```
Margin-top:   16px
Padding:      10px 14px
Background:   rgba(244,63,94,0.10)
Radius:       --radius-sm (6px)
Color:        --accent-rose
Font:         DM Sans 400, 12px
```

---

## Account Setup Card

**ID:** `setupOverlay` · **Selector:** `.setup-overlay` / `.setup-card`

Aparece la primera vez que un usuario accede (invite pendiente o sin team doc). Siempre muestra nombre; contraseña es condicional (oculta para Google, visible para email/email-link).

```
Z-index:     5000
Background:  --bg-deep (overlay) / --bg-surface (card)
Card width:  420px max, 90%
Padding:     40px 40px 32px
Animation:   loginFadeIn 0.4s ease
```

| Elemento | Specs |
|----------|-------|
| Título | Space Grotesk 700, 20px — "Bienvenido/a" |
| Subtitle | DM Sans 400, 13px, --text-muted — "Configurá tu perfil…" |
| Input nombre | `.setup-input`, type=text, maxlength=50 |
| Nota contraseña | DM Sans 400, 12px, --text-muted (solo si needsPassword) |
| Input contraseña | `.setup-input`, type=password, autocomplete=new-password (condicional) |
| Input confirmar | `.setup-input`, type=password, autocomplete=new-password (condicional) |
| Btn Comenzar | `.btn-setup` (full width, --accent-blue) |
| Error | `.setup-error` |

**Lógica de visibilidad del bloque de contraseña:**  
`needsPassword = true` para todos los usuarios no-Google. Google users solo ven el campo de nombre.

---

## User Info (Header)

**Selector:** `.user-info`

```
Layout:       flex, align-center, gap 8px
Padding-left: 8px
Border-left:  1px solid --border-subtle
Margin-left:  4px
```

Avatar: `28×28px`, border-radius 50%, border `2px solid --border-subtle`.
Name: DM Sans 500, 12px, `--text-secondary`, max-width 100px, ellipsis.

---

## Sync Status Dot

**Selector:** `.sync-status`

```
Size:   7×7px
Radius: 50%
```

| State | Color | Animation |
|-------|-------|-----------|
| Online | --accent-emerald | syncPulse 2s infinite |
| Offline | --accent-amber | none |
| Error | --accent-rose | none |

---

## Stat Card (Analytics)

**Selector:** `.stat-card`

```
Background:    --bg-surface
Border:        1px solid --border-subtle
Border-radius: --radius-lg (14px)
Padding:       20px
```

Label: DM Sans 600, 11px, uppercase, letter-spacing 0.5px, `--text-muted`.
Value: Space Grotesk 700, 32px.
Unit: DM Sans 400, 13px, `--text-secondary`.
Trend up: DM Sans 600, 11px, `--accent-emerald`. Trend down: `--accent-rose`.

---

## Chart Container

**Selector:** `.chart-container`

```
Background:    --bg-surface
Border:        1px solid --border-subtle
Border-radius: --radius-lg (14px)
Padding:       24px
Margin-bottom: 16px
```

Title: Space Grotesk 700, 15px.
Bar chart height: 180px.
Bar max-width: 48px.
Bar transition: height 0.5s ease.
Bar hover: brightness(1.2).
Bar label: JetBrains Mono 400, 10px, `--text-muted`.
Bar value (above bar): JetBrains Mono 400, 10px, `--text-secondary`.

---

## Archive Item

**Selector:** `.archive-item`

```
Background:    --bg-surface
Border:        1px solid --border-subtle
Border-radius: --radius-lg (14px)
Overflow:      hidden
Transition:    --transition-fast
```

Hover: border `--border-active`.

Header row padding: `14px 18px`, cursor pointer. Hover bg: `--bg-card`.

Title: DM Sans 600, 14px.
Expand icon: `--text-muted`, rotate 90° when open.

**Archive reason badge:**
```
Padding:      3px 10px
Radius:       12px
Font:         DM Sans 600, 11px
completed:    bg rgba(16,185,129,0.15), color --accent-emerald
suspended:    bg rgba(245,158,11,0.15), color --accent-amber
```

Date: JetBrains Mono 400, 11px, `--text-muted`.

Detail panel padding: `0 18px 18px` (closed) → `16px 18px 18px` (open).
Detail grid: 2 columns, gap 14px.
Field label: DM Sans 600, 10px, uppercase, letter-spacing 0.5px, `--text-muted`.
Field value: DM Sans 400, 13px, `--text-primary`.
Description block: DM Sans 400, 13px, `--text-secondary`, line-height 1.6, padding `10px 14px`, bg `--bg-card`, radius `--radius-sm`.

---

## Swimlane

**Selector:** `.swimlane-header`

```
Font:   DM Sans 600, 11px, uppercase, letter-spacing 0.5px
Color:  --text-muted
Padding:6px
Gap:    6px
Cursor: pointer
```

Arrow indicator: 10px, rotates -90deg when collapsed.

---

## Admin Panel

**ID:** `adminModal` · **Selector:** `.modal-overlay` / `.modal` (same modal shell as Card Modal)

Modal width 700px, backdrop blur, z-index 1000. Visible only to users with a doc in `admins/{email}`.

### Invite Form

**Selector:** `.invite-form`

```
Layout:   flex, gap 8px
Input:    flex 1, padding 9px 14px, bg --bg-card, border --border-subtle, radius --radius-sm, DM Sans 13px
          Focus: border --accent-blue, shadow --shadow-glow-blue
Feedback: .invite-feedback, font-size 12px, min-height 18px
          .ok → --accent-emerald  |  .err → --accent-rose
```

### Invite Table

**Selector:** `.invite-table`

```
Width:          100%
Border-collapse:collapse
Font-size:      12px

th: DM Sans 600, 10px, uppercase, letter-spacing 0.5px, --text-muted
    padding: 0 8px 10px, border-bottom --border-subtle

td: padding 10px 8px, border-bottom --border-subtle, color --text-secondary
    .email-cell → color --text-primary, font-weight 500
    Last row: no border-bottom
```

### Status Badges (invite table)

```
.badge-pending:   padding 2px 8px, radius 10px, bg rgba(245,158,11,0.15),  color --accent-amber,   DM Sans 600 10px
.badge-accepted:  padding 2px 8px, radius 10px, bg rgba(16,185,129,0.15),  color --accent-emerald, DM Sans 600 10px
```

### Revoke Button

**Selector:** `.btn-revoke`

```
Padding:     3px 10px
Radius:      --radius-sm (6px)
Background:  rgba(244,63,94,0.08)
Border:      1px solid rgba(244,63,94,0.20)
Color:       --accent-rose
Font:        DM Sans 500, 11px
Hover bg:    rgba(244,63,94,0.18)
Hover border:rgba(244,63,94,0.40)
```

### Color Dot

**Selector:** `.color-dot`

Used next to team member names in the invite table to show their avatar color.

```
Size:   10×10px
Radius: 50%
Margin-right: 6px
```

---

## Projects View

**ID:** `projectsView` · **Selector:** `.projects-view`

Full-screen content area, shown when the "Proyectos" nav tab is active.

```
Padding:    24px
Overflow:   auto (y)
Display:    none → block (.active)
```

### Projects Header Bar

**Selector:** `.projects-header-bar`

```
Layout:   flex, space-between, align-center
Margin-bottom: 20px
```

Title: Space Grotesk 700, 20px, `--text-primary`.
Left side also contains the **tab toggle** (see below).
Right side (active tab only): Btn CSV · Btn JSON · Btn "Nuevo Proyecto" (btn-primary).

### Projects Tab Toggle

**Selector:** `.projects-tab-toggle` / `.projects-tab-btn`

Pill group embedded in the header bar. Switches between "Activos" and "Archivados" panels.

```
Container:   flex, gap 4px, bg --bg-surface, border --border-subtle, radius --radius-sm, padding 3px
Button:      DM Sans 500, 12px, padding 4px 12px, radius (--radius-sm - 1px)
Default:     color --text-secondary, bg none
Active:      bg --bg-elevated, color --text-primary
Count span:  .tab-count — JetBrains Mono 10px, color --text-muted (--text-secondary when active)
```

### Projects Toolbar

**Selector:** `.projects-toolbar`

```
Layout:   flex, align-center, gap 10px, flex-wrap
Margin-bottom: 14px
```

**Projects search box** (`.projects-search`):
```
Padding:      5px 12px
Border-radius:--radius-sm (6px)
Background:   --bg-surface
Border:       1px solid --border-subtle
Layout:       flex, align-center, gap 6px
Max-width:    320px
Flex:         1
Focus-within: border --border-active
```

Icon: SVG 14×14px, `--text-muted`. Input: DM Sans 12px, placeholder `--text-muted`.

Separator (`.projects-toolbar-sep`): `1px × 20px`, `--border-subtle`.

### Projects Selection Bar

**Selector:** `.projects-selection-bar`

Shown when at least one row is checked. Hidden by default (`display: none`), visible with `.visible` class.

```
Padding:      8px 16px
Background:   --bg-elevated
Border:       1px solid --border-subtle
Border-radius:--radius-sm (6px)
Layout:       flex, align-center, gap 12px
Margin-bottom:10px
```

Count label: DM Sans 12px, `--text-secondary`, flex 1.
Buttons: "Deseleccionar todo" (base btn) · "Archivar seleccionados" (amber tint) · "Eliminar seleccionados" (rose destructive inline style).

Amber button inline style: `background: rgba(245,158,11,0.08)`, `border-color: rgba(245,158,11,0.25)`, `color: --accent-amber`.

### Projects Table Wrapper

**Selector:** `.projects-table-wrapper`

```
Background:    --bg-surface
Border:        1px solid --border-subtle
Border-radius: --radius-lg (14px)
Overflow:      hidden
```

### Projects Table

**Selector:** `.projects-table`

```
Width:           100%
Border-collapse: collapse
Font-size:       13px
```

**`th`:** JetBrains Mono 600, 10px, uppercase, letter-spacing 0.5px, `--text-muted`, padding `10px 14px`, border-bottom `--border-subtle`, bg `--bg-deep`.

**`td`:** padding `12px 14px`, border-bottom `--border-subtle`, color `--text-secondary`, vertical-align middle. Last row: no border-bottom.

**Row states:**
| State | Background |
|-------|-----------|
| Hover | `--bg-card-hover` (all cells) |
| Selected | `rgba(59,130,246,0.06)` |

**Column classes:**
| Class | Width | Behavior |
|-------|-------|----------|
| `.col-check` | 36px | Checkbox; hidden at mobile |
| `.col-phone` | — | Hidden at `≤768px` |
| `.col-email` | — | Hidden at `≤768px` |
| `.col-action` | 80px | Centered; holds create-card + archive icon buttons |

**Checkbox** (`input[type="checkbox"]`): `accent-color: --accent-blue`, 14×14px.

### Project Code Badge (Projects Table)

**Selector:** `.project-code-badge` (projects context)

Cyan-tinted variant — distinct from the neutral gray badge used on kanban cards.

```
Padding:      2px 8px
Border-radius:--radius-sm (6px)
Background:   rgba(6,182,212,0.10)
Border:       1px solid rgba(6,182,212,0.20)
Font:         JetBrains Mono 600, 11px, letter-spacing 0.5px
Color:        --accent-cyan
```

### Project Name Cell

**Selector:** `.project-name-cell`

```
Font-weight: 600
Color:       --text-primary
```

### Project Type Badge

**Selector:** `.project-type-badge`

```
Padding:      2px 8px
Border-radius:10px (pill)
Background:   --bg-card
Border:       1px solid --border-subtle
Font:         DM Sans 11px
Color:        --text-secondary
```

### Project Link Button

**Selector:** `.project-link-btn`

Inline icon button in the action column — opens the card modal pre-filled with the project code.

```
Size:         28×28px
Background:   none
Border:       1px solid transparent
Border-radius:--radius-sm (6px)
Color:        --text-muted
```

Hover: color `--accent-blue`, border `--border-active`, bg `rgba(59,130,246,0.08)`.

### Project Archive Button

**Selector:** `.project-archive-btn`

Second icon button in the action column of the active projects table. Opens the archive confirmation modal.

```
Size:         28×28px
Background:   none
Border:       1px solid transparent
Border-radius:--radius-sm (6px)
Color:        --text-muted
```

Hover: color `--accent-amber`, border `rgba(245,158,11,0.3)`, bg `rgba(245,158,11,0.08)`.

### Projects Empty State

**Selector:** `.projects-empty`

```
Text-align:  center
Padding:     60px 24px
Color:       --text-muted
Font:        DM Sans 13px
```

SVG icon: 40×40px, opacity 0.3, centered above text.
Message varies by tab and search state:
- Active + no search → "Todavía no hay proyectos. Creá el primero."
- Active + search → "No hay proyectos que coincidan con la búsqueda."
- Archived → "No hay proyectos archivados."

### Archived Projects Table

Rendered when `_projectsTab === 'archived'`. No checkboxes — per-row restore only.

Columns: Código · Nombre · Tipo · **Motivo** · Archivado por · Fecha · Restaurar

**Motivo badge** — `.project-archive-reason`
```
Padding:      2px 8px
Border-radius:10px (pill)
Font:         DM Sans 600, 10px, letter-spacing 0.3px
.completed → bg rgba(16,185,129,0.15), color --accent-emerald, label "Completado"
.cancelled → bg rgba(244,63,94,0.15),  color --accent-rose,    label "Cancelado"
```

**Restore button** — `.btn-restore-project`
```
Padding:      4px 10px
Border-radius:--radius-sm (6px)
Background:   rgba(16,185,129,0.08)
Border:       1px solid rgba(16,185,129,0.25)
Color:        --accent-emerald
Font:         DM Sans 500, 11px
Hover bg:     rgba(16,185,129,0.18)
Hover border: rgba(16,185,129,0.5)
```

### Archive Confirmation Modal

Reuses `#modalOverlay` / `#modalContent` shell. Triggered by selection-bar "Archivar" or per-row archive button.

```
Header:   "Archivar proyecto(s)"
Body:     List of code badges + names
          + Motivo section with two reason picker pills
Footer:   Cancelar · Archivar (amber, disabled until reason selected)
```

**Reason picker pill** — `.archive-reason-pill`
```
Padding:      5px 14px
Border-radius:20px (pill)
Border:       1px solid --border-subtle
Font:         DM Sans 500, 12px
Default:      color --text-secondary
Hover:        border --border-active, color --text-primary
Selected:     bg rgba(245,158,11,0.15), border rgba(245,158,11,0.5), color --accent-amber
```

### Project Form (Modal)

Reuses the standard modal shell (`.modal-overlay` / `.modal`). Layout uses a 2-column grid.

**Selector:** `.project-form-grid`

```
Display: grid
Columns: 1fr 1fr
Gap:     14px
```

Full-width row: `.project-form-full` → `grid-column: 1 / -1`.

Fields: Nombre (full-width) · Tipo (select) · Vendedor · Contacto · Team Leader · Teléfono · E-mail.
Required: Nombre, Tipo. All others optional.
Error block: `rgba(244,63,94,0.10)` bg, `--accent-rose` text, `--radius-sm`, 12px.

Mobile: grid collapses to 1 column.

---

## Snapshot View

**ID:** `snapshotView` · **Selector:** `.snapshot-view`

Full-screen content area, shown when the "Snapshot" nav tab is active.

```
Padding:    24px
Overflow:   auto (y)
Display:    none → block (.active)
```

### Snapshot Header Bar

**Selector:** `.snapshot-header-bar`

```
Layout:   flex, space-between, align-center
Margin-bottom: 20px
```

Title: Space Grotesk 700, 20px. Left side contains the tab toggle.
Right side (active tab only): Btn "Nueva Propuesta" (btn-primary).

### Snapshot Tab Toggle

**Selector:** `.snapshot-tab-toggle` / `.snapshot-tab-btn`

Identical structure to `.projects-tab-toggle`. Switches between "Activas" and "Archivadas".

```
Container:  flex, gap 4px, bg --bg-surface, border --border-subtle, radius --radius-sm, padding 3px
Button:     DM Sans 500, 12px, padding 4px 12px
Default:    color --text-secondary, bg none
Active:     bg --bg-elevated, color --text-primary
Count span: .tab-count — JetBrains Mono 10px
```

### Snapshot List Table

**Selector:** `.snapshot-table`

Same base styles as `.projects-table`. Active tab columns:

| Column | Content |
|--------|---------|
| Título | `.snapshot-title-cell` — clickable, opens detail overlay |
| Privacidad | `.snapshot-privacy-badge` |
| Tiempo restante | `.snapshot-countdown` — live ticking |
| VP Base | JetBrains Mono |
| Opciones | count |
| Creado por | plain text |
| — | Archive icon button (amber hover) |

Archived tab columns: Título · Privacidad · Finalizó · VP Base · Creado por.

### Privacy Badge

**Selector:** `.snapshot-privacy-badge`

```
Padding:      2px 10px
Border-radius:10px (pill)
Font:         DM Sans 600, 10px, letter-spacing 0.3px
Display:      inline-flex, align-center, gap 4px
Icon:         12×12px SVG
```

| Variant | Background | Border | Color | Icon |
|---------|-----------|--------|-------|------|
| `.public` | `rgba(6,182,212,0.12)` | `rgba(6,182,212,0.25)` | `--accent-cyan` | eye |
| `.secret` | `rgba(245,158,11,0.12)` | `rgba(245,158,11,0.25)` | `--accent-amber` | lock |

### Countdown Clock (List)

**Selector:** `.snapshot-countdown`

```
Font:         JetBrains Mono 600, 12px
Letter-spacing: 1px
White-space:  nowrap
```

| Class | Color | Animation |
|-------|-------|-----------|
| `.emerald` | `--accent-emerald` | none |
| `.amber` | `--accent-amber` | none |
| `.rose` | `--accent-rose` | none |
| `.rose.pulse` | `--accent-rose` | opacity loop (like syncPulse) |

---

## Snapshot Detail Overlay

**ID:** `snapshotDetailOverlay` · **Selector:** `.snapshot-detail-overlay`

A dedicated full-screen overlay for the voting workspace. Separate from `#modalOverlay`.

**Overlay:**
```
Position:   fixed inset 0
Z-index:    1100
Background: rgba(0,0,0,0.70)
Backdrop:   blur(6px)
Display:    none → flex (center) when .active
```

**Window:**
```
Width:         780px
Max-width:     96vw
Max-height:    92vh
Background:    --bg-surface
Border:        1px solid --border-subtle
Border-radius: --radius-xl (18px)
Shadow:        --shadow-elevated
Overflow-y:    scroll
```

Enter animation: same `translateY(20px) scale(0.97) → 0 scale(1)` as card modal.

### Detail Header

```
Padding:       20px 24px 16px
Border-bottom: 1px solid --border-subtle
Layout:        flex, space-between, align-start
```

Left: privacy badge + title (Space Grotesk 700, 18px) + description (DM Sans 400, 13px, `--text-secondary`).
Right: close button (`32×32px`, same style as `.modal-close`).

### VP Budget Tracker

**Selector:** `.snapshot-vp-tracker`

Sticky glassmorphism bar at the top of the scrollable body.

```
Position:      sticky
Top:           0
Z-index:       10
Background:    rgba(17,24,39,0.85)
Backdrop:      blur(8px)
Border:        1px solid rgba(6,182,212,0.20)
Border-radius: --radius-md (10px)
Padding:       10px 16px
Margin:        16px 24px 0
Layout:        flex, space-between, align-center
```

Left: label "Tu Voting Power:" (DM Sans 11px uppercase, `--text-muted`) + `[balance] / [total]` (JetBrains Mono 600, 16px, `--accent-cyan`).
Right: budget progress bar.

**Budget Progress Bar:**

```
.snapshot-vp-bar-track:   height 6px, bg --bg-elevated, radius 3px, flex 1, max-width 200px
.snapshot-vp-bar-fill:    height 100%, bg --accent-cyan, radius 3px, transition width 150ms
.snapshot-vp-bar-fill.exceeded: bg --accent-rose
```

### Option Card

**Selector:** `.snapshot-option-card`

```
Background:    --bg-card
Border:        1px solid --border-subtle
Border-radius: --radius-md (10px)
Padding:       14px 16px
Margin-bottom: 10px
Layout:        flex, align-center, gap 12px
Transition:    --transition-fast
```

Hover: border `--border-active`.

Parts:
- **Label** (`flex: 1`): DM Sans 600, 14px, `--text-primary`
- **Allocation input** (`width: 72px`): modal-input style, `text-align: center`, JetBrains Mono 14px, `type=number min=0`
- **Weight badge** (`.snapshot-weight-badge`): DM Sans 600, 11px, `--text-muted` → `--accent-cyan` when value > 0. Shows "X%"

### Commit Button

**Selector:** `.snapshot-commit-btn`

```
Width:         100%
Padding:       12px
Margin-top:    20px
Border-radius: --radius-md (10px)
Background:    linear-gradient(135deg, rgba(6,182,212,0.20), rgba(6,182,212,0.10))
Border:        1px solid rgba(6,182,212,0.40)
Color:         --accent-cyan
Font:          DM Sans 600, 14px
Cursor:        pointer
Transition:    --transition-fast
```

Hover: `background: rgba(6,182,212,0.28)`, `border-color: rgba(6,182,212,0.65)`.
Disabled: `opacity: 0.4`, `cursor: not-allowed`.

---

## Snapshot Results Panel

**Selector:** `.snapshot-results-panel`

Shown in the detail overlay:
- **PUBLIC + active:** live sidebar showing current vote distribution.
- **SECRET + active:** encrypted placeholder.
- **Expired (any privacy):** final resolution view.

### Result Bar Row

**Selector:** `.snapshot-result-row`

```
Layout:        grid, columns [label 1fr] [bar 2fr] [meta 80px], gap 10px, align-center
Margin-bottom: 10px
```

- `.snapshot-result-label`: DM Sans 500, 13px, `--text-primary`
- `.snapshot-result-bar-track`: height 8px, bg `--bg-elevated`, radius 4px, overflow hidden
- `.snapshot-result-bar-fill`: height 100%, bg `--accent-cyan`, radius 4px; `transition: width 0.5s ease` on render
- `.snapshot-result-pct`: JetBrains Mono 600, 13px, `--text-primary`
- `.snapshot-result-vp`: DM Sans 400, 11px, `--text-muted`

### Verification Stamp

**Selector:** `.snapshot-stamp`

Shown only in finality state (expired).

```
Background:    --bg-deep
Border:        1px solid rgba(6,182,212,0.15)
Border-radius: --radius-md (10px)
Padding:       14px 16px
Margin-top:    24px
Font:          JetBrains Mono
```

`.snapshot-stamp-row`: flex, space-between, padding 4px 0, border-bottom `--border-subtle` (last: none).
`.snapshot-stamp-label`: 10px, `--text-muted`, uppercase, letter-spacing 0.5px.
`.snapshot-stamp-value`: 11px, `--text-secondary`, word-break: break-all.

### Encrypted Placeholder

**Selector:** `.snapshot-encrypted-placeholder`

```
Text-align:  center
Padding:     40px 24px
Color:       --accent-amber
Font:        DM Sans 13px
```

Lock icon: `40×40px SVG`, `rgba(245,158,11,0.3)`, centered.
Title: DM Sans 600, 14px. Subtitle: DM Sans 400, 12px, `--text-muted`.

---

## Snapshot Frozen State

**Selector:** `.snapshot-frozen`

Applied to `.snapshot-detail-window` when the timer reaches zero.

```
Box-shadow:      0 0 0 1px rgba(6,182,212,0.20), inset 0 0 40px rgba(6,182,212,0.03)
pointer-events:  none on .snapshot-workspace (inputs disabled)
```

Frozen banner (`.snapshot-finality-banner`):
```
Background:  rgba(6,182,212,0.08)
Border:      1px solid rgba(6,182,212,0.20)
Border-radius: --radius-sm
Padding:     8px 14px
Color:       --accent-cyan
Font:        DM Sans 600, 12px
```

Text: "⚡ Snapshot Finalizado — Estado capturado e inmutable."

### Flash Animation

```css
@keyframes snapshot-flash {
  0%   { opacity: 1; }
  15%  { opacity: 0.05; }
  30%  { opacity: 1; }
  50%  { opacity: 0.05; }
  70%  { opacity: 1; }
  100% { opacity: 1; }
}
.snapshot-flash { animation: snapshot-flash 0.8s ease; }
```

---

## Snapshot Create Modal Helpers

Reuses `#modalOverlay` / `#modalContent` shell (same as project form).

### Option Row

**Selector:** `.snapshot-option-row`

```
Layout:   flex, align-center, gap 8px, margin-bottom 8px
Input:    flex 1, modal-input style
Remove btn (.snapshot-option-remove-btn): 28×28px, bg none, border none, color --text-muted,
           hover color --accent-rose, radius --radius-sm
```

### Add Option Button

**Selector:** `.snapshot-add-option-btn`

```
Font:         DM Sans 400, 12px
Padding:      6px 12px
Border:       1px dashed --border-subtle
Border-radius:--radius-sm
Background:   none
Color:        --text-muted
Cursor:       pointer
Hover:        border --accent-cyan, color --accent-cyan
```

### Privacy Pill (Create Form)

**Selector:** `.snapshot-privacy-pill`

```
Padding:      5px 14px
Border-radius:20px (pill)
Border:       1px solid --border-subtle
Font:         DM Sans 500, 12px
Display:      inline-flex, align-center, gap 5px
Default:      color --text-secondary
Selected (.active — public): bg rgba(6,182,212,0.12), border rgba(6,182,212,0.30), color --accent-cyan
Selected (.active — secret): bg rgba(245,158,11,0.12), border rgba(245,158,11,0.30), color --accent-amber
```

---

## PWA Install Banner

```
Position:     fixed bottom 0, full width
Padding:      14px 24px
Background:   --bg-surface
Border-top:   1px solid --border-subtle
Z-index:      900
Layout:       flex, space-between, align-center
```
