# Plan: Modularización Opción A — ES Modules sin build tool

## Contexto

`index.html` es un monolito de ~3600 líneas con CSS, HTML y JS mezclados. Cualquier cambio roza código no relacionado. El objetivo es separarlo en archivos con responsabilidades claras usando ES Modules nativos del navegador — sin agregar npm, bundler ni ninguna dependencia nueva. GitHub Pages sigue funcionando igual.

El trabajo se dividirá en 7 fases ordenadas por nivel de riesgo ascendente. Cada fase valida antes de avanzar. Al terminar, `index.html` quedará como una cáscara limpia que solo contiene el HTML y los `<link>`/`<script>` necesarios.

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

## Grafo de dependencias (import order)

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

**Nota crítica:** Los scripts CDN de Firebase (`firebase-app-compat.js`, etc.) son `<script>` regulares (no módulos). Se ejecutan antes que cualquier `<script type="module">`. Por eso `window.firebase` está disponible cuando `firebase.js` (módulo) se ejecuta. No se necesita `import` de npm.

---

## Diseño de state.js

El estado compartido centralizado es la pieza más crítica. Usará un objeto plano con funciones exportadas para get/set:

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

## Fases de implementación

### Fase 1 — CSS Split (riesgo: ninguno)

Mover todos los bloques CSS a sus archivos. El HTML no cambia, solo el `<head>` agrega `<link>` tags.

**Bloques a mover** (referencia de líneas en `index.html` actual):
| Archivo | Líneas origen |
|---------|--------------|
| `variables.css` | 20–57 (`:root`) |
| `reset.css` | 59–99 (reset, scrollbar) |
| `animations.css` | Todos los `@keyframes` distribuidos en el CSS |
| `header.css` | 101–215 (header, logo, nav, buttons base, user-info, sync, logout, admin btn) |
| `toolbar.css` | 217–314 (toolbar, filter chips, search boxes) |
| `board.css` | 316–458 (board wrapper, columns, swimlanes) |
| `card.css` | 460–720 (card completa y sub-elementos) |
| `modal.css` | 722–940 (modal overlay, form, checklist, label picker) |
| `analytics.css` | 941–957 (analytics view) |
| `archive.css` | 957–1277 (archive items, detail, badges) |
| `pwa.css` | PWA install banner |
| `auth.css` | 1316–1657 (login, setup, reset, email-confirm overlays) |
| `admin.css` | 1833–1981 (admin panel, invite table) |
| `responsive.css` | 1316–1363 (@media queries) |

**Validación:** App se ve idéntica. Revisar todas las pantallas visualmente.

---

### Fase 2 — Módulos fundacionales (riesgo: bajo)

Crear `firebase.js`, `config.js`, `state.js`, `ui.js`. No tocan el JS existente aún — coexisten con el `<script>` original.

**`firebase.js`:**
```js
const FIREBASE_CONFIG = { /* copiar del index.html */ };
firebase.initializeApp(FIREBASE_CONFIG);
export const auth = firebase.auth();
export const db = firebase.firestore();
db.enablePersistence({ synchronizeTabs: true }).catch(() => {});
```

**`config.js`:** Exportar COLUMNS, LABELS, PRIORITIES, AVATAR_PALETTE, isMobile()

**`state.js`:** Como diseñado arriba

**`ui.js`:** Exportar toast(), escHtml(), formatDate(), getDueClass(), exportData()

---

### Fase 3 — Capa de datos: firestore.js (riesgo: bajo-medio)

Extraer todas las funciones de Firestore y `startFirestoreListeners()`. Esta función necesita callbacks hacia `renderBoard()`, `renderAnalytics()`, `renderArchive()` — se pasarán como parámetros en `app.js` para evitar imports circulares:

```js
// firestore.js
export function startFirestoreListeners({ onCardsUpdate, onArchiveUpdate }) { ... }
```

---

### Fase 4 — Módulos de feature (riesgo: medio)

Orden: `board.js` → `modal.js` → `analytics.js` → `archive.js`

Cada módulo exporta sus funciones públicas y las hace disponibles en `window` temporalmente para que el HTML inline (`onclick="..."`) siga funcionando durante la migración:

```js
// Al final de board.js (temporal hasta migrar event listeners a app.js)
window.openNewCardModal = openNewCardModal;
window.openCardDetail = openCardDetail;
```

Esto permite migrar módulo por módulo sin romper los `onclick` del HTML hasta la Fase 6.

---

### Fase 5 — admin.js + auth.js (riesgo: medio)

Extraer primero `admin.js` (más simple), luego `auth.js` que orquesta todos los flows de autenticación incluyendo `onAuthStateChanged`.

---

### Fase 6 — app.js: Entry point y limpieza de event listeners (riesgo: medio)

Reemplazar todos los `onclick="fn()"` del HTML por `addEventListener` en `app.js`:

```js
// app.js
import { renderBoard } from './board.js';
import { loginWithGoogle, loginWithEmail, ... } from './auth.js';
// ...

document.getElementById('loginGoogleBtn').addEventListener('click', loginWithGoogle);
document.getElementById('loginEmailBtn').addEventListener('click', loginWithEmail);
// etc.
```

Actualizar `index.html`:
```html
<!-- Reemplazar todo el bloque <script> existente con: -->
<script type="module" src="js/app.js"></script>
```

Eliminar los `window.xxx` temporales de las fases anteriores.

---

### Fase 7 — Limpieza y verificación final (riesgo: bajo)

- Eliminar el bloque `<script>` gigante de `index.html`
- Verificar que ningún `onclick` inline quede sin handler
- Test completo de todos los flows (login, invite, card CRUD, archive, analytics)

---

## Archivos críticos a modificar

| Archivo | Acción |
|---------|--------|
| `index.html` | Agregar `<link>` CSS en head; reemplazar `<script>` por `<script type="module" src="js/app.js">` |
| `js/firebase.js` | Nuevo |
| `js/config.js` | Nuevo |
| `js/state.js` | Nuevo |
| `js/ui.js` | Nuevo |
| `js/firestore.js` | Nuevo |
| `js/board.js` | Nuevo |
| `js/modal.js` | Nuevo |
| `js/analytics.js` | Nuevo |
| `js/archive.js` | Nuevo |
| `js/admin.js` | Nuevo |
| `js/auth.js` | Nuevo |
| `js/app.js` | Nuevo |
| `css/*.css` (14 archivos) | Nuevos |

**Total: 27 archivos nuevos, 1 archivo modificado (index.html).**

---

## Verificación por fase

| Fase | Cómo verificar |
|------|---------------|
| 1 — CSS | Abrir app en browser: todas las pantallas visualmente idénticas al original |
| 2 — Fundacionales | No hay cambio visible aún (módulos creados pero no usados) |
| 3 — Firestore | Login → board carga y sincroniza en tiempo real |
| 4 — Features | Board renderiza, cards CRUD, analytics y archive funcionan |
| 5 — Auth | Todos los flows: login email, Google, invite, setup, password reset |
| 6 — Entry point | `onclick` limpiados, no hay errores en consola, deploy a GitHub Pages OK |
| 7 — Final | Release Verification Checklist completo (secciones 1–7 de RELEASE_VERIFICATION.md) |

---

## Notas de branch

- Esta Fase A se hace en `main` de manera incremental
- Al terminar, se abre un nuevo branch para la Opción B (Vite)
- La estructura de carpetas `js/` y `css/` es directamente compatible con Vite — la migración posterior solo agrega `package.json`, `vite.config.js` y actualiza los `<script>` tags
