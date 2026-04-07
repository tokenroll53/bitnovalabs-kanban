# Typography

Three Google Fonts with distinct roles. Import all three before building in Figma.

---

## Fonts

| Token | Font | Weights used | Role |
|-------|------|-------------|------|
| `--font-display` | **Space Grotesk** | 700 only | Headings, column titles, logo, stat numbers |
| `--font-sans` | **DM Sans** | 400, 500, 600, 700 | All body text, buttons, inputs, nav |
| `--font-mono` | **JetBrains Mono** | 400, 600, 700 | Numbers, dates, codes, timestamps, badges |

**Google Fonts import URL:**
```
https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;700&display=swap
```

Base rendering: `-webkit-font-smoothing: antialiased` on `body`.

---

## Type Scale

### Display — Space Grotesk 700

| Name | Size | Weight | Letter-spacing | Line-height | Use |
|------|------|--------|---------------|-------------|-----|
| Display / Stat | 32px | 700 | default | default | Analytics stat values |
| Display / H1-Login | 22px | 700 | 2px | default | Login card heading |
| Display / H2 | 20px | 700 | default | default | Modal titles, Archive section heading |
| Display / Chart | 15px | 700 | default | default | Chart section titles |
| Display / Column | 13px | 700 | 0.8px | default | Column headers (uppercase) |
| Display / Logo | 17px | 700 | 3.5px | 1 | App logo text |

### Body — DM Sans

| Name | Size | Weight | Letter-spacing | Use |
|------|------|--------|---------------|-----|
| Body / Large | 14px | 500 | default | Archive item titles, Google sign-in button |
| Body / Default | 13px | 400–600 | default | Buttons, card titles (600), modal inputs, toast messages, nav tabs (500) |
| Body / Small | 12px | 400–600 | default | Filter chips (500), search input, checklist modal items |
| Body / XSmall | 11px | 600 | 0.5px | Section labels (uppercase), label pills, stat labels (uppercase) |
| Body / Login-sub | 13px | 400 | default | Login subtitle |

### Mono — JetBrains Mono

| Name | Size | Weight | Use |
|------|------|--------|-----|
| Mono / Badge | 11px | 600 | Column card count badge, archive date |
| Mono / Meta | 10px | 400 | Card due date, checklist progress text, chart labels, bar values |
| Mono / Code | 10px | 600 | Project code badge (letter-spacing: 0.5px) |
| Mono / Stat-unit | 13px | 400 | Stat unit label in analytics |

---

## Specific Text Treatments

### Logo
```
Font:           Space Grotesk 700
Size:           17px
Letter-spacing: 3.5px
Line-height:    1
"BITNOVA":      gradient text (silver → champagne)
"LABS":         gradient text (champagne → gold)
Technique:      -webkit-background-clip: text / -webkit-text-fill-color: transparent
```

### Column Titles
```
Font:           Space Grotesk 700
Size:           13px
Transform:      uppercase
Letter-spacing: 0.8px
Color:          --text-primary
```

### Section / Field Labels
```
Font:           DM Sans 600
Size:           11px
Transform:      uppercase
Letter-spacing: 0.5px
Color:          --text-muted
```

### Card Title
```
Font:           DM Sans 600
Size:           13px
Line-height:    1.4
Color:          --text-primary
```

### Card Description
```
Font:           DM Sans 400
Size:           11px
Line-height:    1.5
Color:          --text-secondary
Clamp:          2 lines (-webkit-line-clamp: 2)
```

### Label Pills
```
Font:           DM Sans 600
Size:           10px
Letter-spacing: 0.3px
Transform:      none
```

### Swimlane Headers
```
Font:           DM Sans 600
Size:           11px
Transform:      uppercase
Letter-spacing: 0.5px
Color:          --text-muted
```

---

## Text Truncation Patterns

| Pattern | Where used |
|---------|-----------|
| `-webkit-line-clamp: 2` | Card description on board |
| `overflow: hidden; text-overflow: ellipsis; white-space: nowrap` | User name in header (max-width: 100px) |
