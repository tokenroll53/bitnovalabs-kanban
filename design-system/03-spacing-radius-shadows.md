# Spacing, Radius, Shadows & Motion

---

## Border Radius Scale

| Token | Value | Used on |
|-------|-------|---------|
| `--radius-sm` | `6px` | Buttons, inputs, nav tabs, search box, toast, filter chip dot, add-card button, modal close button, checklist items, chart bar tops |
| `--radius-md` | `10px` | Cards, modal backdrop blur target, login error box, Google button, sync dot container |
| `--radius-lg` | `14px` | Archive items, stat cards, chart containers |
| `--radius-xl` | `18px` | Modal window, login card |

**Special radius values (not tokenized):**
| Value | Where |
|-------|-------|
| `50%` | Avatars, user avatar, sync status dot |
| `20px` | Filter chips (pill shape) |
| `14px` | Label-option picker pills |
| `12px` | Archive reason badges |
| `11px` | Column count badge |
| `10px` | Label pills |
| `4px` | Project code badge |
| `3px` | Scrollbar thumb |
| `2px` | Column indicator bar, checklist progress bar |

---

## Shadows

| Token | Value | Used on |
|-------|-------|---------|
| `--shadow-card` | `0 2px 8px rgba(0,0,0,0.25), 0 1px 2px rgba(0,0,0,0.15)` | Card hover state |
| `--shadow-elevated` | `0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)` | Modal window, dragging card, toast |
| `--shadow-glow-blue` | `0 0 20px rgba(59,130,246,0.15)` | Focused inputs (box-shadow on focus) |

**Non-tokenized shadows:**
| Value | Where |
|-------|-------|
| `0 1px 3px rgba(0,0,0,0.12)` | Google button hover |

---

## Layout Dimensions

### App Shell
| Element | Value |
|---------|-------|
| Header height | `56px` (min-height also 56px) |
| Header padding | `0 24px` |
| Toolbar height | `44px` (min-height) |
| Toolbar padding | `10px 24px` |

### Kanban Board
| Element | Value |
|---------|-------|
| Column min-width | `300px` |
| Column max-width | `340px` |
| Column body padding | `4px 10px 60px` |
| Column body gap | `8px` |
| Column header padding | `14px 16px 10px` |
| Column indicator bar | `4px × 20px` |

### Cards
| Element | Value |
|---------|-------|
| Card padding | `12px` |
| Card gap in column | `8px` |
| Priority bar height | `3px` |
| Card footer padding-top | `8px` |
| Card labels gap | `4px`, margin-bottom `8px` |
| Card title margin-bottom | `6px` |
| Card description margin-bottom | `10px` |
| Card checklist margin-bottom | `10px` |

### Modal
| Element | Value |
|---------|-------|
| Modal width | `680px` |
| Modal max-width | `95vw` |
| Modal max-height | `90vh` |
| Modal header padding | `24px 24px 16px` |
| Modal body padding | `20px 24px` |
| Modal footer padding | `16px 24px` |
| Modal section margin-bottom | `20px` |
| Modal row gap | `12px` |
| Modal close button | `32px × 32px` |
| Modal heading font-size | `20px` |

### Login Card
| Element | Value |
|---------|-------|
| Login card padding | `48px 40px` |
| Login card max-width | `400px` |
| Login card width | `90%` |
| Login icon | `64px × 64px`, radius-md |
| Login heading margin-bottom | `6px` |
| Login subtitle margin-bottom | `32px` |

### Avatars
| Element | Value |
|---------|-------|
| Avatar size | `24px × 24px` |
| Avatar border | `2px solid --bg-card` |
| Avatar stack offset | `-6px` (margin-left) |
| User header avatar | `28px × 28px`, border `2px solid --border-subtle` |

### Toolbar & Filters
| Element | Value |
|---------|-------|
| Toolbar gap | `12px` |
| Toolbar group gap | `6px` |
| Toolbar separator | `1px × 20px` |
| Filter chip padding | `4px 10px` |
| Search box max-width | `220px` |

### Toast
| Element | Value |
|---------|-------|
| Toast padding | `12px 20px` |
| Toast position | `bottom: 24px, right: 24px` |
| Toast gap (stacked) | `8px` |

### Analytics
| Element | Value |
|---------|-------|
| Analytics padding | `24px` |
| Grid gap | `16px` |
| Stat card padding | `20px` |
| Chart container padding | `24px` |
| Chart bar height | `180px` |
| Chart bar max-width | `48px` |

---

## Motion

### Transition Tokens
| Token | Value | Use |
|-------|-------|-----|
| `--transition-fast` | `150ms cubic-bezier(0.4, 0, 0.2, 1)` | Hover states, filters, chips, nav tabs, archive items |
| `--transition-smooth` | `250ms cubic-bezier(0.4, 0, 0.2, 1)` | Modal open/close, card drag |

Easing `cubic-bezier(0.4, 0, 0.2, 1)` is the Material Design standard ease-in-out.

### Animations

| Name | Duration | Properties | Used on |
|------|----------|-----------|---------|
| `pulse-warn` | 2s, infinite | opacity 1 → 0.6 → 1 | WIP exceeded column count badge |
| `syncPulse` | 2s, infinite | opacity 1 → 0.4 → 1 | Sync status dot (online state) |
| `slideUp` | 0.3s | translateY(20px)+opacity:0 → 0+1 | Toast enter |
| `fadeOut` | 0.3s at 2.7s delay | opacity → 0 | Toast exit |
| `loginFadeIn` | 0.4s | opacity:0 + translateY(16px) + scale(0.96) → 1 + 0 + 1 | Login card enter |
| `checklist fill` | 0.3s ease | width | Checklist progress bar |
| `chart bar` | 0.5s ease | height | Analytics bar chart on render |
| Modal enter | 250ms | translateY(20px) + scale(0.97) → 0 + 1 | Modal open |

### Hover Micro-interactions
| Element | Effect |
|---------|--------|
| Card hover | `translateY(-1px)` + shadow + border brightens |
| Card dragging | `rotate(2deg) scale(0.98)` + elevated shadow |
| Chart bar hover | `filter: brightness(1.2)` |

---

## Scrollbar

Custom scrollbar applied globally via `::-webkit-scrollbar`:
- Width/height: `6px`
- Track: transparent
- Thumb: `--text-muted` (`#5a6e8f`), radius `3px`
- Thumb hover: `--text-secondary` (`#8b9dc3`)

---

## Responsive Breakpoint

Single breakpoint at `768px`:
| Change | Mobile value |
|--------|-------------|
| Header padding | `0 12px` |
| Header nav | hidden |
| Toolbar padding | `8px 12px`, overflow-x: auto |
| Column min-width | `280px` |
| Modal margin | `8px`, max-width `98vw` |
| Analytics grid | `repeat(2, 1fr)` |
