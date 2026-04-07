# Bitnova Kanban — Design System

This folder documents the complete design system extracted from the current app (`index.html`). It is the source of truth for recreating and extending the UI in Figma.

The visual language is a **dark-only, high-contrast, developer-focused** interface. Deep navy/slate backgrounds, blue-spectrum accents, three distinct typefaces with clear hierarchy roles, and a consistent border-radius scale.

---

## Files in this folder

| File | Contents |
|------|----------|
| `01-colors.md` | Full color palette — backgrounds, text, accents, column colors, label colors |
| `02-typography.md` | Fonts, type scale, weight and spacing rules |
| `03-spacing-radius-shadows.md` | Spacing system, border radius scale, shadows, transitions |
| `04-components.md` | Every UI component with exact measurements and states |
| `05-data-tokens.md` | Labels, priorities, columns, team member colors |

---

## Figma setup checklist

- [ ] Import the three Google Fonts: **Space Grotesk** (700), **DM Sans** (400, 500, 600, 700), **JetBrains Mono** (400, 600, 700)
- [ ] Create a color styles library from `01-colors.md`
- [ ] Create text styles from `02-typography.md`
- [ ] Create effect styles (shadows) from `03-spacing-radius-shadows.md`
- [ ] Build base components from `04-components.md`
- [ ] Add label/priority/column tokens from `05-data-tokens.md`

---

## Design principles

**Dark-only.** No light mode exists. All surfaces are dark navy/slate.

**Layered depth.** Six background levels create visual hierarchy without borders alone: `bg-deep` → `bg-primary` → `bg-surface` → `bg-card` → `bg-card-hover` → `bg-elevated`.

**Subtle borders.** Borders use low-opacity blue at rest (`rgba(99,132,185,0.12)`) and a brighter blue on hover/active (`rgba(99,182,255,0.3)`).

**Three font roles.** Space Grotesk = display/headings. DM Sans = body/UI. JetBrains Mono = data/numbers.

**Color-coded meaning.** Priorities, labels, columns, and team members all use a consistent accent color set. The same emerald that means "low priority" also means "done" and "sync OK."

**Micro-motion.** Two transition speeds: 150ms fast (hover, focus) and 250ms smooth (modals, panels). Easing is always `cubic-bezier(0.4, 0, 0.2, 1)` (Material standard ease).

*Last updated: 2026-04-07*
