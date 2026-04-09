# Screen Map — Bitnova Kanban

Inventario completo de todas las pantallas/overlays del app, sus conexiones de navegación y los elementos de UI que contienen. Usar como referencia al armar el flujo en Figma.

---

## Mapa de navegación

```
┌─────────────────────────────────────────────────────────────────┐
│                         UNAUTHENTICATED                         │
│                                                                 │
│  [S1 Login] ──── clic "Continuar con Google" ──────────────┐   │
│      │                                                      │   │
│      │── clic en magic link de invitación ──► [S2 Email    │   │
│      │                                         Confirm]     │   │
│      │                                           │          │   │
│      │── "¿Olvidaste tu contraseña?" ────────────│──────►  │   │
│      │   (email reset → link en correo)          │  [S4     │   │
│      │                                           │  Reset]  │   │
│      │                                           │          │   │
│      └──────────── email+pass correcto ──────────┘          │   │
│                                          │                  │   │
└──────────────────────────────────────────│──────────────────│───┘
                                           ▼                  │
                                    [S3 Account Setup]        │
                                    (1ª vez solamente)        │
                                           │                  │
                             ┌─────────────┘◄────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                          AUTHENTICATED                          │
│                                                                 │
│  ┌─────────── Header ─────────────────────┬─── Header Actions ─────┐  │
│  │  Logo │ [Tablero] [Métricas]           │ Sync · Admin · User    │  │
│  │        │ [Archivados] [Proyectos]       │                       │  │
│  └────────┴────────────────────────────────┴───────────────────────┘  │
│                                                                        │
│  Tab "Tablero" ───────────────────────► [S5 Board View]               │
│  Tab "Métricas" ──────────────────────► [S6 Analytics View]           │
│  Tab "Archivados" ────────────────────► [S7 Archive View]             │
│  Tab "Proyectos" ─────────────────────► [S10 Projects View]           │
│  Tab "Snapshot" ──────────────────────► [S11 Snapshot View]           │
│                                                                        │
│  Clic en tarjeta o "+ Agregar" ───────► [S8 Card Modal]               │
│  Clic "Admin" (solo admins) ──────────► [S9 Admin Panel]              │
│  Clic en propuesta Snapshot ──────────► [S11a Detail Overlay]         │
└─────────────────────────────────────────────────────────────────┘
```

---

## S1 — Login Screen

**ID:** `loginOverlay`  
**Tipo:** Pantalla completa, always-on-top (z-index 200)  
**Fondo:** `--bg-deep`

| Zona | Elementos |
|------|-----------|
| Logo | Icono PNG 64×64 + "BITNOVA LABS" gradient |
| Subtitle | "Acceso por invitación" |
| Formulario | Input email · Input password |
| Acciones | Btn "Iniciar sesión" · Link "¿Olvidaste tu contraseña?" |
| Divider | "o" |
| OAuth | Btn "Continuar con Google" |
| Toggle | Link "Iniciar sesión con enlace de correo" → expande sección con input email + Btn "Enviar enlace" |
| Feedback | `.login-error` (error/success) · `.login-loading` ("Conectando...") |

**Transiciones salientes:**
- Email+pass correcto → S5 Board View
- Google OK → S3 Setup (si es 1ª vez) o S5 Board View
- Magic link en correo → S2 Email Confirm
- Reset link en correo → S4 Password Reset

---

## S2 — Email Confirm Screen

**ID:** `emailConfirmOverlay`  
**Tipo:** Overlay completo (z-index 6000)  
**Cuándo aparece:** Usuario invitado hace clic en su magic link y el email no está en localStorage  
**Fondo:** `--bg-deep`  
**Card:** mismo estilo que `.reset-card` — bg-surface, border-subtle, radius-xl, 420px max

| Zona | Elementos |
|------|-----------|
| Título | "Confirmá tu correo" |
| Subtitle | "Ingresá el correo al que llegó tu invitación…" |
| Campo | Input email (type=email, autocomplete=email, Enter = submit) |
| CTA | Btn "Continuar" (btn-setup) |
| Error | `.setup-error` |

**Transición saliente:** Email válido → Firebase sign-in via email link → S3 Account Setup

---

## S3 — Account Setup Screen

**ID:** `setupOverlay`  
**Tipo:** Overlay completo (z-index 5000)  
**Cuándo aparece:** Primera vez de cualquier usuario (invite pendiente o sin team doc)  
**Fondo:** `--bg-deep`  
**Card:** `.setup-card` — bg-surface, border-subtle, radius-xl, 420px max

