# Plan: Modularización Opción A — ES Modules sin build tool

> **Estado: COMPLETADO** (rama `refactor/modularizacion-opcion-a`, 2026-04-08)
> Todas las fases implementadas. `index.html` es ahora una cáscara limpia.

## Contexto

`index.html` era un monolito de ~3600 líneas con CSS, HTML y JS mezclados. El objetivo fue separarlo en archivos con responsabilidades claras usando ES Modules nativos del navegador — sin agregar npm, bundler ni ninguna dependencia nueva. GitHub Pages sigue funcionando igual.

---

## Estructura final de archivos

```
bitnovalabs-kanbas/
├── index.html                  ← Solo HTML + <link> CSS + <script type="module" src="js/app.js">
├── css/
│   ├── variables.css           ← :root tokens (colores, radios, sombras, fuentes, transiciones)
│   ├── reset.css               ← *, html, body, scrollbar
│   ├── animations.css          ← @keyframes (pulse-warn, syncPulse, slideUp, fadeOut, loginFadeIn)
│   ├── auth.css                ← login-overlay, setup-overlay, reset-overlay, emailConfirm-overlay
│   ├── header.css              ← app-header, logo, nav-tabs, user-info, sync-status, btn-logout, btn-admin
│   ├── toolbar.css             ← toolbar, toolbar-group, filter-chip, search-box
│   ├── board.css               ← board-wrapper, column, column-header, column-body, swimlane, add-card-btn
│   ├── card.css                ← .card y todos sus sub-elementos (priority bar, labels, footer, avatar, meta)
│   ├── modal.css               ← modal-overlay, modal, form controls, checklist, label/assignee picker
│   ├── analytics.css           ← analytics-view, stat-card, chart-container, bar charts
│   ├── archive.css             ← archive-view, archive-item, archive-detail, badges
│   ├── admin.css               ← admin panel body, invite-form, invite-table, badges, btn-revoke
│   ├── pwa.css                 ← PWA install banner
│   └── responsive.css          ← @media (max-width: 768px)
│
└── js/
    ├── firebase.js             ← initializeApp + export auth, db
    ├── config.js               ← COLUMNS, LABELS, PRIORITIES, AVATAR_PALETTE, isMobile()
    ├── state.js                ← Estado compartido con getters/setters
    ├── ui.js                   ← toast(), escHtml(), formatDate(), getDueClass(), exportData(), PWA
    ├── firestore.js            ← firestoreSave/Delete/Archive/Restore + startFirestoreListeners()
    ├── board.js                ← renderBoard(), createCardElement(), drag & drop, filtros
    ├── modal.js                ← renderCardModal(), saveCard(), deleteCard(), addChecklistItem()
    ├── analytics.js            ← renderAnalytics()
    ├── archive.js              ← renderArchive(), promptArchive(), restoreCard(), deleteArchivedCard()
    ├── admin.js                ← loadTeam(), openAdminPanel(), sendInvitation(), loadInviteList(), revokeInvite()
    ├── auth.js                 ← todos los flows de auth + onAuthStateChanged + setup screen
    └── app.js                  ← Entry point: event listeners, navegación, inicialización
```

---

## Grafo de dependencias

```
firebase.js   ← no imports (usa global window.firebase de CDN)
config.js     ← no imports
state.js      ← import config.js (AVATAR_PALETTE para getNextAvatarColor)
ui.js         ← import state.js (para exportData que lee cards/archivedCards/TEAM)
firestore.js  ← import firebase.js, state.js, ui.js, board.js, analytics.js, archive.js
board.js      ← import state.js, config.js, ui.js
modal.js      ← import state.js, config.js, ui.js, firestore.js, board.js
analytics.js  ← import state.js, config.js
archive.js    ← import state.js, ui.js, firestore.js
admin.js      ← import firebase.js, state.js, ui.js, firestore.js
auth.js       ← import firebase.js, state.js, ui.js, admin.js, board.js, analytics.js, archive.js
app.js        ← import todo lo anterior + wires event listeners
```

**Nota:** Los scripts CDN de Firebase (`firebase-app-compat.js`, etc.) son `<script>` regulares (no módulos). Se ejecutan antes que cualquier `<script type="module">`. Por eso `window.firebase` está disponible cuando `firebase.js` (módulo) se ejecuta.

---

## Diseño de state.js

```js
// js/state.js
import { AVATAR_PALETTE } from './config.js';

let _cards = [];
let _archivedCards = [];
let _team = [];
let _currentUser = null;
let _currentView = 'board';
let _currentFilter = 'all';
let _searchQuery = '';
let _swimlanesEnabled = false;
let _unsubCards = null;
let _unsubArchived = null;

export const getCards = () => _cards;
export const setCards = (v) => { _cards = v; };
export const getArchivedCards = () => _archivedCards;
export const setArchivedCards = (v) => { _archivedCards = v; };
export const getTeam = () => _team;
export const setTeam = (v) => { _team = v; };
export const getCurrentUser = () => _currentUser;
export const setCurrentUser = (v) => { _currentUser = v; };
export const getCurrentView = () => _currentView;
export const setCurrentView = (v) => { _currentView = v; };
export const getCurrentFilter = () => _currentFilter;
export const setCurrentFilter = (v) => { _currentFilter = v; };
export const getSearchQuery = () => _searchQuery;
export const setSearchQuery = (v) => { _searchQuery = v; };
export const isSwimlaneEnabled = () => _swimlanesEnabled;
export const setSwimlaneEnabled = (v) => { _swimlanesEnabled = v; };
export const getUnsubCards = () => _unsubCards;
export const setUnsubCards = (v) => { _unsubCards = v; };
export const getUnsubArchived = () => _unsubArchived;
export const setUnsubArchived = (v) => { _unsubArchived = v; };

export function getNextAvatarColor() {
  const used = new Set(_team.map(t => t.color));
  return AVATAR_PALETTE.find(c => !used.has(c)) ?? AVATAR_PALETTE[_team.length % AVATAR_PALETTE.length];
}
```

---

## Fases implementadas

| Fase | Descripción | Commit |
|------|-------------|--------|
| 1 — CSS Split | 14 archivos CSS extraídos, `<link>` tags en `<head>` | _(incluido en fases posteriores)_ |
| 2 — Fundacionales | `firebase.js`, `config.js`, `state.js`, `ui.js` | _(incluido en fases posteriores)_ |
| 3 — Firestore | `firestore.js` con `startFirestoreListeners()` | `3d06831` |
| 4 — Features | `board.js`, `modal.js`, `analytics.js`, `archive.js` | `02ae17c` |
| 5 — Auth/Admin | `admin.js`, `auth.js` con todos los flows | `f058e91` |
| 6 — Entry point | `app.js`, `addEventListener` reemplaza `onclick` | `e6184a6` |
| 7 — Limpieza | Bloque `<script>` monolítico eliminado de `index.html` | `6faaed3` |

### Decisión de diseño — Fase 3

`startFirestoreListeners()` recibe callbacks para evitar imports circulares:

```js
// firestore.js
export function startFirestoreListeners({ onCardsUpdate, onArchiveUpdate }) { ... }
```

Los callbacks (`renderBoard`, `renderAnalytics`, `renderArchive`) se pasan desde `app.js`.

---

## Próximo paso: Opción B (Vite)

La estructura `js/` y `css/` es directamente compatible con Vite. La migración solo requiere:
- Agregar `package.json` y `vite.config.js`
- Actualizar los `<script>` tags en `index.html`
- Mover imports de Firebase de CDN a npm package
