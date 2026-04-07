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

## PWA Install Banner

```
Position:     fixed bottom 0, full width
Padding:      14px 24px
Background:   --bg-surface
Border-top:   1px solid --border-subtle
Z-index:      900
Layout:       flex, space-between, align-center
```