| Zona | Elementos |
|------|-----------|
| Título | "Bienvenido/a" |
| Subtitle | "Configurá tu perfil para comenzar" |
| Campo | Input texto — "Tu nombre" |
| Nota | Texto 12px muted: "Creá una contraseña para ingresar…" (solo si needsPassword) |
| Campo | Input password "Contraseña" (condicional: no Google) |
| Campo | Input password "Confirmá tu contraseña" (condicional) |
| CTA | Btn "Comenzar" (btn-setup) |
| Error | `.setup-error` |

**Transición saliente:** Save exitoso → S5 Board View

---

## S4 — Password Reset Screen

**ID:** `resetOverlay`  
**Tipo:** Overlay completo (z-index 6000)  
**Cuándo aparece:** Usuario llega desde link de reset en correo (`?mode=resetPassword&oobCode=…`)  
**Fondo:** `--bg-deep`  
**Card:** `.reset-card` — bg-surface, border-subtle, radius-xl, 420px max

| Zona | Elementos |
|------|-----------|
| Título | "Nueva contraseña" |
| Subtitle | "Ingresá y confirmá tu nueva contraseña" |
| Campo | Input password "Nueva contraseña" |
| Campo | Input password "Confirmá la contraseña" |
| CTA | Btn "Guardar contraseña" (btn-setup) |
| Error | `.setup-error` |
| Éxito | Banner verde + Btn "Ir al inicio de sesión" |

**Estado de error:** Código inválido/expirado → redirige a S1 con mensaje  
**Transición saliente:** Guardar exitoso → clic "Ir al inicio de sesión" → S1 Login

---

## S5 — Board View (vista principal)

**ID:** Vistas: `#appHeader` + `#appToolbar` + `#board`  
**Cuándo aparece:** Nav tab "Board" activo (default)  
**Layout:** Columnas horizontales con scroll horizontal

### Header (persistente en S5/S6/S7)

| Zona | Elementos |
|------|-----------|
| Izquierda | Logo BITNOVA LABS |
| Centro | Nav tabs: Tablero · Métricas · Archivados · Proyectos |
| Derecha | Dot sync · Btn Admin (solo admins) · Avatar 28px · Nombre · Btn Logout |

### Toolbar (solo en Board View)

| Elemento | Detalles |
|----------|----------|
| Btn "Nueva tarjeta" | btn-primary, abre S8 |
| Btn "Swimlanes" | toggle on/off swimlane grouping |
| Separator | 1px vertical |
| Filter chips | "Todo" · "Urgente" · "Bloqueadas" · "Vence hoy" |
| Separator | |
| Búsqueda | search-box, max 220px |
| Separator | |
| Btn Exportar | descarga JSON |

### Board

5 columnas con scroll vertical independiente:

| Columna | Color | WIP |
|---------|-------|-----|
| Backlog / Leads | Indigo `#6366f1` | — |
| En Análisis | Blue `#3b82f6` | 5 |
| En Desarrollo | Cyan `#06b6d4` | 4 |
| Testing / Revisión | Amber `#f59e0b` | 3 |
| Desplegado / Cerrado | Emerald `#10b981` | — |

**Por columna:**  
- Header: barra color 4×20px · Título uppercase · Badge count (WIP) · WIP indicator  
- Body: tarjetas apiladas verticalmente (gap 8px)  
- Footer: Btn "+ Agregar tarjeta" dashed

**Kanban Card:**  
- Barra prioridad 3px top (rose/orange/amber/emerald)  
- Labels pills  
- Project code badge  
- Título (2 líneas)  
- Descripción (2 líneas, clamp)  
- Checklist progress bar  
- Footer: Avatars apilados · Meta (comentarios, attachments, fecha)  
- Estado bloqueado: borde left rose + ⛔ icon  
- Drag & drop entre columnas

---

## S6 — Analytics View

**ID:** `analyticsView`  
**Cuándo aparece:** Nav tab "Métricas"

| Sección | Contenido |
|---------|-----------|
| Stats grid (4 cols) | Total tarjetas · Tasa completado · Bloqueadas · Checklist promedio |
| Chart — Columnas | Bar chart, 5 barras por columna |
| Chart — Prioridades | Bar chart, 4 barras |
| Chart — Labels | Bar chart, 8 barras |
| Chart — Carga equipo | Bar chart, un ítem por miembro con conteo de tarjetas activas |

Cada stat card: label uppercase muted · valor Space Grotesk 32px · unidad · tendencia (↑↓)

---

## S7 — Archive View

**ID:** `archiveView`  
**Cuándo aparece:** Nav tab "Archivados"

| Elemento | Detalles |
|----------|----------|
| Header de sección | Título + conteo total |
| Search | archive-search, max 400px |
| Lista | `.archive-item` por cada tarjeta archivada |

**Cada archive item (accordion):**  
- Header: Título · Reason badge (completed/suspended) · Fecha · Chevron  
- Detail (expandible): grid 2 cols — Columna original · Archivado por · Prioridad · Labels · Assignees · Descripción  
- Footer: Btn "Restaurar tarjeta"

---

## S8 — Card Modal

**ID:** `modalOverlay`  
**Tipo:** Modal centrado, backdrop blur (z-index 1000)  
**Modos:** Crear (sin id) / Editar (con id)

| Sección | Campos |
|---------|--------|
| Header | Título del modal · Btn ✕ cerrar |
| Row 1 | Input título (full width) |
| Row 2 | Select columna · Select prioridad |
| Row 3 | Input código proyecto |
| Labels | Picker multi-select con color pills |
| Assignees | Picker multi-select con avatars |
| Descripción | Textarea |
| Checklist | Lista items + input para agregar |
| Fecha | Input date |
| Bloqueada | Checkbox |
| Footer | Btn Archivar (solo en modo editar) · Btn Eliminar (solo editar) · Btn Crear/Guardar |

---

## S9 — Admin Panel

**ID:** `adminModal`  
**Tipo:** Modal 700px, backdrop blur (z-index 1000)  
**Visible solo para:** Usuarios con doc en `admins/{email}`

| Sección | Elementos |
|---------|-----------|
| Header | "Acceso al equipo" · Btn ✕ |
| Invitar | Input email + Btn "Enviar invitación" + `.invite-feedback` |
| Lista | Tabla: Correo · Invitado por · Fecha · Estado badge · Btn Revocar |
| Estado badges | `pending` (amber) · `accepted` (emerald) |

---

## S10 — Projects View

**ID:** `projectsView`  
**Cuándo aparece:** Nav tab "Proyectos"  
**Layout:** Full-width content area. Header bar has a pill tab toggle: **Activos** / **Archivados**.

### Sub-tab: Activos (default)

| Elemento | Detalles |
|----------|----------|
| Header bar | Título · Tab toggle con conteos · Btn CSV · Btn JSON · Btn "Nuevo Proyecto" |
| Toolbar | Search box (max 320px) |
| Selection bar | Visible when rows checked — count · "Deseleccionar todo" · "Archivar seleccionados" (amber) · "Eliminar seleccionados" (rose) |
| Table | Checkbox · Código · Nombre · Tipo · Contacto · Teléfono · E-mail · Vendedor · Team Leader · Creado · Actions |
| Empty state | Icon + message (search or no data variant) |

**Table columns (hidden on mobile):** Teléfono, E-mail.

**Row actions (`.col-action`, 80px):**
- ⊕ icon button → opens S8 Card Modal pre-filled with project code
- 📦 icon button (amber hover) → opens archive confirmation modal (single project)

**Checkbox selection → selection bar:**
- "Archivar seleccionados" → archive confirmation modal (batch)
- "Eliminar seleccionados" → delete confirmation modal (batch)

### Sub-tab: Archivados

| Elemento | Detalles |
|----------|----------|
| Header bar | Título · Tab toggle con conteos (sin export/nueva buttons) |
| Table | Código · Nombre · Tipo · Motivo badge · Archivado por · Fecha · Btn Restaurar |
| Empty state | "No hay proyectos archivados." |

**Row action:** "Restaurar" button (emerald tint) → project moves back to Activos tab.

### Archive Confirmation Modal

Opens from per-row archive btn or "Archivar seleccionados". Renders into `#modalOverlay` / `#modalContent`.

1. List of projects to be archived (code badge + name)
2. Reason picker: **Completado** / **Cancelado** (required pill toggle)
3. Footer: Cancelar · Archivar (disabled until reason chosen)

### CRUD flows
- "Nuevo Proyecto" → form modal → auto-generates `BL{YY}-{NN}` code
- Archive → `archived: true` + metadata fields written in place (same document)
- Restore → `archived: false`, metadata fields deleted
- Batch delete → permanent; confirmation required

---

## S11 — Snapshot View (List)

**ID:** `snapshotView`  
**Cuándo aparece:** Nav tab "Snapshot"  
**Layout:** Full-width content area. Header bar has a pill tab toggle: **Activas** / **Archivadas**.

### Sub-tab: Activas (default)

| Elemento | Detalles |
|----------|----------|
| Header bar | Título "Snapshot" · Tab toggle · Btn "Nueva Propuesta" (btn-primary) |
| Table | Título · Privacidad badge · Tiempo restante (countdown) · VP Base · Opciones · Creado por · Archivar icon |
| Empty state | Icon + "No hay propuestas activas." |

**Privacidad badge:** PUBLIC (cyan, eye icon) · SECRET (amber, lock icon).

**Countdown column:** live-ticking JetBrains Mono timer. Color: emerald → amber → rose with pulse below 10%.

**Row click on Título:** opens S11a Snapshot Detail Overlay.

**Archive icon (amber hover):** opens simple archive confirmation modal → proposal moves to Archivadas.

### Sub-tab: Archivadas

| Elemento | Detalles |
|----------|----------|
| Header bar | Título · Tab toggle (sin "Nueva Propuesta") |
| Table | Título · Privacidad · Finalizó · VP Base · Creado por |
| Empty state | "No hay propuestas archivadas." |

**Row click on Título:** opens S11a in read-only / results mode.

### Create Proposal Modal

Opens from "Nueva Propuesta". Renders into `#modalOverlay` / `#modalContent`.

1. Título (required)
2. Descripción (optional textarea)
3. Duración (select from timespan options) + VP por participante (number, default 100)
4. Privacidad picker: Pública / Secreta (pill toggle)
5. Options builder: min 2 named options, add/remove rows
6. Footer: Cancelar · Crear Snapshot

---

## S11a — Snapshot Detail Overlay (Voting Workspace)

**ID:** `snapshotDetailOverlay`  
**Tipo:** Full-screen overlay, z-index 1100, backdrop blur  
**Triggered by:** clicking proposal title in S11 list

### Active State (not expired)

| Zona | Elementos |
|------|-----------|
| Header | Privacy badge · Título · Descripción · Close button |
| VP Tracker (sticky) | Glassmorphism bar — "Tu Voting Power: [balance] / [total]" + budget progress bar |
| Timer | `.snapshot-countdown` — large ticking clock (color shifts) |
| Options workspace | One `.snapshot-option-card` per option — label + number input + weight % |
| Results sidebar | PUBLIC: live bar chart. SECRET: "🔒 Resultados Cifrados" placeholder |
| Footer | `.snapshot-commit-btn` — disabled until ≥ 1 VP allocated and not exceeded |

**VP validation:**
- `balance = baseVP − Σ inputs`
- `balance < 0` → bar turns rose, commit disabled, visual warning
- `Σ ≥ 1 AND balance ≥ 0` → commit enabled

**Submit:** writes/overwrites `snapshots/{id}/votes/{uid}`. User may re-submit while active.

### Finality State (expired)

Triggered when countdown reaches zero OR when opening an already-expired proposal.

1. **Flash animation** (`snapshot-flash` 0.8s) fires.
2. All inputs disabled (`.snapshot-frozen` class).
3. **Finality Banner:** "⚡ Snapshot Finalizado — Estado capturado e inmutable."
4. **Results bar chart** shown regardless of privacy setting.
5. **Verification Stamp:** Snapshot ID · Timestamp of Finality · Participantes · VP Total Gastado.

### CRUD Flows

- Create → `snapshots/{auto-id}` written with `status: 'active'` + `expiresAt` ISO string
- Vote → `snapshots/{id}/votes/{uid}` set (overwritable while active)
- Expiry → client-side detection; no Firestore write needed to "expire"
- Archive → `status: 'archived'`; proposal moves to Archivadas tab; detail still readable

---

## Flujos de estado de error

| Situación | Pantalla | Mensaje |
|-----------|----------|---------|
| Credenciales incorrectas | S1 | `.login-error` rose |
| Cuenta sin invitación | S1 | "Acceso solo por invitación" |
| Reset link expirado | S1 | "El enlace es inválido o ya expiró" |
| Email confirm incorrecto | S2 | `.setup-error` rose |
| Contraseñas no coinciden | S3 / S4 | `.setup-error` rose |
| Error Firestore (write) | Toast | "❌ Error al crear/guardar" |
| Sin conexión | Header dot | amber dot, sin pulso |

---

*Last updated: 2026-04-09*
